import { scrapeList, fetchPage, parseItems, BASE_URL, setCors } from '../_scraper.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const [ongoingData, completedData, upcomingPage] = await Promise.all([
      scrapeList(`${BASE_URL}/ongoing/page/{page}/`, 1),
      scrapeList(`${BASE_URL}/completed/page/{page}/`, 1),
      fetchPage(`${BASE_URL}/upcoming-donghua/`),
    ]);
    const upcoming = parseItems(upcomingPage);
    res.json({
      status: true,
      ongoing: ongoingData.results.slice(0, 12),
      completed: completedData.results.slice(0, 12),
      upcoming: upcoming.slice(0, 8),
    });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
}
