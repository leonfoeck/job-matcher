import * as cheerio from 'cheerio';

export function htmlToText(html?: string | null) {
    if (!html) return '';
    const $ = cheerio.load(`<div id="x">${html}</div>`);
    $('script,style,noscript').remove();
    return $('#x').text().replace(/\s+/g, ' ').trim().slice(0, 20000);
}
