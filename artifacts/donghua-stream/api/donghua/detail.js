import { axlyFetch, slugFromUrl, setCors } from '../_scraper.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const slug = String(req.query.slug ?? '').trim();
  if (!slug) return res.status(400).json({ status: false, error: 'Parameter "slug" diperlukan' });
  try {
    const data = await axlyFetch(`/detail?slug=${encodeURIComponent(slug)}`);
    if (!data?.result) {
      return res.status(404).json({ status: false, error: data?.error ?? 'Not found' });
    }
    const r = data.result;
    const episodes = (r.episodes ?? []).map((ep, idx) => {
      const url = ep.url ?? '';
      const fullUrl = url.startsWith('http') ? url : `https://anichin.moe${url}`;
      return {
        number: ep.number ?? idx + 1,
        title: ep.title ?? '',
        url: fullUrl,
        slug: ep.slug ?? slugFromUrl(url),
        date: ep.date ?? null,
      };
    });
    res.json({
      status: true,
      result: {
        title: r.title ?? '',
        alternative: r.alternative ?? '',
        rating: r.rating ?? '',
        status: r.status ?? '',
        type: r.type ?? '',
        studio: r.studio ?? '',
        network: r.network ?? '',
        releaseDate: r.releaseDate ?? '',
        duration: r.duration ?? '',
        season: r.season ?? '',
        country: r.country ?? '',
        totalEpisodes: r.totalEpisodes ?? episodes.length,
        subber: r.subber ?? '',
        genres: Array.isArray(r.genres) ? r.genres : [],
        sinopsis: r.sinopsis ?? '',
        cover: r.cover ?? null,
        episodes,
      },
    });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
}
