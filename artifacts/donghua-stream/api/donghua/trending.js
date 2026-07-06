import { axlyFetch, mapItem, setCors } from '../_scraper.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const [ongoingData, completedData, upcomingData] = await Promise.all([
      axlyFetch('/ongoing?page=1'),
      axlyFetch('/completed?page=1'),
      axlyFetch('/upcoming'),
    ]);
    res.json({
      status: true,
      ongoing: (ongoingData.results ?? []).map(mapItem).slice(0, 12),
      completed: (completedData.results ?? []).map(mapItem).slice(0, 12),
      upcoming: (upcomingData.results ?? []).map(mapItem).slice(0, 8),
    });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
}
