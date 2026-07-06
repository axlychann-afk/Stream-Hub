import { axlyFetch, slugFromUrl, setCors } from '../_scraper.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const data = await axlyFetch('/schedule');
    const raw = data?.result ?? {};
    const schedule = {};
    for (const [day, items] of Object.entries(raw)) {
      if (!Array.isArray(items)) continue;
      schedule[day] = items.map(item => ({
        title: item.title ?? '',
        slug: item.slug ?? slugFromUrl(item.url ?? ''),
        url: item.url ?? '',
        is_vip: item.is_vip ?? false,
      }));
    }
    res.json({ status: true, result: schedule });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
}
