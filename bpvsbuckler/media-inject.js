(function() {
  const WAYBACK_BASE = 'https://wayback.datro.xyz';
  const SLIDE_CONFIG = {
    'bpvsbuckler': {
      text: { icon: '📧', label: 'Texts', filter: 'bpvsbuckler' },
      pdf: { icon: '📄', label: 'PDFs', filter: 'bpvsbuckler' },
      image: { icon: '🖼️', label: 'Images', filter: 'bpvsbuckler' },
      video: { icon: '▶️', label: 'Videos', filter: 'bpvsbuckler' }
    }
  };

  const API_PARAMS = {
    text: { file: 'wayback/text/_treeview.json', label: '📧 Texts (#bpvsbuckler)' },
    pdf: { file: 'wayback/pdf/_treeview.json', label: '📄 PDFs (#bpvsbuckler)' },
    image: { file: 'wayback/images/_treeview.json', label: '🖼️ Images (#bpvsbuckler)' },
    video: { file: 'wayback/video/_treeview.json', label: '▶️ Videos (#bpvsbuckler)' }
  };

  function createModal() {
    if (document.getElementById('media-gallery-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'media-gallery-modal';
    modal.innerHTML = `
      <div style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);z-index:10000;padding:2rem;overflow-y:auto;">
        <div style="max-width:1000px;margin:0 auto;background:#1a1a2e;border-radius:12px;padding:1.5rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
            <h2 id="media-modal-title" style="font-size:1.5rem;color:#fff;"></h2>
            <button id="close-media-modal" style="font-size:2rem;background:none;border:none;color:#fff;cursor:pointer;">&times;</button>
          </div>
          <div id="media-filter-bar" style="margin-bottom:1rem;"></div>
          <div id="media-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;"></div>
        </div>
      </div>
      <style>
        #media-gallery-modal .media-item { background:rgba(255,255,255,0.05);padding:1rem;border-radius:8px;word-break:break-word; }
        #media-gallery-modal .media-item a { color:#88c0d0;text-decoration:none; }
        #media-gallery-modal .media-item a:hover { text-decoration:underline; }
        #media-gallery-modal .filter-btn { padding:0.5rem 1rem;margin-right:0.5rem;background:rgba(255,255,255,0.1);border:none;border-radius:4px;color:#fff;cursor:pointer; }
        #media-gallery-modal .filter-btn.active { background:#88c0d0;color:#000; }
      </style>
    `;
    document.body.appendChild(modal);
  }

  async function loadData(type) {
    try {
      const response = await fetch(WAYBACK_BASE + '/wayback/' + type + '/_treeview.json');
      return await response.json();
    } catch (e) {
      return [];
    }
  }

  function filterByTag(data, tag) {
    return data.filter(item => item.name && item.name.toLowerCase().includes('#' + tag.toLowerCase()));
  }

  function renderGallery(type, items) {
    document.getElementById('media-modal-title').textContent = API_PARAMS[type].label;
    const grid = document.getElementById('media-grid');
    grid.innerHTML = '';
    const filterBar = document.getElementById('media-filter-bar');
    filterBar.innerHTML = '';
    
    const categories = {};
    items.forEach(item => {
      const name = item.name.replace(/_/g, ' ').replace(/#/g, ' ');
      const path = item.path.startsWith('wayback/') ? item.path.substring(7) : item.path;
      const div = document.createElement('div');
      div.className = 'media-item';
      div.innerHTML = `<a href="${WAYBACK_BASE}/${path}" target="_blank">${name}</a>`;
      grid.appendChild(div);
    });
    
    document.querySelector('#media-gallery-modal > div').style.display = 'block';
  }

  function addMediaIconsToSlide(slide, tag) {
    if (slide.querySelector('.media-icons-container')) return;
    
    const config = SLIDE_CONFIG[tag];
    if (!config) return;
    
    const iconsContainer = document.createElement('div');
    iconsContainer.className = 'media-icons-container';
    iconsContainer.style.cssText = 'display:flex;gap:0.75rem;flex-wrap:wrap;margin-top:1rem;padding-top:0.75rem;border-top:1px solid rgba(255,255,255,0.1);';
    
    Object.entries(config).forEach(([type, cfg]) => {
      const iconBtn = document.createElement('div');
      iconBtn.className = 'media-icon-btn';
      iconBtn.dataset.type = type;
      iconBtn.dataset.filter = cfg.filter;
      iconBtn.style.cssText = 'display:flex;align-items:center;gap:0.5rem;padding:0.4rem 0.8rem;background:rgba(255,255,255,0.08);border-radius:6px;cursor:pointer;transition:all 0.2s;font-size:1rem;border:1px solid rgba(255,255,255,0.1);';
      iconBtn.innerHTML = `<span>${cfg.icon}</span><span style="font-size:0.85rem;color:#aaa;">${cfg.label} (<span class="count-${type}">0</span>)</span>`;
      
      iconBtn.addEventListener('click', async (e) => {
        const type = e.currentTarget.dataset.type;
        const filter = e.currentTarget.dataset.filter;
        const data = await loadData(type);
        const filtered = filterByTag(data, filter);
        renderGallery(type, filtered);
      });
      
      iconsContainer.appendChild(iconBtn);
    });
    
    slide.appendChild(iconsContainer);
  }

  async function updateCounts(tag) {
    for (const type of Object.keys(API_PARAMS)) {
      try {
        const data = await loadData(type);
        const filtered = filterByTag(data, tag);
        const countEl = document.querySelector(`.count-${type}`);
        if (countEl) countEl.textContent = filtered.length;
      } catch (e) {}
    }
  }

  function injectIcons() {
    const root = document.getElementById('root');
    if (!root) return;
    
    const slides = root.querySelectorAll('[data-slide], .slide, [class*="slide"]');
    if (slides.length === 0) {
      const allDivs = root.querySelectorAll('div');
      for (const div of allDivs) {
        if (div.textContent && div.textContent.length > 50 && div.children.length > 0) {
          addMediaIconsToSlide(div, 'bpvsbuckler');
        }
      }
    } else {
      slides.forEach(slide => addMediaIconsToSlide(slide, 'bpvsbuckler'));
    }
  }

  function setupModalHandlers() {
    const closeBtn = document.getElementById('close-media-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        document.querySelector('#media-gallery-modal > div').style.display = 'none';
      });
    }
    
    const modal = document.getElementById('media-gallery-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.querySelector('div').style.display = 'none';
        }
      });
    }
  }

  const observer = new MutationObserver((mutations, obs) => {
    const root = document.getElementById('root');
    if (root && root.children.length > 0) {
      createModal();
      injectIcons();
      updateCounts('bpvsbuckler');
      setupModalHandlers();
      obs.disconnect();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  if (document.readyState === 'complete') {
    observer.takeRecords();
    createModal();
    injectIcons();
    updateCounts('bpvsbuckler');
    setupModalHandlers();
  }
})();