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

  async function loadHeader(){
    const headerData = await readJsonWithFallback([
      'header-menu.json',
      '/static/pcp/header-menu.json',
      'menu-header.json',
      '/static/pcp/menu-header.json'
    ]) || [
      { label: 'Dashboard', href: 'index.html' },
      { label: 'Theme Generate', href: 'generate/theme.html' }
    ];

    const container = document.getElementById('header-menu');
    if (!container) return;

    container.innerHTML = headerData.map((item) => {
      const href = item.href || '#';
      const label = item.label || '';
      const icon = item.icon ? `<i class="nav-icon ${item.icon}"></i> ` : '';
      return `<a class="nav-link" href="${href}">${icon}${label}</a>`;
    }).join('');
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', loadHeader);
  } else {
    loadHeader();
  }
})();
