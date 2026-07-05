import { Router } from "express";
import {
  scrapeOngoing,
  scrapeCompleted,
  scrapeDropped,
  scrapeUpcoming,
  scrapeSearch,
  scrapeDetail,
  scrapeStream,
  scrapeSchedule,
} from "./scraper.js";

const router = Router();

// In-memory cache to avoid hammering source site
const cache = new Map<string, { data: unknown; expiresAt: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.data as T;
  }
  return null;
}

function setCache(key: string, data: unknown, ttlSeconds = 120): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
}

// GET /api/donghua/ongoing?page=1
router.get("/ongoing", async (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
  const cacheKey = `ongoing:${page}`;

  const cached = getCached(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    const { results, hasMore } = await scrapeOngoing(page);
    const response = {
      status: true,
      total: results.length,
      page,
      hasMore,
      results,
    };
    setCache(cacheKey, response, 180);
    res.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    req.log.error({ err }, "Failed to scrape ongoing");
    res.status(500).json({ status: false, error: message });
  }
});

// GET /api/donghua/completed?page=1
router.get("/completed", async (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
  const cacheKey = `completed:${page}`;

  const cached = getCached(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    const { results, hasMore } = await scrapeCompleted(page);
    const response = {
      status: true,
      total: results.length,
      page,
      hasMore,
      results,
    };
    setCache(cacheKey, response, 300);
    res.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    req.log.error({ err }, "Failed to scrape completed");
    res.status(500).json({ status: false, error: message });
  }
});

// GET /api/donghua/drop?page=1
router.get("/drop", async (req, res) => {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
  const cacheKey = `drop:${page}`;

  const cached = getCached(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    const { results, hasMore } = await scrapeDropped(page);
    const response = {
      status: true,
      total: results.length,
      page,
      hasMore,
      results,
    };
    setCache(cacheKey, response, 300);
    res.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    req.log.error({ err }, "Failed to scrape dropped");
    res.status(500).json({ status: false, error: message });
  }
});

// GET /api/donghua/upcoming
router.get("/upcoming", async (req, res) => {
  const cacheKey = "upcoming";

  const cached = getCached(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    const { results, hasMore } = await scrapeUpcoming();
    const response = {
      status: true,
      total: results.length,
      page: 1,
      hasMore,
      results,
    };
    setCache(cacheKey, response, 600);
    res.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    req.log.error({ err }, "Failed to scrape upcoming");
    res.status(500).json({ status: false, error: message });
  }
});

// GET /api/donghua/search?q=keyword
router.get("/search", async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  if (!q) {
    res.status(400).json({ status: false, error: 'Parameter "q" diperlukan' });
    return;
  }

  const cacheKey = `search:${q.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    const { results } = await scrapeSearch(q);
    const response = {
      status: true,
      total: results.length,
      page: 1,
      hasMore: false,
      results,
    };
    setCache(cacheKey, response, 120);
    res.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    req.log.error({ err }, "Failed to search");
    res.status(500).json({ status: false, error: message });
  }
});

// GET /api/donghua/schedule
router.get("/schedule", async (req, res) => {
  const cacheKey = "schedule";

  const cached = getCached(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    const schedule = await scrapeSchedule();
    const response = { status: true, result: schedule };
    setCache(cacheKey, response, 3600);
    res.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    req.log.error({ err }, "Failed to scrape schedule");
    res.status(500).json({ status: false, error: message });
  }
});

// GET /api/donghua/detail?slug=series-slug
router.get("/detail", async (req, res) => {
  const slug = String(req.query.slug ?? "").trim();
  if (!slug) {
    res
      .status(400)
      .json({ status: false, error: 'Parameter "slug" diperlukan' });
    return;
  }

  const cacheKey = `detail:${slug}`;
  const cached = getCached(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    const detail = await scrapeDetail(slug);
    const response = { status: true, result: detail };
    setCache(cacheKey, response, 300);
    res.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    req.log.error({ err }, "Failed to scrape detail");
    res.status(404).json({ status: false, error: message });
  }
});

// GET /api/donghua/stream?slug=episode-slug
router.get("/stream", async (req, res) => {
  const slug = String(req.query.slug ?? "").trim();
  if (!slug) {
    res
      .status(400)
      .json({ status: false, error: 'Parameter "slug" diperlukan' });
    return;
  }

  const cacheKey = `stream:${slug}`;
  const cached = getCached(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    const stream = await scrapeStream(slug);
    const response = { status: true, result: stream };
    setCache(cacheKey, response, 3600);
    res.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    req.log.error({ err }, "Failed to scrape stream");
    res.status(404).json({ status: false, error: message });
  }
});

// GET /api/donghua/trending — homepage hero data
router.get("/trending", async (req, res) => {
  const cacheKey = "trending";

  const cached = getCached(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    // Fetch first page of ongoing + a few completed in parallel
    const [ongoingData, completedData, upcomingData] = await Promise.all([
      scrapeOngoing(1),
      scrapeCompleted(1),
      scrapeUpcoming(),
    ]);

    const response = {
      status: true,
      ongoing: ongoingData.results.slice(0, 12),
      completed: completedData.results.slice(0, 12),
      upcoming: upcomingData.results.slice(0, 8),
    };
    setCache(cacheKey, response, 300);
    res.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    req.log.error({ err }, "Failed to get trending");
    res.status(500).json({ status: false, error: message });
  }
});

export default router;
