(function(){
  const CACHE_KEY = 'pcp:menu:v1';
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

  function renderItems(list, currentPath){
    return list.map((item) => {
      if (item.type === 'header') {
        return `<li class="nav-header">${item.label}</li>`;
      }

      const hasChildren = Array.isArray(item.children) && item.children.length > 0;
      const href = item.href || '#';
      const icon = item.icon ? `<i class="nav-icon ${item.icon}"></i>` : '<i class="nav-icon bi bi-circle"></i>';

      if (hasChildren) {
        const childHtml = renderItems(item.children, currentPath).join('');
        const isOpen = Boolean(item.open);
        return `
          <li class="nav-item ${isOpen ? 'menu-open' : ''}">
            <a href="${href}" class="nav-link ${href === currentPath ? 'active' : ''}" data-lte-toggle="treeview">
              ${icon}
              <p>${item.label}<i class="nav-arrow bi bi-chevron-right"></i></p>
            </a>
            <ul class="nav nav-treeview">${childHtml}</ul>
          </li>
        `;
      }

      const active = href === currentPath;
      return `<li class="nav-item"><a href="${href}" class="nav-link ${active ? 'active' : ''}">${icon}<p>${item.label}</p></a></li>`;
    });
  }

  function renderMenu(menuData) {
    const currentPath = location.pathname.split('/').pop() || 'index.html';
    const nav = document.getElementById('navigation');
    if (!nav) return;
    nav.innerHTML = renderItems(menuData, currentPath).join('');
    window.dispatchEvent(new CustomEvent('menuLoaded', { detail: { loader: 'menu-loader' } }));
  }

  async function load() {
    const fallbackMenu = [
      { type: 'item', label: 'Dashboard', href: 'index.html' },
      { type: 'item', label: 'Dashboard 2', href: 'index2.html' },
      { type: 'item', label: 'Dashboard 3', href: 'index3.html' }
    ];

    const cached = readCache();
    if (cached) {
      renderMenu(cached.data);
    }

    const useNetwork = !cached || (Date.now() - cached.ts > CACHE_TTL_MS);
    if (!useNetwork) return;

    const menuData = await fetchJson(['menu.json', '/static/pcp/menu.json']) || cached?.data || fallbackMenu;
    renderMenu(menuData);
    writeCache(menuData);
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
