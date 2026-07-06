import { axlyFetch, setCors } from '../_scraper.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const slug = String(req.query.slug ?? '').trim();
  if (!slug) return res.status(400).json({ status: false, error: 'Parameter "slug" diperlukan' });
  try {
    const data = await axlyFetch(`/stream?slug=${encodeURIComponent(slug)}`);
    if (!data?.status || !data?.result) {
      return res.status(404).json({ status: false, error: data?.error ?? 'Stream not found' });
    }
    res.json({ status: true, result: data.result });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
}
