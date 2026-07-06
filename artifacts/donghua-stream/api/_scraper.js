import axios from 'axios';
import * as cheerio from 'cheerio';

export const BASE_URL = 'https://anichin.moe';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
  'Cache-Control': 'no-cache',
};

export async function fetchPage(url) {
  const { data } = await axios.get(url, { headers: HEADERS, timeout: 8000 });
  return cheerio.load(data);
}

export function extractSlug(url) {
  return url
    .replace(/^https?:\/\/[^/]+\//, '')
    .replace(/\/$/, '')
    .replace(/^\//, '');
}

export function parseItems($) {
  const results = [];
  const seen = new Set();
  $('.listupd .bs').each((_, el) => {
    const link = $(el).find('.bsx a').attr('href') || '';
    const title = $(el).find('.tt').text().trim() || '';
    const type = $(el).find('.typez').text().trim() || '';
    const status = $(el).find('.epx').text().trim() || '';
    const sub = $(el).find('.sb').text().trim() || '';
    const thumbnail = $(el).find('img').attr('src') || null;
    if (title && link) {
      const fullUrl = link.startsWith('http') ? link : `${BASE_URL}${link}`;
      if (!seen.has(fullUrl)) {
        seen.add(fullUrl);
        results.push({ title, slug: extractSlug(link), url: fullUrl, type, status, sub, thumbnail });
      }
    }
  });
  return results;
}

export async function scrapeList(urlPattern, page = 1) {
  const url = urlPattern.replace('{page}', String(page));
  const $ = await fetchPage(url);
  const results = parseItems($);
  const hasMore = $('.pagination .nextpage').length > 0;
  return { results, hasMore };
}

export function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=60');
}
