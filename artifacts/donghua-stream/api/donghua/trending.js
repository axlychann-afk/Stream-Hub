import { axlyFetch, mapItem, setCors } from '../_scraper.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const [ongoingResult, completedResult, upcomingResult] = await Promise.allSettled([
      axlyFetch('/ongoing?page=1'),
      axlyFetch('/completed?page=1'),
      axlyFetch('/upcoming'),
    ]);

    const ongoing =
      ongoingResult.status === 'fulfilled'
        ? (ongoingResult.value.results ?? []).map(mapItem).slice(0, 12)
        : [];
    const completed =
      completedResult.status === 'fulfilled'
        ? (completedResult.value.results ?? []).map(mapItem).slice(0, 12)
        : [];
    const upcoming =
      upcomingResult.status === 'fulfilled'
        ? (upcomingResult.value.results ?? []).map(mapItem).slice(0, 8)
        : [];

    // Return partial data rather than erroring out completely
    res.json({ status: true, ongoing, completed, upcoming });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
}
