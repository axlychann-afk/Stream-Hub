import axios from "axios";
import * as cheerio from "cheerio";

export const BASE_URL = "https://anichin.moe";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
  "Cache-Control": "no-cache",
};

const REQUEST_TIMEOUT = 20000;

export function extractSlugFromUrl(url: string): string {
  return url
    .replace(/^https?:\/\/[^/]+\//, "")
    .replace(/\/$/, "")
    .replace(/^\//, "");
}

export async function fetchPage(url: string): Promise<cheerio.CheerioAPI> {
  const { data } = await axios.get(url, {
    headers: HEADERS,
    timeout: REQUEST_TIMEOUT,
  });
  return cheerio.load(data);
}

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

function parseDonghuaItems($: cheerio.CheerioAPI): DonghuaItem[] {
  const results: DonghuaItem[] = [];
  $(".listupd .bs").each((_, el) => {
    const link = $(el).find(".bsx a").attr("href") || "";
    const title = $(el).find(".tt").text().trim() || "";
    const type = $(el).find(".typez").text().trim() || "";
    const status = $(el).find(".epx").text().trim() || "";
    const sub = $(el).find(".sb").text().trim() || "";
    const thumbnail = $(el).find("img").attr("src") || null;

    if (title && link) {
      const slug = extractSlugFromUrl(link);
      results.push({
        title,
        slug,
        url: link.startsWith("http") ? link : `${BASE_URL}${link}`,
        type,
        status,
        sub,
        thumbnail,
      });
    }
  });
  return results;
}

function deduplicateByUrl(items: DonghuaItem[]): DonghuaItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

export async function scrapeList(
  urlPattern: string,
  page = 1,
  maxPages = 1
): Promise<{ results: DonghuaItem[]; hasMore: boolean }> {
  let allResults: DonghuaItem[] = [];
  let hasMore = false;

  for (let p = page; p < page + maxPages; p++) {
    const url = urlPattern.replace("{page}", String(p));
    const $ = await fetchPage(url);
    const items = parseDonghuaItems($);
    allResults = allResults.concat(items);
    hasMore = $(".pagination .nextpage").length > 0;
    if (!hasMore) break;
  }

  return { results: deduplicateByUrl(allResults), hasMore };
}

export async function scrapeOngoing(
  page = 1
): Promise<{ results: DonghuaItem[]; hasMore: boolean }> {
  return scrapeList(`${BASE_URL}/ongoing/page/{page}/`, page);
}

export async function scrapeCompleted(
  page = 1
): Promise<{ results: DonghuaItem[]; hasMore: boolean }> {
  return scrapeList(`${BASE_URL}/completed/page/{page}/`, page);
}

export async function scrapeDropped(
  page = 1
): Promise<{ results: DonghuaItem[]; hasMore: boolean }> {
  return scrapeList(`${BASE_URL}/category/drop/page/{page}/`, page);
}

export async function scrapeUpcoming(): Promise<{
  results: DonghuaItem[];
  hasMore: boolean;
}> {
  const $ = await fetchPage(`${BASE_URL}/upcoming-donghua/`);
  const results = parseDonghuaItems($);
  const hasMore = $(".pagination .nextpage").length > 0;
  return { results, hasMore };
}

export async function scrapeSearch(
  q: string
): Promise<{ results: DonghuaItem[] }> {
  const $ = await fetchPage(
    `${BASE_URL}/?s=${encodeURIComponent(q)}`
  );
  const results = parseDonghuaItems($);
  return { results };
}

export async function scrapeDetail(slug: string): Promise<DonghuaDetail> {
  const url = `${BASE_URL}/${slug}/`;
  const $ = await fetchPage(url);

  const detail: DonghuaDetail = {
    title: "",
    alternative: "",
    rating: "",
    status: "",
    type: "",
    studio: "",
    network: "",
    releaseDate: "",
    duration: "",
    season: "",
    country: "",
    totalEpisodes: "",
    subber: "",
    genres: [],
    sinopsis: "",
    cover: null,
    episodes: [],
  };

  detail.title = $(".bixbox .infox h1.entry-title").text().trim();
  detail.alternative = $(".bixbox .infox .alter").text().trim();
  detail.cover = $(".bixbox .thumb img").attr("src") || null;

  const ratingText = $(".bixbox .rating strong").text().trim();
  detail.rating = ratingText.replace("Rating ", "");

  $(".bixbox .info-content .spe span").each((_, el) => {
    const text = $(el).text().trim();
    if (text.includes("Status:"))
      detail.status = text.replace("Status:", "").trim();
    else if (text.includes("Tipe:"))
      detail.type = text.replace("Tipe:", "").trim();
    else if (text.includes("Studio:"))
      detail.studio = text.replace("Studio:", "").trim();
    else if (text.includes("Network:"))
      detail.network = text.replace("Network:", "").trim();
    else if (text.includes("Tanggal rilis:"))
      detail.releaseDate = text.replace("Tanggal rilis:", "").trim();
    else if (text.includes("Durasi:"))
      detail.duration = text.replace("Durasi:", "").trim();
    else if (text.includes("Season:"))
      detail.season = text.replace("Season:", "").trim();
    else if (text.includes("Negara:"))
      detail.country = text.replace("Negara:", "").trim();
    else if (text.includes("Episode:"))
      detail.totalEpisodes = text.replace("Episode:", "").trim();
    else if (text.includes("Subber:"))
      detail.subber = text.replace("Subber:", "").trim();
  });

  $(".bixbox .genxed a").each((_, el) => {
    detail.genres.push($(el).text().trim());
  });

  detail.sinopsis = $(".bixbox .desc").text().trim();

  const tempEpisodes: Array<{
    title: string;
    url: string;
    date: string | null;
  }> = [];
  $(".eplister ul li, .listeps ul li").each((_, el) => {
    const episodeTitle = $(el)
      .find(".epl-title, .lchx a")
      .text()
      .trim();
    const episodeLink = $(el).find("a").attr("href");
    const episodeDate = $(el).find(".epl-date, .date").text().trim();

    if (episodeTitle && episodeLink) {
      tempEpisodes.push({
        title: episodeTitle,
        url: episodeLink.startsWith("http")
          ? episodeLink
          : `${BASE_URL}${episodeLink}`,
        date: episodeDate || null,
      });
    }
  });

  tempEpisodes.reverse();

  detail.episodes = tempEpisodes.map((ep, index) => ({
    number: index + 1,
    title: ep.title,
    url: ep.url,
    slug: extractSlugFromUrl(ep.url),
    date: ep.date,
  }));

  if (!detail.totalEpisodes || detail.totalEpisodes === "") {
    detail.totalEpisodes = detail.episodes.length;
  }

  return detail;
}

export async function scrapeStream(slug: string): Promise<StreamInfo> {
  const url = `${BASE_URL}/${slug}/`;
  const $ = await fetchPage(url);

  let streamUrl: string | null = null;
  let videoId: string | null = null;
  let source: string | null = null;

  // 1. Dailymotion iframe
  $('iframe[src*="dailymotion.com"]').each((_, el) => {
    const src = $(el).attr("src");
    if (src) {
      const match = src.match(/video=([a-zA-Z0-9]+)/);
      if (match) {
        videoId = match[1];
        streamUrl = `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1&queue-enable=false`;
        source = "Dailymotion";
      }
      return false as unknown as void;
    }
  });

  // 2. OK.ru iframe
  if (!streamUrl) {
    $('iframe[src*="ok.ru"]').each((_, el) => {
      const src = $(el).attr("src");
      if (src) {
        streamUrl = src;
        source = "OK.ru";
        const match = src.match(/videoembed\/(\d+)/);
        if (match) videoId = match[1];
        return false as unknown as void;
      }
    });
  }

  // 3. Rumble iframe
  if (!streamUrl) {
    $('iframe[src*="rumble.com"]').each((_, el) => {
      const src = $(el).attr("src");
      if (src) {
        streamUrl = src;
        source = "Rumble";
        const match = src.match(/embed\/([a-zA-Z0-9]+)/);
        if (match) videoId = match[1];
        return false as unknown as void;
      }
    });
  }

  // 4. YouTube iframe
  if (!streamUrl) {
    $('iframe[src*="youtube.com"], iframe[src*="youtu.be"]').each((_, el) => {
      const src = $(el).attr("src");
      if (src) {
        streamUrl = src;
        source = "YouTube";
        const match = src.match(/embed\/([a-zA-Z0-9_-]+)/);
        if (match) videoId = match[1];
        return false as unknown as void;
      }
    });
  }

  // 5. Fallback: anchor links
  if (!streamUrl) {
    $('a[href*="dailymotion.com"]').each((_, el) => {
      const href = $(el).attr("href");
      if (href) {
        const match = href.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/);
        if (match) {
          videoId = match[1];
          streamUrl = `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1`;
          source = "Dailymotion";
        }
        return false as unknown as void;
      }
    });
  }

  if (!streamUrl || !source) {
    throw new Error("Stream URL not found");
  }

  const title = $(".entry-title").text().trim() || "Donghua Episode";

  // Explicit string type to prevent control-flow never inference
  const finalSource: string = source;
  const finalStreamUrl: string = streamUrl;

  let watchUrl: string = finalStreamUrl;
  if (finalSource === "OK.ru" && videoId) {
    watchUrl = `https://ok.ru/video/${videoId}`;
  } else if (finalSource === "Dailymotion" && videoId) {
    watchUrl = `https://www.dailymotion.com/video/${videoId}`;
  }

  return {
    title,
    source: finalSource,
    video_id: videoId,
    embed_url: finalStreamUrl,
    watch_url: watchUrl,
  };
}

export async function scrapeSchedule(): Promise<
  Record<string, ScheduleItem[]>
> {
  const $ = await fetchPage(`${BASE_URL}/schedule/`);
  const schedule: Record<string, ScheduleItem[]> = {};

  $(".listSchh").each((_, el) => {
    const day = $(el).find("h2").text().trim();
    const animes: ScheduleItem[] = [];

    $(el)
      .find(".subSchh a")
      .each((_, a) => {
        const title = $(a).text().trim();
        const href = $(a).attr("href") || "";
        const slug = extractSlugFromUrl(href);
        const url = href.startsWith("http") ? href : `${BASE_URL}${href}`;
        animes.push({
          title: title.replace("[SVIP] ", ""),
          slug,
          url,
          is_vip: title.includes("[SVIP]"),
        });
      });

    if (animes.length > 0) {
      schedule[day] = animes;
    }
  });

  return schedule;
}
