import * as cheerio from 'cheerio';

export function htmlToText(html?: string | null) {
  if (!html) return '';
  const $ = cheerio.load(`<div id="x">${html}</div>`);
  $('script,style,noscript').remove();
  return $('#x').text().replace(/\s+/g, ' ').trim().slice(0, 20000);
}

export function normalizeDomain(input?: string | null): string | undefined {
  if (!input) return undefined;
  let s = String(input).trim();
  if (!s) return undefined;

  try {
    // If it looks like a URL, parse and take the hostname
    if (/^https?:\/\//i.test(s)) {
      const u = new URL(s);
      s = u.hostname;
    }
  } catch {
    // not a valid URL; fall back to whatever was provided
  }

  // strip leading www. and lower-case
  s = s.replace(/^www\./i, '').toLowerCase();
  // quick sanity: require at least one dot to look like a domain
  return /\./.test(s) ? s : undefined;
}
