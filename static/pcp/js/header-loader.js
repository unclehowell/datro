(function(){
  async function loadHeader(){
    let headerData = null;
    const candidates = [
      '/static/pcp/header-menu.json',
      '/static/pcp/menu-header.json',
      'header-menu.json',
      'menu-header.json',
      '../header-menu.json'?0:0
    ];
    // Normalize candidates (remove the stray ternary)
    const urls = [
      '/static/pcp/header-menu.json',
      '/static/pcp/menu-header.json',
      'header-menu.json',
      'menu-header.json'
    ];
    for (const u of urls){
      try {
        const res = await fetch(u, { cache: 'no-store' });
        if (res.ok){
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('application/json')){ headerData = await res.json(); break; }
        }
      } catch(e) { /* ignore and try next */ }
    }
    if (!headerData){
      headerData = [
        { label: 'Dashboard', href: 'index.html' },
        { label: 'Theme Generate', href: 'generate/theme.html' }
      ];
    }
    // Render into header area
    const container = document.getElementById('header-menu');
    if(!container) return;
    const html = headerData.map(it => {
      const href = it.href || '#';
      const label = it.label || '';
      const icon = it.icon ? `<i class="nav-icon ${it.icon}"></i> ` : '';
      // Use the same styling as main nav links for visual consistency
      return `<a class="nav-link" href="${href}">${icon}${label}</a>`;
    }).join('');
    container.innerHTML = html;
  }
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', loadHeader);
  } else {
    loadHeader();
  }
})();

// React to menu load to stabilize header design after dynamic nav population
window.addEventListener('menuLoaded', function (e) {
  const header = document.querySelector('.app-header');
  if (header) {
    // Force a quick repaint to prevent layout shifts from the side navigation
    header.style.display = 'none';
    requestAnimationFrame(() => { header.style.display = ''; });
  }
});
