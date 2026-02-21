(function(){
  async function load() {
    let menuData = null;
    try {
      const res = await fetch('menu.json', { cache: 'no-store' });
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          menuData = await res.json();
        }
      }
    } catch (e) {
      // ignore
    }
    if (!menuData) {
      // Fallback minimal menu
      menuData = [
        { type: 'item', label: 'Dashboard', href: 'index.html' },
        { type: 'item', label: 'Dashboard 2', href: 'index2.html' },
        { type: 'item', label: 'Dashboard 3', href: 'index3.html' }
      ];
    }

    const currentPath = location.pathname.split('/').pop() || 'index.html';
    function renderItems(list){
      return list.map(item => {
        if (item.type === 'header') {
          return `<li class="nav-header">${item.label}</li>`;
        }
        const hasChildren = Array.isArray(item.children) && item.children.length > 0;
        const href = item.href || '#';
        if (hasChildren) {
          const childHtml = renderItems(item.children).join('');
          const isOpen = Boolean(item.open);
          return `
            <li class="nav-item ${isOpen ? 'menu-open' : ''}">
              <a href="${href}" class="nav-link ${href === currentPath ? 'active' : ''}">
                <p>${item.label}<i class="nav-arrow bi bi-chevron-right"></i></p>
              </a>
              <ul class="nav nav-treeview">${childHtml}</ul>
            </li>
          `;
        } else {
          const active = href === currentPath;
          return `<li class="nav-item"><a href="${href}" class="nav-link ${active ? 'active' : ''}"><p>${item.label}</p></a></li>`;
        }
      });
    }
    const html = renderItems(menuData).join('');
    const nav = document.getElementById('navigation');
    if (nav) nav.innerHTML = html;
    if (typeof $ !== 'undefined' && $.fn && $.fn.Treeview) {
      $('[data-lte-toggle="treeview"]').Treeview('init');
    }
  }
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
