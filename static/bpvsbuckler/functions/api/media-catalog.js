// GET /api/media-catalog — read the Wayback and Great House Farm Wiki media
// indexes server-side, so the player is not dependent on third-party CORS headers.
// The browser receives a compact catalogue; original media files remain hosted at
// their source archive URLs.
const WAYBACK = 'https://wayback.bucklerfamily.estate';
const WIKI_MEDIA = 'https://greathousefarmwiki.wordpress.com/wp-json/wp/v2/media';
const WIKI_FIELDS = 'per_page=100&_fields=slug,source_url,alt_text,caption,title,media_type,mime_type,date,link';

async function rows(url) {
  try {
    const response = await fetch(url, {
      headers: { accept: 'application/json' },
      cf: { cacheTtl: 900, cacheEverything: true },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (_error) {
    return [];
  }
}

export async function onRequestGet() {
  const [waybackImages, waybackVideos, wikiImages, wikiVideos] = await Promise.all([
    rows(WAYBACK + '/images/_treeview.json'),
    rows(WAYBACK + '/video/_treeview.json'),
    rows(WIKI_MEDIA + '?' + WIKI_FIELDS + '&media_type=image'),
    rows(WIKI_MEDIA + '?' + WIKI_FIELDS + '&media_type=video'),
  ]);
  return new Response(JSON.stringify({
    waybackImages,
    waybackVideos,
    wikiMedia: [...wikiImages, ...wikiVideos],
  }), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300, s-maxage=900',
      'x-content-type-options': 'nosniff',
    },
  });
}
