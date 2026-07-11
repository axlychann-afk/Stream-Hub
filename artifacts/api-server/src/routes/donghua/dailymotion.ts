import axios from "axios";
import type { VideoServer } from "./scraper.js";

const DM_CHANNEL = "dongchindopro";
const DM_API = `https://api.dailymotion.com/user/${DM_CHANNEL}/videos`;
const REQUEST_TIMEOUT = 15000;
const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_PAGES = 3;

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
  "btth-season-5": ["btth", "doupocangqiong5"], // "BTTH Season 5" on-site — episode slugs use this prefix even though the series detail-page slug is "oyen-pertempuran-akhir-sekte-misty-cloud"; uploader labels this show either "BTTH" or its Chinese pinyin title "Doupo Cangqiong"
  "coiling-dragon": ["coilingdragon"],
  "ever-night": ["evernight"],
  "perfect-world": ["perfectworld"],
  "azure-legacy": ["azurelegacy"],
  "my-senior-brother-is-too-steady": ["msbs"],
  "way-of-choices": ["wayofchoices"],
  "renegade-immortal": ["renegadeimmortal"],
  "swallowed-star": ["swallowedstar"],
  // anichin's episode slugs are inconsistently spelled across this show's run —
  // older episodes use the typo "shrounding", newer ones the correct
  // "shrouding" — so both prefixes are mapped to the same code.
  "shrounding-the-heavens": ["shroudingtheheavens"],
  "shrouding-the-heavens": ["shroudingtheheavens"],
  "tomb-of-fallen-gods-season-3": ["tomboffallengods3"],
  "the-great-ruler": ["thegreatruler"],
  "walking-the-way-all-alone": ["walkingthewayalone"],
  "in-search-of-gods": ["insearchofgods"],
  "tales-of-herding-god": ["talesofherdinggods"],
  "purple-river-season-2": ["purpleriver2"],
  "slay-the-gods-season-2": ["slaythegods2"],
  "the-other-side-of-deep-space": ["theothersidedeepspace"],
  "eclipse-of-illusion-special-the-miasma-war": ["eclipseofillusionspecialthemiasmawar"],
  "100-000-years-of-refining-qi": ["100000refiningqi"],
  // NOTE: no confirmed alias for ARMJI — the site's "remake" season only has 8
  // episodes while the channel's "ARMJI" uploads are at ep 180+ (a different,
  // longer-running adaptation we don't currently carry). Do not add a mapping
  // here without finding an on-site season whose episode range actually
  // overlaps the channel uploads.
  "beyond-times-gaze": ["beyondtimesgaze"],
  "dragons-triumph-in-the-celestial-realm": ["dragonstriumphcelestialrealm"],
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
  const codes = SERIES_ALIASES[parsed.seriesSlug];
  if (!codes || codes.length === 0) return null;

  try {
    const entries = await getEntries();
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
      embed_url: `https://www.dailymotion.com/embed/video/${best.videoId}?dcsrc=dongchindopro`,
    };
  } catch {
    return null;
  }
}
