import { axlyFetch, mapItem, setCors } from '../_scraper.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const page = Math.max(1, parseInt(req.query.page ?? '1', 10));
  try {
    const data = await axlyFetch(`/drop?page=${page}`);
    const results = (data.results ?? []).map(mapItem);
    res.json({ status: true, total: results.length, page, hasMore: results.length >= 30, results });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
}
