import { axlyFetch, mapItem, setCors } from '../_scraper.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const data = await axlyFetch('/upcoming');
    const results = (data.results ?? []).map(mapItem);
    res.json({ status: true, total: results.length, page: 1, hasMore: false, results });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
}
