// GET /api/media-catalog — search the Wayback archive and Great House Farm
// Wiki media, with a committed WordPress media-index fallback. The public WP
// REST endpoint can be unavailable to server-to-server requests, so the static
// index keeps existing Wiki evidence images available in every deployment.
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

async function staticWikiRows(request, env) {
  try {
    const url = new URL('/api/wiki-media-index.json', request.url);
    const response = env.ASSETS
      ? await env.ASSETS.fetch(url)
      : await fetch(url, { headers: { accept: 'application/json' } });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (_error) {
    return [];
  }
}

function uniqueRows(groups) {
  const seen = new Set();
  const result = [];
  for (const group of groups) {
    for (const row of group) {
      const key = row.source_url || row.path || row.link || row.name;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      result.push(row);
    }
  }
  return result;
}

export async function onRequestGet({ request, env }) {
  const [waybackImages, waybackVideos, wikiImages, wikiVideos, wikiSeed] = await Promise.all([
    rows(WAYBACK + '/images/_treeview.json'),
    rows(WAYBACK + '/video/_treeview.json'),
    wikiRows('image'),
    wikiRows('video'),
    staticWikiRows(request, env),
  ]);
  return new Response(JSON.stringify({
    waybackImages,
    waybackVideos,
    wikiMedia: uniqueRows([wikiImages, wikiVideos, wikiSeed]),
  }), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300, s-maxage=900',
      'x-content-type-options': 'nosniff',
    },
  });
}
