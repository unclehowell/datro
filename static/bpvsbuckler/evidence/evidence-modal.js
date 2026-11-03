const EvidenceSystem = {
  data: null,
  waybackBase: 'https://wayback.datro.xyz/bpvsbuckler/evidence',

  async loadData() {
    try {
      const resp = await fetch('evidence/data.json');
      this.data = await resp.json();
    } catch (e) {
      console.warn('Evidence data not loaded:', e);
      this.data = {};
    }
  },

  hasEvidence(year) {
    const entries = this.data[year];
    if (!entries || entries.length === 0) return false;
    return entries.some(e => e.evidence && e.evidence.length > 0);
  },

  getEvidenceCount(year) {
    const entries = this.data[year];
    if (!entries) return 0;
    return entries.reduce((sum, e) => sum + (e.evidence ? e.evidence.length : 0), 0);
  },

  getEntry(year, index) {
    const entries = this.data[year];
    if (!entries || index >= entries.length) return null;
    return entries[index];
  },

  renderIcon(year) {
    const count = this.getEvidenceCount(year);
    const has = count > 0;
    const icon = document.createElement('span');
    icon.className = `evidence-icon${has ? ' has-evidence' : ' no-evidence'}`;
    icon.dataset.year = year;
    icon.innerHTML = `<span class="dot"></span><span class="year-label">${year}</span>${has ? `<span class="count">${count}</span>` : ''}`;
    if (has) {
      icon.addEventListener('click', () => this.openModal(year, 0));
    }
    return icon;
  },

  async openModal(year, entryIndex = 0) {
    if (!this.data) await this.loadData();
    const entry = this.getEntry(year, entryIndex);
    if (!entry) return;

    const overlay = document.getElementById('evidence-overlay') || this.createOverlay();
    const header = overlay.querySelector('.evidence-modal-header h2');
    const body = overlay.querySelector('.evidence-modal-body');

    header.textContent = `${year} — ${entry.subject}`;
    body.innerHTML = `<p>${entry.content}</p>${this.renderGallery(year, entryIndex)}`;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  renderGallery(year, entryIndex) {
    const entry = this.getEntry(year, entryIndex);
    if (!entry || !entry.evidence || entry.evidence.length === 0) {
      return '<div class="evidence-empty"><p>No evidence media uploaded yet. Check back soon.</p></div>';
    }
    let html = '<div class="evidence-gallery">';
    for (const item of entry.evidence) {
      const thumbHtml = item.type === 'image'
        ? `<img src="${item.url}" alt="${item.title}" loading="lazy">`
        : this.getTypeIcon(item.type);
      html += `
        <div class="evidence-item" onclick="window.open('${item.url}','_blank')">
          <div class="evidence-item-thumb">${thumbHtml}</div>
          <div class="evidence-item-info">
            <h4>${item.title}</h4>
            <span class="type-badge">${item.type}</span>
          </div>
        </div>`;
    }
    html += '</div>';
    return html;
  },

  getTypeIcon(type) {
    const icons = { pdf: '📄', email: '✉️', document: '📋', image: '🖼️', video: '🎬', audio: '🎵' };
    return icons[type] || '📁';
  },

  createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'evidence-overlay';
    overlay.className = 'evidence-overlay';
    overlay.innerHTML = `
      <div class="evidence-modal">
        <div class="evidence-modal-header">
          <h2></h2>
          <button class="evidence-modal-close" onclick="EvidenceSystem.closeModal()">&times;</button>
        </div>
        <div class="evidence-modal-body"></div>
      </div>`;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeModal();
    });
    document.body.appendChild(overlay);
    return overlay;
  },

  closeModal() {
    const overlay = document.getElementById('evidence-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  async init(containerSelector) {
    await this.loadData();
    const container = document.querySelector(containerSelector);
    if (!container) return;
    const years = Object.keys(this.data).sort();
    for (const year of years) {
      container.appendChild(this.renderIcon(year));
    }
  }
};
