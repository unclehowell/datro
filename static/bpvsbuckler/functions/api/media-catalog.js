// GET /api/media-catalog — searchable media from the Wayback archive and
// Great House Farm Wiki. Proxying these catalogues through the player origin
// avoids browser CORS restrictions; original assets still open from their source.
const WAYBACK = 'https://wayback.bucklerfamily.estate';
const WIKI_MEDIA = 'https://greathousefarmwiki.wordpress.com/wp-json/wp/v2/media';
const WIKI_FIELDS = '_fields=slug,source_url,alt_text,caption,title,media_type,mime_type,date,link';

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

async function wikiRows(mediaType) {
  const makeUrl = (page) =>
    WIKI_MEDIA + '?' + WIKI_FIELDS + '&per_page=100&page=' + page + '&media_type=' + mediaType;
  try {
    const first = await fetch(makeUrl(1), {
      headers: { accept: 'application/json' },
      cf: { cacheTtl: 900, cacheEverything: true },
    });
    if (!first.ok) return [];
    const initial = await first.json();
    if (!Array.isArray(initial)) return [];
    const totalPagesHeader = Number(first.headers.get('X-WP-TotalPages') || 1);
    // The Workers subrequest budget is finite. This covers up to 2,000 items
    // per media type in addition to the complete dated Wayback indexes.
    const pageCount = Math.max(1, Math.min(Number.isFinite(totalPagesHeader) ? totalPagesHeader : 1, 20));
    if (pageCount === 1) return initial;
    const rest = await Promise.all(
      Array.from({ length: pageCount - 1 }, (_, index) => rows(makeUrl(index + 2))),
    );
    return initial.concat(...rest);
  } catch (_error) {
    return [];
  }
}

export async function onRequestGet() {
  const [waybackImages, waybackVideos, wikiImages, wikiVideos] = await Promise.all([
    rows(WAYBACK + '/images/_treeview.json'),
    rows(WAYBACK + '/video/_treeview.json'),
    wikiRows('image'),
    wikiRows('video'),
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
