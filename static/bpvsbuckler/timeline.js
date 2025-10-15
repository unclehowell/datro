(function () {
  const body = document.body;
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = themeToggle ? themeToggle.querySelector('[data-theme-icon]') : null;
  const introToggle = document.getElementById('intro-toggle');
  const introPanel = document.getElementById('intro-panel');
  const introClose = document.getElementById('intro-close');
  const caseTitle = document.getElementById('case-title');
  const caseSubtitle = document.getElementById('case-subtitle');
  const caseIntro = document.getElementById('case-intro');
  const keyThemes = document.getElementById('key-themes');
  const timelineRoot = document.getElementById('timeline');
  const loadingMessage = document.getElementById('timeline-loading');
  const modal = document.getElementById('modal');
  const closeBtn = modal ? modal.querySelector('.close-btn') : null;
  const modalTitle = document.getElementById('modal-title');
  const modalSource = document.getElementById('modal-source');
  const modalDescription = document.getElementById('modal-description');
  const modalBody = document.getElementById('modal-body');

  const yearBar = document.getElementById('timeline-year-bar');
  const yearTitle = document.getElementById('timeline-year-title');
  const yearMeta = document.getElementById('timeline-year-meta');
  const yearEntries = document.getElementById('timeline-year-entries');

  const eventIndex = new Map();
  const storageKey = 'ghf-theme';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  let yearGroups = [];
  let yearGroupMap = new Map();
  let activeYearKey = null;

  function setTheme(theme, persist = true) {
    const normalized = theme === 'dark' ? 'dark' : 'light';
    body.dataset.theme = normalized;
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', normalized === 'dark' ? 'true' : 'false');
      themeToggle.setAttribute('title', normalized === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    }
    if (themeIcon) {
      themeIcon.textContent = normalized === 'dark' ? '🌙' : '☀️';
    }
    if (persist) {
      try {
        localStorage.setItem(storageKey, normalized);
      } catch (error) {
        // ignore persistence failures
      }
    }
  }

  const savedTheme = (() => {
    try {
      return localStorage.getItem(storageKey);
    } catch (error) {
      return null;
    }
  })();

  if (savedTheme) {
    setTheme(savedTheme, false);
  } else {
    setTheme(prefersDark.matches ? 'dark' : 'light', false);
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = body.dataset.theme === 'dark' ? 'light' : 'dark';
      setTheme(next, true);
    });
  }

  prefersDark.addEventListener('change', event => {
    try {
      if (!localStorage.getItem(storageKey)) {
        setTheme(event.matches ? 'dark' : 'light', false);
      }
    } catch (error) {
      setTheme(event.matches ? 'dark' : 'light', false);
    }
  });

  function getEventYearValue(event) {
    const direct = Number(event?.yearValue);
    if (Number.isFinite(direct)) {
      return direct;
    }
    const match = typeof event?.year === 'string' ? event.year.match(/(1[0-9]{3}|20[0-9]{2})/) : null;
    if (match) {
      return Number(match[0]);
    }
    return null;
  }

  function sanitizeKey(value, fallback) {
    const base = String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return base || fallback;
  }

  function buildYearGroups(data) {
    eventIndex.clear();
    const groups = new Map();
    if (!Array.isArray(data?.centuries)) {
      return [];
    }

    data.centuries.forEach((century, centuryIndex) => {
      const events = Array.isArray(century?.events) ? century.events : [];
      events.forEach((event, eventIndexInCentury) => {
        if (!event || !event.id) {
          return;
        }
        const label = (typeof event.year === 'string' && event.year.trim()) || 'Undated';
        const normalized = label.toLowerCase();
        const sortValue = getEventYearValue(event);
        if (!groups.has(normalized)) {
          groups.set(normalized, {
            label,
            normalized,
            sortValue: Number.isFinite(sortValue) ? sortValue : null,
            events: [],
            centuries: [],
          });
        }
        const group = groups.get(normalized);
        if (Number.isFinite(sortValue)) {
          if (!Number.isFinite(group.sortValue) || sortValue < group.sortValue) {
            group.sortValue = sortValue;
          }
        }
        group.events.push({
          event,
          century,
          index: eventIndexInCentury,
        });
        if (century) {
          const signature = `${century.title || ''}__${century.range || ''}`;
          if (!group.centuries.some(entry => entry.signature === signature)) {
            group.centuries.push({
              signature,
              title: century.title || '',
              range: century.range || '',
            });
          }
        }
        eventIndex.set(event.id, { event, century });
      });
    });

    const result = Array.from(groups.values());
    result.sort((a, b) => {
      const aValue = Number.isFinite(a.sortValue) ? a.sortValue : Number.POSITIVE_INFINITY;
      const bValue = Number.isFinite(b.sortValue) ? b.sortValue : Number.POSITIVE_INFINITY;
      if (aValue !== bValue) {
        return aValue - bValue;
      }
      return a.label.localeCompare(b.label, undefined, { numeric: true });
    });

    const usedKeys = new Set();
    result.forEach((group, index) => {
      const baseKey = sanitizeKey(group.label, `year-${index + 1}`);
      let candidate = baseKey;
      let attempt = 2;
      while (usedKeys.has(candidate)) {
        candidate = `${baseKey}-${attempt}`;
        attempt += 1;
      }
      group.key = candidate;
      usedKeys.add(candidate);
      group.events.sort((a, b) => {
        const aSort = getEventYearValue(a.event);
        const bSort = getEventYearValue(b.event);
        if (Number.isFinite(aSort) && Number.isFinite(bSort) && aSort !== bSort) {
          return aSort - bSort;
        }
        return a.index - b.index;
      });
    });

    return result;
  }

  function updateYearMeta(group) {
    if (!yearMeta) {
      return;
    }
    if (!group || !group.centuries.length) {
      yearMeta.textContent = '';
      yearMeta.classList.add('hidden');
      return;
    }
    const descriptors = group.centuries
      .map(entry => {
        if (entry.title && entry.range) {
          return `${entry.title} (${entry.range})`;
        }
        return entry.title || entry.range;
      })
      .filter(Boolean);
    if (descriptors.length) {
      yearMeta.textContent = descriptors.join(' • ');
      yearMeta.classList.remove('hidden');
    } else {
      yearMeta.textContent = '';
      yearMeta.classList.add('hidden');
    }
  }

  function renderYearEntries(group) {
    if (!yearEntries) {
      return;
    }
    yearEntries.innerHTML = '';
    if (!group || !group.events.length) {
      const empty = document.createElement('li');
      empty.className = 'timeline-xmb__empty';
      empty.textContent = 'No entries recorded for this year.';
      yearEntries.appendChild(empty);
      return;
    }

    group.events.forEach(record => {
      const li = document.createElement('li');
      li.className = 'timeline-xmb__entry';

      const button = document.createElement('button');
      const side = record.event.side || 'both';
      button.type = 'button';
      button.className = `timeline-xmb__entry-button timeline-xmb__entry-button--${side}`;
      button.dataset.eventId = record.event.id;
      button.addEventListener('click', () => openEvent(record.event.id));

      const icon = document.createElement('span');
      icon.className = 'timeline-xmb__entry-icon';
      const iconSymbol = typeof record.event.icon === 'string' && record.event.icon.trim()
        ? record.event.icon.trim()
        : '•';
      icon.textContent = iconSymbol;
      if (record.event.iconLabel) {
        icon.setAttribute('role', 'img');
        icon.setAttribute('aria-label', record.event.iconLabel);
        icon.setAttribute('title', record.event.iconLabel);
      } else {
        icon.setAttribute('aria-hidden', 'true');
      }

      const textWrapper = document.createElement('span');
      textWrapper.className = 'timeline-xmb__entry-text';

      const title = document.createElement('span');
      title.className = 'timeline-xmb__entry-title';
      title.textContent = record.event.title;
      textWrapper.appendChild(title);

      if (record.event.summary) {
        const summary = document.createElement('span');
        summary.className = 'timeline-xmb__entry-summary';
        summary.textContent = record.event.summary;
        textWrapper.appendChild(summary);
      }

      const chevron = document.createElement('span');
      chevron.className = 'timeline-xmb__entry-chevron';
      chevron.setAttribute('aria-hidden', 'true');
      chevron.textContent = '›';

      button.appendChild(icon);
      button.appendChild(textWrapper);
      button.appendChild(chevron);

      li.appendChild(button);
      yearEntries.appendChild(li);
    });
  }

  function updateYearBarActive() {
    if (!yearBar) {
      return;
    }
    const buttons = yearBar.querySelectorAll('[data-year-key]');
    buttons.forEach(button => {
      const isActive = button.dataset.yearKey === activeYearKey;
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      button.classList.toggle('timeline-xmb__year-button--active', isActive);
    });
  }

  function updateUrlWithYear(key) {
    try {
      const url = new URL(window.location.href);
      if (key) {
        url.searchParams.set('year', key);
      } else {
        url.searchParams.delete('year');
      }
      window.history.replaceState(null, '', url);
    } catch (error) {
      // ignore URL update issues
    }
  }

  function activateYear(key, options = {}) {
    if (!key || !yearGroupMap.has(key)) {
      return;
    }
    const group = yearGroupMap.get(key);
    activeYearKey = key;
    if (yearTitle) {
      yearTitle.textContent = group.label;
    }
    updateYearMeta(group);
    renderYearEntries(group);
    updateYearBarActive();

    const shouldScroll = Boolean(options.scroll);
    const shouldFocus = Boolean(options.focus);
    if ((shouldScroll || shouldFocus) && yearBar) {
      const button = yearBar.querySelector(`[data-year-key='${key}']`);
      if (button) {
        if (shouldFocus) {
          button.focus({ preventScroll: true });
        }
        if (shouldScroll) {
          const barRect = yearBar.getBoundingClientRect();
          const buttonRect = button.getBoundingClientRect();
          if (buttonRect.left < barRect.left) {
            button.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
          } else if (buttonRect.right > barRect.right) {
            button.scrollIntoView({ behavior: 'smooth', inline: 'end', block: 'nearest' });
          }
        }
      }
    }

    updateUrlWithYear(key);
  }

  function renderYearBar() {
    if (!yearBar) {
      return;
    }
    yearBar.innerHTML = '';
    yearGroups.forEach(group => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'timeline-xmb__year-button';
      button.dataset.yearKey = group.key;
      button.setAttribute('aria-pressed', 'false');

      const label = document.createElement('span');
      label.className = 'timeline-xmb__year-label';
      label.textContent = group.label;
      button.appendChild(label);

      const count = document.createElement('span');
      count.className = 'timeline-xmb__year-count';
      count.textContent = `${group.events.length} ${group.events.length === 1 ? 'entry' : 'entries'}`;
      button.appendChild(count);

      button.addEventListener('click', () => {
        activateYear(group.key, { scroll: true });
      });

      yearBar.appendChild(button);
    });
  }

  function showEmptyTimelineState() {
    if (timelineRoot) {
      timelineRoot.classList.add('hidden');
    }
    if (loadingMessage) {
      loadingMessage.classList.remove('hidden');
      loadingMessage.textContent = 'No timeline entries available.';
    }
  }

  function renderTimeline(data) {
    yearGroups = buildYearGroups(data);
    yearGroupMap = new Map(yearGroups.map(group => [group.key, group]));
    if (!yearGroups.length) {
      showEmptyTimelineState();
      return;
    }

    if (loadingMessage) {
      loadingMessage.classList.add('hidden');
    }
    if (timelineRoot) {
      timelineRoot.classList.remove('hidden');
    }

    renderYearBar();
    let defaultKey = yearGroups[0].key;
    try {
      const url = new URL(window.location.href);
      const requested = url.searchParams.get('year') || (window.location.hash ? window.location.hash.replace(/^#/, '') : '');
      if (requested && yearGroupMap.has(requested)) {
        defaultKey = requested;
      }
    } catch (error) {
      // ignore URL issues
    }

    activateYear(defaultKey);
  }

  function renderIntro(data) {
    if (data.caseTitle) {
      caseTitle.textContent = data.caseTitle;
    }
    if (data.caseSubtitle) {
      caseSubtitle.textContent = data.caseSubtitle;
    }

    const hasIntro = Array.isArray(data.introduction) && data.introduction.length;
    caseIntro.innerHTML = '';
    if (hasIntro) {
      data.introduction.forEach(paragraph => {
        const p = document.createElement('p');
        p.innerHTML = paragraph;
        caseIntro.appendChild(p);
      });
      caseIntro.classList.remove('hidden');
    } else {
      caseIntro.classList.add('hidden');
    }

    const hasThemes = Array.isArray(data.keyThemes) && data.keyThemes.length;
    keyThemes.innerHTML = '';
    if (hasThemes) {
      data.keyThemes.forEach(theme => {
        const card = document.createElement('div');
        card.className = 'intro-card';

        const heading = document.createElement('h3');
        heading.textContent = theme.title;
        card.appendChild(heading);

        if (Array.isArray(theme.items) && theme.items.length) {
          const list = document.createElement('ul');
          theme.items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            list.appendChild(li);
          });
          card.appendChild(list);
        }

        keyThemes.appendChild(card);
      });
      keyThemes.classList.remove('hidden');
    } else {
      keyThemes.classList.add('hidden');
    }

    if (introPanel && introToggle) {
      const hasPanelContent = hasIntro || hasThemes;
      introPanel.classList.add('hidden');
      introPanel.setAttribute('aria-hidden', 'true');
      introToggle.setAttribute('aria-expanded', 'false');
      introToggle.classList.toggle('hidden', !hasPanelContent);
      introToggle.setAttribute('title', hasPanelContent ? 'About this timeline' : '');
      if (introClose) {
        introClose.classList.toggle('hidden', !hasPanelContent);
      }
    }
  }

  function buildContextSection(event) {
    if (!Array.isArray(event.context) || !event.context.length) {
      return null;
    }
    const wrapper = document.createElement('div');
    const heading = document.createElement('div');
    heading.className = 'modal-section-heading';
    heading.textContent = 'Context';
    wrapper.appendChild(heading);

    const list = document.createElement('ul');
    list.className = 'modal-context';
    event.context.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      list.appendChild(li);
    });
    wrapper.appendChild(list);
    return wrapper;
  }

  function buildEvidenceSection(event) {
    if (!Array.isArray(event.evidence) || !event.evidence.length) {
      return null;
    }
    const wrapper = document.createElement('div');
    const heading = document.createElement('div');
    heading.className = 'modal-section-heading';
    heading.textContent = 'Evidence & records';
    wrapper.appendChild(heading);

    const grid = document.createElement('div');
    grid.className = 'modal-evidence';

    event.evidence.forEach(evidence => {
      const block = document.createElement('article');
      block.className = 'modal-evidence-item';

      const title = document.createElement('h5');
      title.textContent = evidence.title;
      block.appendChild(title);

      if (evidence.description) {
        const description = document.createElement('p');
        description.textContent = evidence.description;
        block.appendChild(description);
      }

      if (Array.isArray(evidence.content) && evidence.content.length) {
        evidence.content.forEach(paragraph => {
          const p = document.createElement('p');
          p.textContent = paragraph;
          block.appendChild(p);
        });
      }

      if (evidence.embed && evidence.embed.type && evidence.embed.src) {
        if (evidence.embed.type === 'iframe') {
          const iframe = document.createElement('iframe');
          iframe.src = evidence.embed.src;
          iframe.loading = 'lazy';
          iframe.title = evidence.embed.title || evidence.title;
          block.appendChild(iframe);
        } else if (evidence.embed.type === 'object') {
          const object = document.createElement('object');
          object.data = evidence.embed.src;
          object.type = evidence.embed.mime || 'application/pdf';
          block.appendChild(object);
        }
      }

      if (evidence.source && (evidence.source.name || evidence.source.url)) {
        const meta = document.createElement('p');
        meta.className = 'modal-evidence-meta';
        if (evidence.source.url) {
          const link = document.createElement('a');
          link.href = evidence.source.url;
          link.target = '_blank';
          link.rel = 'noopener';
          link.textContent = evidence.source.name || evidence.source.url;
          meta.appendChild(document.createTextNode('Source: '));
          meta.appendChild(link);
        } else {
          meta.textContent = `Source: ${evidence.source.name}`;
        }
        block.appendChild(meta);
      }

      grid.appendChild(block);
    });

    wrapper.appendChild(grid);
    return wrapper;
  }

  function openEvent(eventId) {
    if (!modal) {
      return;
    }
    const record = eventIndex.get(eventId);
    if (!record) {
      return;
    }
    const { event, century } = record;
    modalTitle.textContent = event.title;

    if (century) {
      const details = [century.title, century.range, event.year].filter(Boolean).join(' • ');
      modalSource.textContent = details;
    } else {
      modalSource.textContent = event.year || '';
    }

    if (event.summary) {
      modalDescription.classList.remove('hidden');
      modalDescription.innerHTML = '';
      const summary = document.createElement('span');
      summary.className = 'modal-summary-text';
      summary.innerHTML = event.summary;
      modalDescription.appendChild(summary);

      const learnMoreLink = document.createElement('a');
      learnMoreLink.className = 'modal-learn-more';
      learnMoreLink.href = `entries/${encodeURIComponent(event.id)}.html`;
      learnMoreLink.textContent = 'Learn more';
      modalDescription.appendChild(learnMoreLink);
    } else {
      modalDescription.innerHTML = '';
      modalDescription.classList.add('hidden');
    }

    modalBody.innerHTML = '';

    const contextSection = buildContextSection(event);
    if (contextSection) {
      modalBody.appendChild(contextSection);
    }

    const evidenceSection = buildEvidenceSection(event);
    if (evidenceSection) {
      modalBody.appendChild(evidenceSection);
    }

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modal) {
      return;
    }
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  if (modal) {
    modal.addEventListener('click', event => {
      if (event.target === modal) {
        closeModal();
      }
    });
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && modal && modal.classList.contains('active')) {
      closeModal();
    }
  });

  function updateIntroState(nextState) {
    if (!introToggle || !introPanel) {
      return;
    }
    introToggle.setAttribute('aria-expanded', String(nextState));
    introPanel.classList.toggle('hidden', !nextState);
    introPanel.setAttribute('aria-hidden', nextState ? 'false' : 'true');
    introToggle.setAttribute('title', nextState ? 'Hide timeline introduction' : 'About this timeline');
    if (nextState) {
      introPanel.focus();
      introPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  if (introToggle && introPanel) {
    introToggle.addEventListener('click', () => {
      const isExpanded = introToggle.getAttribute('aria-expanded') === 'true';
      updateIntroState(!isExpanded);
    });
  }

  if (introClose) {
    introClose.addEventListener('click', () => updateIntroState(false));
  }

  if (yearBar) {
    yearBar.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
        return;
      }
      const buttons = Array.from(yearBar.querySelectorAll('[data-year-key]'));
      if (!buttons.length) {
        return;
      }
      const currentIndex = buttons.findIndex(button => button.dataset.yearKey === activeYearKey);
      let nextIndex = currentIndex;
      if (event.key === 'ArrowLeft') {
        nextIndex = currentIndex <= 0 ? buttons.length - 1 : currentIndex - 1;
      } else if (event.key === 'ArrowRight') {
        nextIndex = currentIndex >= buttons.length - 1 ? 0 : currentIndex + 1;
      }
      const nextButton = buttons[nextIndex];
      if (nextButton) {
        event.preventDefault();
        const { yearKey } = nextButton.dataset;
        activateYear(yearKey, { scroll: true, focus: true });
      }
    });
  }

  fetch('data/timeline.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to load timeline data');
      }
      return response.json();
    })
    .then(data => {
      renderIntro(data);
      renderTimeline(data);
    })
    .catch(error => {
      console.error(error);
      if (loadingMessage) {
        loadingMessage.classList.remove('hidden');
        loadingMessage.textContent = 'We could not load the timeline data. Please refresh the page.';
      }
    });
})();
