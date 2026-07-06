import { fetchPage, extractSlug, BASE_URL, setCors } from '../_scraper.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const slug = String(req.query.slug ?? '').trim();
  if (!slug) return res.status(400).json({ status: false, error: 'Parameter "slug" diperlukan' });
  try {
    const $ = await fetchPage(`${BASE_URL}/${slug}/`);
    const detail = {
      title: $('.bixbox .infox h1.entry-title').text().trim(),
      alternative: $('.bixbox .infox .alter').text().trim(),
      rating: $('.bixbox .rating strong').text().trim().replace('Rating ', ''),
      status: '', type: '', studio: '', network: '', releaseDate: '',
      duration: '', season: '', country: '', totalEpisodes: '', subber: '',
      genres: [],
      sinopsis: $('.bixbox .desc').text().trim(),
      cover: $('.bixbox .thumb img').attr('src') || null,
      episodes: [],
    };
    $('.bixbox .info-content .spe span').each((_, el) => {
      const text = $(el).text().trim();
      if (text.includes('Status:')) detail.status = text.replace('Status:', '').trim();
      else if (text.includes('Tipe:')) detail.type = text.replace('Tipe:', '').trim();
      else if (text.includes('Studio:')) detail.studio = text.replace('Studio:', '').trim();
      else if (text.includes('Network:')) detail.network = text.replace('Network:', '').trim();
      else if (text.includes('Tanggal rilis:')) detail.releaseDate = text.replace('Tanggal rilis:', '').trim();
      else if (text.includes('Durasi:')) detail.duration = text.replace('Durasi:', '').trim();
      else if (text.includes('Season:')) detail.season = text.replace('Season:', '').trim();
      else if (text.includes('Negara:')) detail.country = text.replace('Negara:', '').trim();
      else if (text.includes('Episode:')) detail.totalEpisodes = text.replace('Episode:', '').trim();
      else if (text.includes('Subber:')) detail.subber = text.replace('Subber:', '').trim();
    });
    $('.bixbox .genxed a').each((_, el) => detail.genres.push($(el).text().trim()));
    const tempEps = [];
    $('.eplister ul li, .listeps ul li').each((_, el) => {
      const epTitle = $(el).find('.epl-title, .lchx a').text().trim();
      const epLink = $(el).find('a').attr('href');
      const epDate = $(el).find('.epl-date, .date').text().trim();
      if (epTitle && epLink) {
        tempEps.push({ title: epTitle, url: epLink.startsWith('http') ? epLink : `${BASE_URL}${epLink}`, date: epDate || null });
      }
    });
    tempEps.reverse();
    detail.episodes = tempEps.map((ep, i) => ({
      number: i + 1, title: ep.title, url: ep.url,
      slug: extractSlug(ep.url), date: ep.date,
    }));
    if (!detail.totalEpisodes) detail.totalEpisodes = detail.episodes.length;
    res.json({ status: true, result: detail });
  } catch (err) {
    res.status(err.response?.status === 403 ? 403 : 500).json({ status: false, error: err.message });
  }
}
