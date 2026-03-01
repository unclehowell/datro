(function(){
  function assetPath(fileName) {
    return `/static/pcp/assets/img/${fileName}`;
  }

  function setImgWithFallback(img, fileName) {
    if (!img) return;
    const candidates = [
      `/static/pcp/assets/img/${fileName}`,
      `/assets/img/${fileName}`,
      `../assets/img/${fileName}`,
      `assets/img/${fileName}`
    ];
    let index = 0;
    img.onerror = () => {
      index += 1;
      if (index < candidates.length) img.src = candidates[index];
    };
    img.src = candidates[index];
  }

  function ensureTopBar(){
    const header = document.querySelector('.app-header .container-fluid');
    if (!header) return;
    header.innerHTML = '';
  }

  function ensureSidebarBrand(){
    const brand = document.querySelector('.brand-link');
    if (!brand) return;
    const img = brand.querySelector('img.brand-image') || brand.querySelector('img');
    if (img) {
      setImgWithFallback(img, 'AdminLTELogo.png');
      img.alt = 'Logo';
      img.classList.add('brand-image');
    }
    const text = brand.querySelector('.brand-text');
    if (text) text.remove();
  }

  function updateSidebarWidth() {
    const sidebar = document.querySelector('.app-sidebar');
    const width = sidebar ? sidebar.getBoundingClientRect().width : 0;
    document.documentElement.style.setProperty('--sidebar-width', `${Math.max(0, Math.round(width))}px`);
  }

  function ensureSidebarToggle(){
    if (document.querySelector('.shell-sidebar-toggle')) return;
    const btn = document.createElement('button');
    btn.className = 'shell-sidebar-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Toggle sidebar');
    btn.textContent = '≡';
    btn.addEventListener('click', () => {
      document.body.classList.toggle('sidebar-collapse');
      updateSidebarWidth();
    });
    document.body.appendChild(btn);
  }

  function ensureContentHeader(){
    const header = document.querySelector('.app-content-header .container-fluid');
    if (!header) return;
    if (header.querySelector('.pcp-page-header')) return;
    header.innerHTML = `
      <div class="pcp-page-header">
        <div class="pcp-page-title">Ad Generator</div>
        <div class="pcp-page-actions">
          <button class="btn btn-sm btn-primary" type="button" id="headerTryFreeBtn">Try Now</button>
          <button class="btn btn-sm btn-warning" type="button" id="headerUploadBtn">🖼 Upload</button>
          <input id="headerUploadInput" type="file" accept="image/*" style="display:none;">
        </div>
      </div>
      <div class="pcp-header-divider"></div>
    `;
    const tryBtn = header.querySelector('#headerTryFreeBtn');
    const uploadBtn = header.querySelector('#headerUploadBtn');
    const uploadInput = header.querySelector('#headerUploadInput');
    if (tryBtn) tryBtn.addEventListener('click', () => {
      if (window.showModalError) window.showModalError('Try Free coming soon.');
    });
    if (uploadBtn && uploadInput) {
      uploadBtn.addEventListener('click', () => uploadInput.click());
      uploadInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file && typeof window.applyBgFile === 'function') {
          window.applyBgFile(file);
        }
      });
    }
  }

  function collapseSidebarDefault(){
    document.body.classList.add('sidebar-collapse');
  }

  document.addEventListener('DOMContentLoaded', () => {
    ensureTopBar();
    ensureSidebarBrand();
    ensureContentHeader();
    ensureSidebarToggle();
    updateSidebarWidth();
    window.addEventListener('resize', updateSidebarWidth);
    const observer = new MutationObserver(() => updateSidebarWidth());
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    collapseSidebarDefault();
  });
})();
