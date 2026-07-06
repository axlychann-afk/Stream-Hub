import { axlyFetch, setCors } from '../_scraper.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const data = await axlyFetch('/popular');
    const list = data?.result?.list ?? [];
    const host = `https://${req.headers.host}`;
    const results = list.map((item) => ({
      title: typeof item.title === 'string' ? item.title : '',
      short_title: typeof item.short_title === 'string' ? item.short_title : '',
      slug: typeof item.slug === 'string' ? item.slug : '',
      url: typeof item.url === 'string' ? item.url : '',
      episode: typeof item.episode === 'string' ? item.episode : '',
      type: typeof item.type === 'string' ? item.type : '',
      sub_status: typeof item.sub_status === 'string' ? item.sub_status : '',
      is_hot: typeof item.is_hot === 'boolean' ? item.is_hot : false,
      image: typeof item.image === 'string'
        ? `${host}/api/image-proxy?url=${encodeURIComponent(item.image)}`
        : null,
      image_alt: typeof item.image_alt === 'string' ? item.image_alt : '',
      rel: typeof item.rel === 'string' ? item.rel : '',
    }));
    res.json({ status: true, total: results.length, results });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
}
