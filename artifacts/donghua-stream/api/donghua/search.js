import { fetchPage, parseItems, BASE_URL, setCors } from '../_scraper.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const q = String(req.query.q ?? '').trim();
  if (!q) return res.status(400).json({ status: false, error: 'Parameter "q" diperlukan' });
  try {
    const $ = await fetchPage(`${BASE_URL}/?s=${encodeURIComponent(q)}`);
    const results = parseItems($);
    res.json({ status: true, total: results.length, page: 1, hasMore: false, results });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
}
