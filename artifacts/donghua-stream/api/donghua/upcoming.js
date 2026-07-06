import { fetchPage, parseItems, BASE_URL, setCors } from '../_scraper.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const $ = await fetchPage(`${BASE_URL}/upcoming-donghua/`);
    const results = parseItems($);
    const hasMore = $('.pagination .nextpage').length > 0;
    res.json({ status: true, total: results.length, page: 1, hasMore, results });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
}
