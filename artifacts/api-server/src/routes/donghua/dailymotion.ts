import axios from "axios";
import type { VideoServer } from "./scraper.js";

const DM_CHANNEL = "dongchindopro";
const DM_API = `https://api.dailymotion.com/user/${DM_CHANNEL}/videos`;
const REQUEST_TIMEOUT = 15000;
const CACHE_TTL_MS = 30 * 60 * 1000;
const MAX_PAGES = 10;
// On a cold cache, fetching all MAX_PAGES sequentially can take up to
// MAX_PAGES * REQUEST_TIMEOUT. getDailymotionServer is raced against this
// budget so a slow/cold lookup never holds up the anichin/Animasu servers
// response — the underlying fetch keeps running in the background and
// populates the cache for the next request regardless of whether this call
// waited for it.
const LOOKUP_BUDGET_MS = 8000;

interface DmVideo {
  id: string;
  title: string;
  created_time: number;
}

interface DmEntry {
  code: string;
  epStart: number;
  epEnd: number;
  videoId: string;
  createdTime: number;
}

let cache: { entries: DmEntry[]; fetchedAt: number } | null = null;
let inflight: Promise<DmEntry[]> | null = null;

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Manually maintained aliases: our site's series slug -> the normalized show
 * code that the `dongchindopro` Dailymotion channel uses in its upload titles.
 *
 * Matching is opt-in and exact on purpose: the channel's titles use ad-hoc
 * abbreviations (e.g. "BTTH", "ARMJI") that can't be derived automatically
 * from our slugs, and a wrong guess would show the wrong show's video. Add a
 * new line here only after confirming (via the Dailymotion API) that the
 * abbreviation on the channel really corresponds to that series slug.
 */
const SERIES_ALIASES: Record<string, string[]> = {
  // Site's actual slug for "BTTH Season 5" is this odd machine-translated
  // string, not "btth-season-5" (that key never matched a real episode slug
  // and silently gave this show zero Dailymotion coverage). Uploader labels
  // this show "BTTH", "BTTH 5", or its Chinese pinyin title "Doupo Cangqiong".
  "oyen-pertempuran-akhir-sekte-misty-cloud": ["btth", "btth5", "doupocangqiong5"],
  "coiling-dragon": ["coilingdragon"],
  "ever-night": ["evernight"],
  "perfect-world": ["perfectworld"],
  "azure-legacy": ["azurelegacy"],
  // Channel uses several title formats for this show: "[MSBS] My Senior Brother Steady",
  // "My Senior Brother Steady", "Senior Brother Steady", or the tag abbreviation "msbs".
  "my-senior-brother-is-too-steady": ["msbs", "seniorbrothersteady", "myseniorbrothersteady", "msbsmyseniorbrothersteady"],
  // "Way of Choices" is also known by its Chinese title "Ze Tian Ji" on the channel.
  "way-of-choices": ["wayofchoices", "zetianji"],
  "renegade-immortal": ["renegadeimmortal"],
  "swallowed-star": ["swallowedstar"],
  // anichin's episode slugs are inconsistently spelled across this show's run —
  // older episodes use the typo "shrounding", newer ones the correct
  // "shrouding" — so both prefixes are mapped to the same code.
  "shrounding-the-heavens": ["shroudingtheheavens"],
  "shrouding-the-heavens": ["shroudingtheheavens"],
  "tomb-of-fallen-gods-season-3": ["tomboffallengods3"],
  // "The Great Ruler" is also uploaded as "Da Zhu Zai" (Chinese pinyin title).
  "the-great-ruler": ["thegreatruler", "dazhuzai"],
  // Channel occasionally spells this "allone" (typo) instead of "alone".
  "walking-the-way-all-alone": ["walkingthewayalone", "walkingthewayallone"],
  "in-search-of-gods": ["insearchofgods"],
  "tales-of-herding-god": ["talesofherdinggods"],
  "purple-river-season-2": ["purpleriver2"],
  "slay-the-gods-season-2": ["slaythegods2"],
  // Channel omits "of" in some uploads: "The Other Side Deep Space" vs "The Other Side of Deep Space".
  "the-other-side-of-deep-space": ["theothersidedeepspace", "theothersideofdeepspace"],
  "eclipse-of-illusion-special-the-miasma-war": ["eclipseofillusionspecialthemiasmawar"],
  "100-000-years-of-refining-qi": ["100000refiningqi"],
  // NOTE: no confirmed alias for ARMJI — the site's "remake" season only has 8
  // episodes while the channel's "ARMJI" uploads are at ep 180+ (a different,
  // longer-running adaptation we don't currently carry). Do not add a mapping
  // here without finding an on-site season whose episode range actually
  // overlaps the channel uploads.
  "beyond-times-gaze": ["beyondtimesgaze"],
  "dragons-triumph-in-the-celestial-realm": ["dragonstriumphcelestialrealm"],
  // Channel omits "of" in many uploads: "The Gate Mystical Realm" vs "The Gate of Mystical Realm".
  "the-gate-of-mystical-realm": ["thegateofmysticalrealm", "thegatemysticalrealm"],
  // Channel uses both "Legend of Martial Immortal" and "Legend Martial Immortal" (drops "of").
  "legend-of-martial-immortal": ["legendofmartialimmortal", "legendmartialimmortal"],
  // Soul Land season 2 — channel titles it "Soul Land 2".
  "soul-land-season-2": ["soullandseason2", "soulland2"],
};

/**
 * Parses a dongchindopro upload title into {code, epStart, epEnd}.
 * Handles the two formats seen on the channel:
 *   "| Coiling Dragon | EP 8 - 14"  /  "Indo Sub | Ze Tian Ji | EP 23 - 26 End"
 *   "BTTH 5_Eps 207"  /  "Way of Choices_Eps 26 End"
 * Returns null if the title doesn't match either shape.
 */
function parseTitle(raw: string): { code: string; epStart: number; epEnd: number } | null {
  const title = raw.replace(/^\s*\|?\s*(Indo Sub\s*\|)?\s*/i, "").trim();

  let m = title.match(/^\|?\s*(.+?)\s*\|\s*EP\.?\s*(\d+)\s*(?:-\s*(\d+))?/i);
  if (!m) {
    m = title.match(/^(.+?)[\s_]+Eps?\.?\s*(\d+)\s*(?:-\s*(\d+))?/i);
  }
  if (!m) return null;

  const code = normalize(m[1]);
  const epStart = parseInt(m[2], 10);
  const epEnd = m[3] ? parseInt(m[3], 10) : epStart;
  if (!code || Number.isNaN(epStart)) return null;
  return { code, epStart, epEnd };
}

async function fetchChannelVideos(): Promise<DmEntry[]> {
  const entries: DmEntry[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data } = await axios.get(DM_API, {
      params: { fields: "id,title,created_time", limit: 100, page },
      timeout: REQUEST_TIMEOUT,
    });
    const list: DmVideo[] = Array.isArray(data?.list) ? data.list : [];
    for (const v of list) {
      const parsed = parseTitle(v.title);
      if (parsed) entries.push({ ...parsed, videoId: v.id, createdTime: v.created_time });
    }
    if (!data?.has_more) break;
  }
  return entries;
}

async function getEntries(): Promise<DmEntry[]> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) return cache.entries;
  if (inflight) return inflight;

  inflight = fetchChannelVideos()
    .then((entries) => {
      cache = { entries, fetchedAt: Date.now() };
      return entries;
    })
    .catch((err) => {
      if (cache) return cache.entries; // serve stale on transient failure
      throw err;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

/**
 * Candidate dongchindopro show codes for a series slug: any manually
 * curated aliases (for series whose upload naming doesn't match their own
 * slug), plus the normalized slug itself as a fallback. Most of the
 * channel's uploads are titled with the show name squashed together (e.g.
 * "beyond-times-gaze" -> "beyondtimesgaze"), which is exactly
 * normalize(seriesSlug) — so this extends coverage to every series
 * automatically without a manual entry per show, while staying an
 * exact-match lookup (never fuzzy): a series the channel doesn't cover
 * simply matches nothing instead of risking a wrong-episode mismatch.
 */
function candidateCodes(seriesSlug: string): string[] {
  const aliases = SERIES_ALIASES[seriesSlug] ?? [];
  const fallback = normalize(seriesSlug);
  return aliases.includes(fallback) ? aliases : [...aliases, fallback];
}

/**
 * Lists every episode number the dongchindopro channel has uploaded for a
 * series, with each episode's newest matching upload. Used to surface
 * episodes Dailymotion has published ahead of anichin.moe listing them —
 * dongchindopro often uploads before anichin's own episode page goes up.
 * Returns [] (never throws) if nothing matches or the channel lookup fails.
 */
export async function listDailymotionEpisodes(
  seriesSlug: string
): Promise<Array<{ episodeNumber: number; videoId: string; createdTime: number }>> {
  const codes = candidateCodes(seriesSlug);

  try {
    const entries = await Promise.race([
      getEntries(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), LOOKUP_BUDGET_MS)),
    ]);
    if (!entries) return [];

    const relevant = entries.filter((e) => codes.includes(e.code));
    const byEpisode = new Map<number, { videoId: string; createdTime: number }>();
    for (const e of relevant) {
      for (let ep = e.epStart; ep <= e.epEnd; ep++) {
        const existing = byEpisode.get(ep);
        if (!existing || e.createdTime > existing.createdTime) {
          byEpisode.set(ep, { videoId: e.videoId, createdTime: e.createdTime });
        }
      }
    }
    return Array.from(byEpisode.entries())
      .map(([episodeNumber, v]) => ({ episodeNumber, ...v }))
      .sort((a, b) => a.episodeNumber - b.episodeNumber);
  } catch {
    return [];
  }
}

/**
 * Extracts {seriesSlug, episodeNumber} from an anichin-style episode slug,
 * e.g. "coiling-dragon-episode-14-subtitle-indonesia" -> { seriesSlug: "coiling-dragon", episodeNumber: 14 }.
 */
export function parseEpisodeSlug(slug: string): { seriesSlug: string; episodeNumber: number } | null {
  const m = slug.match(/^(.+?)-episode-0*(\d+)(?:-|$)/i);
  if (!m) return null;
  return { seriesSlug: m[1], episodeNumber: parseInt(m[2], 10) };
}

/**
 * Best-effort Dailymotion embed lookup for a given episode slug. Returns null
 * (never throws) whenever the series has no confirmed alias, the channel has
 * no matching upload yet, or the Dailymotion API is unreachable — so callers
 * can always treat this as an optional extra server.
 */
export async function getDailymotionServer(episodeSlug: string): Promise<VideoServer | null> {
  const parsed = parseEpisodeSlug(episodeSlug);
  if (!parsed) return null;
  const codes = candidateCodes(parsed.seriesSlug);

  try {
    // Race against LOOKUP_BUDGET_MS instead of awaiting getEntries() directly:
    // getEntries() keeps running (and will populate the cache) even if we give
    // up waiting on it here, so a cold-cache lookup costs at most this budget
    // on the caller instead of the full multi-page fetch time.
    const entries = await Promise.race([
      getEntries(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), LOOKUP_BUDGET_MS)),
    ]);
    if (!entries) return null;
    const matches = entries.filter(
      (e) => codes.includes(e.code) && parsed.episodeNumber >= e.epStart && parsed.episodeNumber <= e.epEnd
    );
    if (matches.length === 0) return null;
    matches.sort((a, b) => b.createdTime - a.createdTime);
    const best = matches[0];
    // The "dcsrc=dongchindopro" marker lets the frontend distinguish this
    // verified channel lookup from the generic Dailymotion links anichin/Animasu
    // scraping sometimes surfaces (those are blocked — see BLOCKED_SERVERS above
    // and the frontend's isServerBlocked in watch.tsx).
    return {
      name: "Dailymotion",
      embed_url: `https://geo.dailymotion.com/player.html?video=${best.videoId}&autoplay=0&mute=0&loop=0&controls=1&showinfo=1&dcsrc=dongchindopro`,
    };
  } catch {
    return null;
  }
}
