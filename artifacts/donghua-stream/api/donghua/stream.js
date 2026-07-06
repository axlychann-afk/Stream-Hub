import { fetchPage, BASE_URL, setCors } from '../_scraper.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const slug = String(req.query.slug ?? '').trim();
  if (!slug) return res.status(400).json({ status: false, error: 'Parameter "slug" diperlukan' });
  try {
    const $ = await fetchPage(`${BASE_URL}/${slug}/`);
    let streamUrl = null, videoId = null, source = null;

    $('iframe[src*="dailymotion.com"]').each((_, el) => {
      const src = $(el).attr('src');
      if (src) { const m = src.match(/video=([a-zA-Z0-9]+)/); if (m) { videoId = m[1]; streamUrl = `https://www.dailymotion.com/embed/video/${videoId}?ui=0&autoplay=1`; source = 'Dailymotion'; } return false; }
    });
    if (!streamUrl) $('iframe[src*="ok.ru"]').each((_, el) => {
      const src = $(el).attr('src');
      if (src) { streamUrl = src; source = 'OK.ru'; const m = src.match(/videoembed\/(\d+)/); if (m) videoId = m[1]; return false; }
    });
    if (!streamUrl) $('iframe[src*="rumble.com"]').each((_, el) => {
      const src = $(el).attr('src');
      if (src) { streamUrl = src; source = 'Rumble'; const m = src.match(/embed\/([a-zA-Z0-9]+)/); if (m) videoId = m[1]; return false; }
    });
    if (!streamUrl) $('a[href*="dailymotion.com"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) { const m = href.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/); if (m) { videoId = m[1]; streamUrl = `https://www.dailymotion.com/embed/video/${videoId}?ui=0&autoplay=1`; source = 'Dailymotion'; } return false; }
    });
    if (!streamUrl) $('a[href*="ok.ru"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) { const m = href.match(/ok\.ru\/video\/(\d+)/); if (m) { videoId = m[1]; streamUrl = `https://ok.ru/videoembed/${videoId}`; source = 'OK.ru'; } return false; }
    });

    if (!streamUrl) return res.status(404).json({ status: false, error: 'Link streaming tidak ditemukan' });

    const title = $('.entry-title').text().trim() || 'Donghua Episode';
    let watchUrl = streamUrl;
    if (source === 'OK.ru' && videoId) watchUrl = `https://ok.ru/video/${videoId}`;
    else if (source === 'Dailymotion' && videoId) watchUrl = `https://www.dailymotion.com/video/${videoId}`;

    res.json({ status: true, result: { title, source, video_id: videoId, embed_url: streamUrl, watch_url: watchUrl } });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
}
