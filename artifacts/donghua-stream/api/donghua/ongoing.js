import { scrapeList, BASE_URL, setCors } from '../_scraper.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const page = Math.max(1, parseInt(req.query.page ?? '1', 10));
  try {
    const { results, hasMore } = await scrapeList(`${BASE_URL}/ongoing/page/{page}/`, page);
    res.json({ status: true, total: results.length, page, hasMore, results });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
}
