// Shared helper for Vercel serverless functions
// Proxies to axlyapi.qzz.io instead of scraping anichin.moe directly

export const AXLY_BASE = 'https://axlyapi.qzz.io/donghua';

export function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/** Remove duplicated title text like "Foo BarFoo Bar" → "Foo Bar" */
export function dedupeTitle(title) {
  if (typeof title !== 'string') return '';
  const half = Math.floor(title.length / 2);
  if (title.length > 0 && title.length % 2 === 0 && title.slice(0, half) === title.slice(half)) {
    return title.slice(0, half);
  }
  return title;
}

export function slugFromUrl(url) {
  if (!url) return '';
  return url
    .replace(/^https?:\/\/[^/]+\//, '')
    .replace(/\/$/, '')
    .replace(/^\//, '');
}

/** Fetch from axlyapi with timeout */
export async function axlyFetch(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const res = await fetch(`${AXLY_BASE}${path}`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'DonghuaStream-Vercel/1.0' },
    });
    if (!res.ok) throw new Error(`Axly API error: ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Map a raw axly list item to clean shape */
export function mapItem(item) {
  return {
    title: dedupeTitle(item.title),
    slug: item.slug ?? '',
    url: item.url ?? '',
    type: item.type ?? '',
    status: item.status ?? '',
    sub: item.sub ?? '',
    thumbnail: item.thumbnail ?? null,
  };
}
