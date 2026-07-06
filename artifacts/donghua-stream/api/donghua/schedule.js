import { fetchPage, extractSlug, BASE_URL, setCors } from '../_scraper.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const $ = await fetchPage(`${BASE_URL}/schedule/`);
    const schedule = {};
    $('.listSchh').each((_, el) => {
      const day = $(el).find('h2').text().trim();
      const animes = [];
      $(el).find('.subSchh a').each((_, a) => {
        const title = $(a).text().trim();
        const href = $(a).attr('href') || '';
        animes.push({
          title: title.replace('[SVIP] ', ''),
          slug: extractSlug(href),
          url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
          is_vip: title.includes('[SVIP]'),
        });
      });
      if (animes.length > 0) schedule[day] = animes;
    });
    res.json({ status: true, result: schedule });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
}
