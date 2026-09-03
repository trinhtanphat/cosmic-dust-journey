const decodeEntities = (value) => value
  .replaceAll('&amp;', '&')
  .replaceAll('&lt;', '<')
  .replaceAll('&gt;', '>')
  .replaceAll('&quot;', '"')
  .replaceAll('&#39;', "'");

const stripTags = (value) => decodeEntities(value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
const matches = (html, pattern) => [...html.matchAll(pattern)].map((match) => stripTags(match[1])).filter(Boolean);
const absolute = (value, sourceUrl) => {
  try { return new URL(value, sourceUrl).href; } catch { return null; }
};

export function extractReference(html, sourceUrl) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const descriptionMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i)
    ?? html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i);
  const urlMatches = [...html.matchAll(/<(img|source|video|audio|link|script)\b[^>]*(?:src|href)=["']([^"']+)["'][^>]*>/gi)];
  const assetUrls = [];
  const inspectOnlyUrls = [];
  for (const match of urlMatches) {
    const tag = match[1].toLowerCase();
    const url = absolute(match[2], sourceUrl);
    if (!url) continue;
    if (tag === 'script' || /\.(?:js|mjs)(?:\?|$)/i.test(url)) inspectOnlyUrls.push(url);
    else if (!url.startsWith('data:')) assetUrls.push(url);
  }
  return {
    sourceUrl,
    title: titleMatch ? stripTags(titleMatch[1]) : '',
    description: descriptionMatch ? stripTags(descriptionMatch[1]) : '',
    headings: matches(html, /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi),
    paragraphs: matches(html, /<p[^>]*>([\s\S]*?)<\/p>/gi),
    uiCues: matches(html, /<(?:button|label)[^>]*>([\s\S]*?)<\/(?:button|label)>/gi),
    assetUrls: [...new Set(assetUrls)].sort(),
    inspectOnlyUrls: [...new Set(inspectOnlyUrls)].sort(),
  };
}
