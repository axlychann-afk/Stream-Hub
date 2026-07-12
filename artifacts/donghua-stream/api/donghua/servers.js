import { AXLY_BASE, setCors, unwrapEmbedUrl, isServerBlocked, mergeServers, scrapeAnimasuServersForSlug } from '../_scraper.js';
import { getDailymotionServer } from '../_dailymotion.js';

// Fetch anichin's own /servers directly (not via axlyFetch — a 404 for an
// episode anichin hasn't indexed yet should not throw, since Dailymotion may
// still have it; axlyFetch's `if (!res.ok) throw` behavior is fine here
// because we handle the rejection below).
async function fetchAnichinServers(slug) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(`${AXLY_BASE}/servers?slug=${encodeURIComponent(slug)}`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'DonghuaStream-Vercel/1.0' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const slug = String(req.query.slug ?? '').trim();
  if (!slug) return res.status(400).json({ status: false, error: 'Parameter "slug" diperlukan' });

  try {
    // Race anichin, Animasu, and Dailymotion in parallel — a slow/cold
    // Dailymotion channel lookup or a flaky Animasu upstream must not gate
    // the whole response (see _dailymotion.js / _scraper.js for details).
    const [anichinData, animasuServers, dailymotionServer] = await Promise.all([
      fetchAnichinServers(slug),
      scrapeAnimasuServersForSlug(slug),
      getDailymotionServer(slug),
    ]);

    const anichinServers = [];
    let title = '';
    let titleSlug = slug;
    if (anichinData?.status && anichinData?.result) {
      const r = anichinData.result;
      title = typeof r.title === 'string' ? r.title : '';
      titleSlug = typeof r.slug === 'string' ? r.slug : slug;
      for (const s of r.servers ?? []) {
        const name = typeof s.label === 'string' ? s.label.trim() : '';
        const embed_url = unwrapEmbedUrl(typeof s.embed_url === 'string' ? s.embed_url.trim() : '');
        if (name && embed_url && !isServerBlocked(name, embed_url)) anichinServers.push({ name, embed_url });
      }
    }

    let servers = mergeServers(anichinServers, animasuServers);

    // Extra server from the dongchindopro Dailymotion channel — appended
    // after anichin/Animasu, but if those came back empty (a brand-new
    // episode not indexed by Axly yet) this ends up being the only server
    // offered, so a Dailymotion-only episode still works end-to-end.
    if (dailymotionServer) servers.push(dailymotionServer);

    if (servers.length === 0) {
      return res.status(404).json({ status: false, error: `Servers not found for slug: ${slug}` });
    }

    res.json({
      status: true,
      result: {
        title,
        slug: titleSlug,
        total_servers: servers.length,
        servers: servers.map((s) => ({ label: s.name, embed_url: s.embed_url })),
      },
    });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
}
