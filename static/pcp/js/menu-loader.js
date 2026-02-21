(function(){
  async function readJsonWithFallback(urls){
    for (const url of urls) {
      try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) continue;

        const body = await response.text();
        const parsed = JSON.parse(body);
        if (Array.isArray(parsed)) return parsed;
      } catch (error) {
        // try the next candidate
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

  async function load() {
    const menuData = await readJsonWithFallback([
      'menu.json',
      '/static/pcp/menu.json'
    ]) || [
      { type: 'item', label: 'Dashboard', href: 'index.html' },
      { type: 'item', label: 'Dashboard 2', href: 'index2.html' },
      { type: 'item', label: 'Dashboard 3', href: 'index3.html' }
    ];

    const currentPath = location.pathname.split('/').pop() || 'index.html';
    const html = renderItems(menuData, currentPath).join('');
    const nav = document.getElementById('navigation');

    if (nav) {
      nav.innerHTML = html;
    }

    window.dispatchEvent(new CustomEvent('menuLoaded', { detail: { loader: 'menu-loader' } }));
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
