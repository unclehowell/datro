(function(){
  const CACHE_KEY = 'pcp:header-menu:v1';
  const CACHE_TTL_MS = 5 * 60 * 1000;

  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.data)) return null;
      return parsed;
    } catch (error) {
      return null;
    }
  }

  function writeCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
    } catch (error) {
      // storage may be unavailable; ignore
    }
  }

  async function fetchJson(urls) {
    for (const url of urls) {
      try {
        const response = await fetch(url, { cache: 'default' });
        if (!response.ok) continue;
        const parsed = JSON.parse(await response.text());
        if (Array.isArray(parsed)) return parsed;
      } catch (error) {
        // try next candidate
      }
    }
    return null;
  }

  function renderHeader(headerData) {
    const container = document.getElementById('header-menu');
    if (!container) return;

    container.innerHTML = headerData.map((item) => {
      const href = item.href || '#';
      const label = item.label || '';
      const icon = item.icon ? `<i class="nav-icon ${item.icon}"></i> ` : '';
      return `<a class="nav-link" href="${href}">${icon}${label}</a>`;
    }).join('');
  }

  async function loadHeader(){
    const fallbackHeader = [
      { label: 'Dashboard', href: 'index.html' },
      { label: 'Theme Generate', href: 'generate/theme.html' }
    ];

    const cached = readCache();
    if (cached) {
      renderHeader(cached.data);
    }

    const useNetwork = !cached || (Date.now() - cached.ts > CACHE_TTL_MS);
    if (!useNetwork) return;

    const headerData = await fetchJson([
      'header-menu.json',
      '/static/pcp/header-menu.json',
      'menu-header.json',
      '/static/pcp/menu-header.json'
    ]) || cached?.data || fallbackHeader;

    renderHeader(headerData);
    writeCache(headerData);
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', loadHeader);
  } else {
    loadHeader();
  }
})();
