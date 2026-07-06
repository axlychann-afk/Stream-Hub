import axios from "axios";
import * as cheerio from "cheerio";

const AXLY_BASE = "https://axlyapi.qzz.io/donghua";
const ANICHIN_BASE = "https://anichin.moe";
const REQUEST_TIMEOUT = 20000;

const http = axios.create({
  baseURL: AXLY_BASE,
  timeout: REQUEST_TIMEOUT,
  headers: {
    "User-Agent": "DonghuaStream/1.0",
  },
});

const httpDirect = axios.create({
  baseURL: ANICHIN_BASE,
  timeout: REQUEST_TIMEOUT,
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
    "Referer": "https://anichin.moe/",
  },
});

// ──────────────────────────────────────────────
// Types (kept identical so route handlers don't change)
// ──────────────────────────────────────────────

export interface DonghuaItem {
  title: string;
  slug: string;
  url: string;
  type: string;
  status: string;
  sub: string;
  thumbnail: string | null;
}

export interface Episode {
  number: number;
  title: string;
  url: string;
  slug: string;
  date: string | null;
}

export interface DonghuaDetail {
  title: string;
  alternative: string;
  rating: string;
  status: string;
  type: string;
  studio: string;
  network: string;
  releaseDate: string;
  duration: string;
  season: string;
  country: string;
  totalEpisodes: string | number;
  subber: string;
  genres: string[];
  sinopsis: string;
  cover: string | null;
  episodes: Episode[];
}

export interface VideoServer {
  name: string;
  embed_url: string;
}

export interface StreamInfo {
  title: string;
  source: string;
  video_id: string | null;
  embed_url: string;
  watch_url: string;
  servers: VideoServer[];
}

export interface ScheduleItem {
  title: string;
  slug: string;
  url: string;
  is_vip: boolean;
}

// ──────────────────────────────────────────────
// Internal API response shapes
// ──────────────────────────────────────────────

interface AxlyListResponse {
  status: boolean;
  total?: number;
  results?: unknown[];
}

interface AxlyListItem {
  title?: unknown;
  slug?: unknown;
  url?: unknown;
  type?: unknown;
  status?: unknown;
  sub?: unknown;
  thumbnail?: unknown;
}

interface AxlyDetailResponse {
  status: boolean;
  error?: string;
  result?: {
    title?: unknown;
    alternative?: unknown;
    rating?: unknown;
    status?: unknown;
    type?: unknown;
    studio?: unknown;
    network?: unknown;
    releaseDate?: unknown;
    duration?: unknown;
    season?: unknown;
    country?: unknown;
    totalEpisodes?: unknown;
    subber?: unknown;
    genres?: unknown;
    sinopsis?: unknown;
    cover?: unknown;
    episodes?: unknown[];
  };
}

interface AxlyStreamResponse {
  status: boolean;
  error?: string;
  result?: {
    title?: unknown;
    source?: unknown;
    video_id?: unknown;
    embed_url?: unknown;
    watch_url?: unknown;
  };
}

interface AxlyScheduleResponse {
  status: boolean;
  result?: Record<string, unknown[]>;
}

interface AxlyEpisode {
  number?: unknown;
  title?: unknown;
  url?: unknown;
  slug?: unknown;
  date?: unknown;
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/** Remove duplicated title text like "Foo BarFoo Bar" → "Foo Bar" */
function dedupeTitle(raw: unknown): string {
  const title = typeof raw === "string" ? raw : "";
  const half = Math.floor(title.length / 2);
  if (title.length > 0 && title.length % 2 === 0 && title.slice(0, half) === title.slice(half)) {
    return title.slice(0, half);
  }
  return title;
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function slugFromUrl(url: string): string {
  return url
    .replace(/^https?:\/\/[^/]+\//, "")
    .replace(/\/$/, "")
    .replace(/^\//, "");
}

function mapItem(raw: unknown): DonghuaItem {
  const item = (typeof raw === "object" && raw !== null ? raw : {}) as AxlyListItem;
  return {
    title: dedupeTitle(item.title),
    slug: str(item.slug),
    url: str(item.url),
    type: str(item.type),
    status: str(item.status),
    sub: str(item.sub),
    thumbnail: typeof item.thumbnail === "string" ? item.thumbnail : null,
  };
}

/**
 * Derive hasMore from upstream metadata.
 * The axly API returns `total` = count of items on THIS page (not the grand total).
 * If the returned page is full (matches total on page), assume more pages exist.
 * We cap the page size assumption at 30 (observed from API).
 */
function computeHasMore(data: AxlyListResponse, pageSize = 30): boolean {
  const results = Array.isArray(data.results) ? data.results : [];
  // If this page returned a full set, assume there is a next page
  return results.length >= pageSize;
}

// ──────────────────────────────────────────────
// Exported scraper functions
// ──────────────────────────────────────────────

export async function scrapeOngoing(
  page = 1
): Promise<{ results: DonghuaItem[]; hasMore: boolean }> {
  const { data } = await http.get<AxlyListResponse>(`/ongoing?page=${page}`);
  const results = (Array.isArray(data.results) ? data.results : []).map(mapItem);
  return { results, hasMore: computeHasMore(data) };
}

export async function scrapeCompleted(
  page = 1
): Promise<{ results: DonghuaItem[]; hasMore: boolean }> {
  const { data } = await http.get<AxlyListResponse>(`/completed?page=${page}`);
  const results = (Array.isArray(data.results) ? data.results : []).map(mapItem);
  return { results, hasMore: computeHasMore(data) };
}

export async function scrapeDropped(
  page = 1
): Promise<{ results: DonghuaItem[]; hasMore: boolean }> {
  const { data } = await http.get<AxlyListResponse>(`/drop?page=${page}`);
  const results = (Array.isArray(data.results) ? data.results : []).map(mapItem);
  return { results, hasMore: computeHasMore(data) };
}

export async function scrapeUpcoming(): Promise<{
  results: DonghuaItem[];
  hasMore: boolean;
}> {
  const { data } = await http.get<AxlyListResponse>("/upcoming");
  const results = (Array.isArray(data.results) ? data.results : []).map(mapItem);
  return { results, hasMore: false };
}

export async function scrapeSearch(
  q: string
): Promise<{ results: DonghuaItem[] }> {
  const { data } = await http.get<AxlyListResponse>(
    `/search?q=${encodeURIComponent(q)}`
  );
  const results = (Array.isArray(data.results) ? data.results : []).map(mapItem);
  return { results };
}

export async function scrapeDetail(slug: string): Promise<DonghuaDetail> {
  const { data } = await http.get<AxlyDetailResponse>(
    `/detail?slug=${encodeURIComponent(slug)}`
  );

  if (!data?.result) {
    throw new Error(data?.error ?? `Detail not found for slug: ${slug}`);
  }

  const r = data.result;

  const rawEpisodes = Array.isArray(r.episodes) ? r.episodes : [];
  const episodes: Episode[] = rawEpisodes.map((raw, idx) => {
    const ep = (typeof raw === "object" && raw !== null ? raw : {}) as AxlyEpisode;
    const url = str(ep.url);
    const fullUrl = url.startsWith("http") ? url : `https://anichin.moe${url}`;
    return {
      number: typeof ep.number === "number" ? ep.number : idx + 1,
      title: str(ep.title),
      url: fullUrl,
      slug: str(ep.slug) || slugFromUrl(url),
      date: typeof ep.date === "string" ? ep.date : null,
    };
  });

  const totalEps = r.totalEpisodes;
  const totalEpisodes: string | number =
    typeof totalEps === "string" || typeof totalEps === "number"
      ? totalEps
      : episodes.length;

  return {
    title: str(r.title),
    alternative: str(r.alternative),
    rating: str(r.rating),
    status: str(r.status),
    type: str(r.type),
    studio: str(r.studio),
    network: str(r.network),
    releaseDate: str(r.releaseDate),
    duration: str(r.duration),
    season: str(r.season),
    country: str(r.country),
    totalEpisodes,
    subber: str(r.subber),
    genres: Array.isArray(r.genres)
      ? r.genres.filter((g): g is string => typeof g === "string")
      : [],
    sinopsis: str(r.sinopsis),
    cover: typeof r.cover === "string" ? r.cover : null,
    episodes,
  };
}

export async function scrapeStream(slug: string): Promise<StreamInfo> {
  // Fetch axly API info and anichin episode page in parallel
  const [axlyRes, pageRes] = await Promise.allSettled([
    http.get<AxlyStreamResponse>(`/stream?slug=${encodeURIComponent(slug)}`),
    httpDirect.get<string>(`/${slug}/`, { responseType: "text" }),
  ]);

  // Extract basic metadata from axly (title, source, etc.)
  let title = "Donghua Episode";
  let source = "";
  let video_id: string | null = null;
  let watch_url = `${ANICHIN_BASE}/${slug}/`;

  if (axlyRes.status === "fulfilled" && axlyRes.value.data?.status && axlyRes.value.data?.result) {
    const r = axlyRes.value.data.result;
    title = str(r.title, "Donghua Episode");
    source = str(r.source);
    video_id = typeof r.video_id === "string" ? r.video_id : null;
    watch_url = str(r.watch_url) || watch_url;
  }

  // Parse mirror servers from <select class="mirror"> on the episode page
  const servers: VideoServer[] = [];
  if (pageRes.status === "fulfilled") {
    try {
      const $ = cheerio.load(pageRes.value.data);
      $("select.mirror option").each((_, el) => {
        const b64 = $(el).attr("value") ?? "";
        const name = $(el).text().trim();
        if (!b64 || !name || name.toLowerCase().includes("pilih server")) return;
        try {
          const iframeHtml = Buffer.from(b64, "base64").toString("utf-8");
          const $iframe = cheerio.load(iframeHtml);
          const src = $iframe("iframe").attr("src") ?? "";
          if (src) servers.push({ name, embed_url: src });
        } catch { /* skip invalid base64 */ }
      });
    } catch { /* skip cheerio errors */ }
  }

  // If axly had no data but we got servers from the page, still need title
  if (axlyRes.status === "rejected" && servers.length === 0) {
    throw new Error(`Stream not found for slug: ${slug}`);
  }

  // Primary embed_url: first server from page, fallback to axly's embed_url
  const axlyEmbed = axlyRes.status === "fulfilled"
    ? str(axlyRes.value.data?.result?.embed_url)
    : "";
  const embed_url = servers[0]?.embed_url || axlyEmbed;

  // If nothing found at all, surface axly error
  if (!embed_url && servers.length === 0) {
    const errMsg = axlyRes.status === "fulfilled"
      ? (axlyRes.value.data?.error ?? `Stream not found for slug: ${slug}`)
      : `Stream not found for slug: ${slug}`;
    throw new Error(errMsg);
  }

  return { title, source, video_id, embed_url, watch_url, servers };
}

export interface PopularItem {
  title: string;
  short_title: string;
  slug: string;
  url: string;
  episode: string;
  type: string;
  sub_status: string;
  is_hot: boolean;
  image: string | null;
  image_alt: string;
  rel: string;
}

/** Scrape latest/popular releases directly from anichin.moe homepage */
export async function scrapePopular(): Promise<PopularItem[]> {
  const { data } = await httpDirect.get<string>("/", { responseType: "text" });
  const $ = cheerio.load(data);
  const items: PopularItem[] = [];

  $(".listupd .bs").each((_, el) => {
    const linkEl = $(el).find(".bsx a");
    const href = linkEl.attr("href") ?? "";
    // Prefer anchor title attr; fall back to .tt text then deduplicate
    const rawTitle =
      linkEl.attr("title") ||
      $(el).find(".tt").contents().filter((_, n) => n.type === "text").first().text().trim() ||
      $(el).find(".tt").text().trim();
    const title = dedupeTitle(rawTitle);
    if (!title || !href) return;

    const fullUrl = href.startsWith("http") ? href : `${ANICHIN_BASE}${href}`;
    const slug = fullUrl
      .replace(/^https?:\/\/[^/]+\//, "")
      .replace(/\/$/, "");

    // Episode label (e.g. "Ep 148")
    const episode = $(el).find(".epx").text().trim();
    const sub = $(el).find(".sb").text().trim();
    const type = $(el).find(".typez").text().trim();

    // Try both src and data-src for thumbnail
    const imgEl = $(el).find("img");
    const image =
      imgEl.attr("src") ||
      imgEl.attr("data-src") ||
      imgEl.attr("data-lazy-src") ||
      null;

    // Shorten title for display (remove episode suffix for short_title)
    const short_title = title.replace(/\s+Episode\s+\d+.*/i, "").trim();

    items.push({
      title,
      short_title,
      slug,
      url: fullUrl,
      episode,
      type,
      sub_status: sub,
      is_hot: true,
      image: image && image.startsWith("data:") ? null : image,
      image_alt: title,
      rel: "",
    });
  });

  // Deduplicate by series slug (strip episode suffix so same series isn't shown twice)
  const seen = new Set<string>();
  return items.filter((item) => {
    const seriesSlug = item.slug.replace(/-episode-\d+.*$/i, "").replace(/-subtitle-.*$/i, "");
    if (seen.has(seriesSlug)) return false;
    seen.add(seriesSlug);
    return true;
  });
}

export async function scrapeSchedule(): Promise<
  Record<string, ScheduleItem[]>
> {
  const { data } = await http.get<AxlyScheduleResponse>("/schedule");

  const raw = typeof data?.result === "object" && data.result !== null
    ? data.result
    : {};

  const schedule: Record<string, ScheduleItem[]> = {};

  for (const [day, items] of Object.entries(raw)) {
    if (!Array.isArray(items)) continue;
    schedule[day] = items.map((raw) => {
      const item = (typeof raw === "object" && raw !== null ? raw : {}) as {
        title?: unknown; slug?: unknown; url?: unknown; is_vip?: unknown;
      };
      const url = str(item.url);
      return {
        title: str(item.title),
        slug: str(item.slug) || slugFromUrl(url),
        url,
        is_vip: typeof item.is_vip === "boolean" ? item.is_vip : false,
      };
    });
  }

  return schedule;
}
