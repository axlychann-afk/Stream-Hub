import axios from "axios";

const AXLY_BASE = "https://axlyapi.qzz.io/donghua";
const REQUEST_TIMEOUT = 20000;

const http = axios.create({
  baseURL: AXLY_BASE,
  timeout: REQUEST_TIMEOUT,
  headers: {
    "User-Agent": "DonghuaStream/1.0",
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

export interface StreamInfo {
  title: string;
  source: string;
  video_id: string | null;
  embed_url: string;
  watch_url: string;
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
  const { data } = await http.get<AxlyStreamResponse>(
    `/stream?slug=${encodeURIComponent(slug)}`
  );

  if (!data?.status || !data?.result) {
    throw new Error(data?.error ?? `Stream not found for slug: ${slug}`);
  }

  const r = data.result;
  return {
    title: str(r.title, "Donghua Episode"),
    source: str(r.source),
    video_id: typeof r.video_id === "string" ? r.video_id : null,
    embed_url: str(r.embed_url),
    watch_url: str(r.watch_url),
  };
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
