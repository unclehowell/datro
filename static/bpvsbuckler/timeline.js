(function () {
  const rootElement = document.documentElement;
  const yearTrack = document.getElementById('timeline-year-track');
  const yearViewport = document.getElementById('year-bar-viewport');
  const entryViewport = document.getElementById('timeline-entry-viewport');
  const entryList = document.getElementById('timeline-year-entries');
  const loadingBanner = document.getElementById('timeline-loading');

  if (!yearTrack || !entryViewport || !entryList) {
    return;
  }

  const LEADING_PLACEHOLDER_COUNT = 2;

  let yearGroups = [];
  let yearButtons = [];
  let entryItems = [];
  let activeYearIndex = 0;
  let activeEntryIndex = 0;
  let suppressFocusSync = false;
  let focusColumnOffset = 0;
  const layoutMetrics = {
    historyHeight: 0,
    horizontalHeight: 0,
    spacerHeight: 0,
    entryHeight: 0,
    entryGap: 0,
  };

  function readCssNumber(variableName, fallback = 0) {
    const raw = getComputedStyle(rootElement).getPropertyValue(variableName);
    const parsed = parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function refreshLayoutMetrics() {
    layoutMetrics.historyHeight = readCssNumber('--row-history-height', 96);
    layoutMetrics.horizontalHeight = readCssNumber('--horizontal-band-height', layoutMetrics.historyHeight);
    layoutMetrics.spacerHeight = readCssNumber('--row-spacer-height', 24);
    layoutMetrics.entryHeight = readCssNumber('--entry-row-height', layoutMetrics.historyHeight);
    layoutMetrics.entryGap = readCssNumber('--entry-gap', 16);
  }

  function limitWords(value, maxWords) {
    if (!value) {
      return '';
    }
    const words = String(value).trim().split(/\s+/);
    return words.slice(0, Math.max(1, maxWords)).join(' ');
  }

  function getYearSubtitle(group) {
    if (!group || !group.events.length) {
      return '';
    }
    const primaryEvent = group.events[0].event;
    const subtitleSource = primaryEvent.iconLabel || primaryEvent.title || primaryEvent.year || '';
    return limitWords(subtitleSource, 4);
  }

  function getEventSubtitle(event) {
    if (!event) {
      return '';
    }
    if (event.summary) {
      return limitWords(event.summary, 4);
    }
    if (event.title) {
      return limitWords(event.title, 4);
    }
    return limitWords(event.year, 4);
  }

  function normalizeMenuEntries(menuConfig) {
    if (!menuConfig || !Array.isArray(menuConfig.entries)) {
      return [];
    }

    return menuConfig.entries
      .map(entry => {
        if (!entry) {
          return null;
        }
        const rawKey = typeof entry.key === 'string' ? entry.key.trim() : '';
        if (!rawKey) {
          return null;
        }
        const normalized = rawKey.toLowerCase();
        const text = typeof entry.text === 'string' ? entry.text.trim() : '';
        const icon = typeof entry.icon === 'string' ? entry.icon.trim() : '';
        const ariaLabel =
          typeof entry.ariaLabel === 'string' ? entry.ariaLabel.trim() : '';

        return {
          key: normalized,
          text: text || null,
          icon: icon || null,
          ariaLabel: ariaLabel || null,
        };
      })
      .filter(Boolean);
  }

  function applyMenuConfiguration(groups, menuConfig) {
    if (!Array.isArray(groups) || !groups.length) {
      return Array.isArray(groups) ? groups : [];
    }

    const normalized = normalizeMenuEntries(menuConfig);
    if (!normalized.length) {
      return groups;
    }

    const byKey = new Map();
    groups.forEach(group => {
      if (group && typeof group.key === 'string') {
        byKey.set(group.key.toLowerCase(), group);
      }
    });

    const remainingOrder = new Set(byKey.keys());
    const ordered = [];

    normalized.forEach(entry => {
      const group = byKey.get(entry.key);
      if (!group) {
        return;
      }

      if (entry.text) {
        group.yearLabel = entry.text;
      }
      if (entry.icon) {
        group.icon = entry.icon;
      }
      if (entry.ariaLabel) {
        group.label = entry.ariaLabel;
      } else if (entry.text) {
        group.label = entry.text;
      }

      ordered.push(group);
      remainingOrder.delete(entry.key);
    });

    if (remainingOrder.size) {
      groups.forEach(group => {
        if (!group || typeof group.key !== 'string') {
          return;
        }
        const key = group.key.toLowerCase();
        if (remainingOrder.has(key)) {
          ordered.push(group);
          remainingOrder.delete(key);
        }
      });
    }

    return ordered;
  }

  function buildCenturyScale(container, bounds) {
    if (!container) {
      return;
    }
    const scale = document.createElement('div');
    scale.className = 'timeline-century__scale';

    const ticks = document.createElement('div');
    ticks.className = 'timeline-century__ticks';
    scale.appendChild(ticks);

    const { startYear, endYear } = bounds;
    for (let year = startYear; year <= endYear; year += 1) {
      const tick = document.createElement('div');
      tick.className = 'timeline-century__tick timeline-century__tick--year';
      if (year % 5 === 0) {
        tick.classList.add('timeline-century__tick--quin');
      }
      if (year % 10 === 0) {
        tick.classList.add('timeline-century__tick--decade');
      }
      if (year % 100 === 0) {
        tick.classList.add('timeline-century__tick--century');
      }
      ticks.appendChild(tick);
    }

    container.appendChild(scale);
    return scale;
  }

  function buildYearGroups(data) {
    if (!data || !Array.isArray(data.centuries)) {
      return [];
    }

    const groups = new Map();

    data.centuries.forEach((century, centuryIndex) => {
      const events = Array.isArray(century?.events) ? century.events : [];
      events.forEach((event, eventIndex) => {
        if (!event || !event.id) {
          return;
        }
        const label = (typeof event.year === 'string' && event.year.trim()) || 'Undated';
        const key = label.toLowerCase();
        if (!groups.has(key)) {
          groups.set(key, {
            label,
            key,
            events: [],
            sortValue: Number.isFinite(event.yearValue) ? event.yearValue : null,
          });
        }
        const group = groups.get(key);
        const yearValue = Number.isFinite(event.yearValue) ? event.yearValue : null;
        if (Number.isFinite(yearValue)) {
          if (!Number.isFinite(group.sortValue) || yearValue < group.sortValue) {
            group.sortValue = yearValue;
          }
        }
        group.events.push({
          event,
          century,
          centuryIndex,
          eventIndex,
        });
      });
    });

    const ordered = Array.from(groups.values());
    ordered.sort((a, b) => {
      const aValue = Number.isFinite(a.sortValue) ? a.sortValue : Number.NEGATIVE_INFINITY;
      const bValue = Number.isFinite(b.sortValue) ? b.sortValue : Number.NEGATIVE_INFINITY;
      if (aValue !== bValue) {
        return bValue - aValue;
      }
      return b.label.localeCompare(a.label, undefined, { numeric: true });
    });

    ordered.forEach((group, index) => {
      group.events.sort((a, b) => {
        const aValue = Number.isFinite(a.event.yearValue) ? a.event.yearValue : Number.NEGATIVE_INFINITY;
        const bValue = Number.isFinite(b.event.yearValue) ? b.event.yearValue : Number.NEGATIVE_INFINITY;
        if (aValue !== bValue) {
          return bValue - aValue;
        }
        return a.eventIndex - b.eventIndex;
      });
      const primaryEventWithIcon = group.events.find(entry => entry.event.icon);
      const primaryEvent = group.events[0]?.event;
      group.icon = primaryEventWithIcon?.event?.icon || '🕰️';
      group.yearLabel = limitWords(primaryEvent?.year || group.label, 2) || `Year ${index + 1}`;
      group.subtitle = getYearSubtitle(group);
    });

    return ordered;
  }

  function hideLoading() {
    if (loadingBanner) {
      loadingBanner.classList.add('is-hidden');
    }
  }

  function buildEvent(event, century, bounds) {
    const position = choosePosition(event);
    const entry = document.createElement('div');
    entry.className = 'timeline-entry';
    entry.dataset.position = position;
    entry.dataset.eventId = event.id;

    const eventYear = getEventYearValue(event, bounds);
    if (Number.isFinite(eventYear)) {
      entry.dataset.yearValue = String(eventYear);
    }
  }

  function clearEntryList() {
    entryList.innerHTML = '';
    entryList.style.minHeight = '';
    entryItems = [];
    activeEntryIndex = 0;
  }

  function updateFocusOffset() {
    const firstButton = yearButtons[0];
    focusColumnOffset = firstButton ? firstButton.offsetLeft : 0;
  }

  function alignYearTrack() {
    const activeButton = yearButtons[activeYearIndex];
    if (!activeButton) {
      yearTrack.style.transform = 'translateX(0)';
      return;
    }

    updateFocusOffset();

    const offset = activeButton.offsetLeft;
    const viewportWidth = yearViewport?.clientWidth || 0;
    const trackWidth = yearTrack.scrollWidth;
    const desired = focusColumnOffset - offset;
    const lastButton = yearButtons[yearButtons.length - 1];
    let minTranslate = Math.min(0, viewportWidth - trackWidth);
    if (lastButton) {
      const lastRight = lastButton.offsetLeft + lastButton.offsetWidth;
      const boundary = viewportWidth - lastRight;
      minTranslate = Math.min(minTranslate, boundary);
      minTranslate = Math.min(minTranslate, focusColumnOffset - lastButton.offsetLeft);
    }
    const maxTranslate = 0;
    const clamped = Math.max(minTranslate, Math.min(maxTranslate, desired));
    yearTrack.style.transform = `translateX(${clamped}px)`;
  }

  function applyEntryPositions() {
    if (!entryItems.length) {
      entryList.style.minHeight = '';
      return;
    }

    refreshLayoutMetrics();

    const baseTop = layoutMetrics.historyHeight * 2 + layoutMetrics.horizontalHeight + layoutMetrics.spacerHeight;
    const step = layoutMetrics.entryHeight + layoutMetrics.entryGap;
    const minFutureItems = 2;

  const rowLayout = {
    fallbackRowHeight: 184,
    padding: 112,
  };

  let layoutFrame = null;

  function updateConnectorLengths(section) {
    if (!section || section.classList.contains('timeline-century--collapsed')) {
      return;
    }
    const entries = section.querySelector('.timeline-century__entries');
    if (!entries || entries.hidden) {
      return;
    }
    const scaleElement = entries.querySelector('.timeline-century__scale');
    const axisRect = scaleElement ? scaleElement.getBoundingClientRect() : null;
    const entryNodes = Array.from(entries.querySelectorAll('.timeline-entry'));
    entryNodes.forEach(entry => {
      const bubble = entry.querySelector('.timeline-bubble');
      if (!bubble) {
        return;
      }
      const bubbleRect = bubble.getBoundingClientRect();
      const targetNode = entry.querySelector('.timeline-year .timeline-node');
      const targetRect = targetNode ? targetNode.getBoundingClientRect() : axisRect;
      if (!targetRect) {
        return;
      }

  function applyRowLayout() {
    const sections = Array.from(timelineContainer.querySelectorAll('.timeline-century'));

    sections.forEach(section => {
      if (section.classList.contains('timeline-century--collapsed')) {
        return;
      }

      const entries = section.querySelector('.timeline-century__entries');
      if (!entries || entries.hidden) {
        return;
      }

      const entryNodes = Array.from(entries.querySelectorAll('.timeline-entry'));
      entryNodes.forEach((entry, index) => {
        entry.style.setProperty('--entry-row-index', index);
      });

      const computed = window.getComputedStyle(entries);
      const baseMinHeight = parseFloat(computed.minHeight) || 0;
      const rowHeightValue = parseFloat(computed.getPropertyValue('--timeline-row-height')) || rowLayout.fallbackRowHeight;
      const requiredHeight = Math.max(baseMinHeight, entryNodes.length * rowHeightValue + rowLayout.padding);
      if (requiredHeight > 0) {
        entries.style.minHeight = `${Math.ceil(requiredHeight)}px`;
      }
    });

    requestAnimationFrame(() => {
      sections.forEach(section => {
        updateConnectorLengths(section);
      });
    });

  function scheduleLayout() {
    if (layoutFrame) {
      cancelAnimationFrame(layoutFrame);
    }
    layoutFrame = requestAnimationFrame(() => {
      layoutFrame = null;
      applyRowLayout();
    });
  }

  function setActiveYear(index, { focusYear = false } = {}) {
    if (!yearGroups.length) {
      return;
    }
    const clamped = Math.max(0, Math.min(yearGroups.length - 1, index));
    if (clamped === activeYearIndex && !focusYear) {
      return;
    }
    activeYearIndex = clamped;
    const group = yearGroups[activeYearIndex];

    yearButtons.forEach((button, buttonIndex) => {
      const isActive = buttonIndex === activeYearIndex;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
      button.tabIndex = isActive ? 0 : -1;
      if (isActive && focusYear && !suppressFocusSync) {
        requestAnimationFrame(() => {
          button.focus({ preventScroll: true });
        });
      }
    });

    alignYearTrack();
    renderEntryList(group);
  }

  function renderYearButtons(groups) {
    yearTrack.innerHTML = '';

    for (let i = 0; i < LEADING_PLACEHOLDER_COUNT; i += 1) {
      const spacer = document.createElement('div');
      spacer.className = 'xmb-year-placeholder';
      spacer.setAttribute('aria-hidden', 'true');
      yearTrack.appendChild(spacer);
    }

    yearButtons = groups.map((group, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'xmb-year';
      button.dataset.yearKey = group.key;
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', 'false');
      const ariaLabel = group.label || group.yearLabel || group.key || `Year ${index + 1}`;
      button.setAttribute('aria-label', ariaLabel);
      button.tabIndex = index === 0 ? 0 : -1;

      const icon = document.createElement('span');
      icon.className = 'xmb-year__icon';
      icon.textContent = group.icon;
      button.appendChild(icon);

      const label = document.createElement('span');
      label.className = 'xmb-year__label';
      const displayLabel = group.yearLabel || group.label || `Year ${index + 1}`;
      label.textContent = limitWords(displayLabel, 3) || `Year ${index + 1}`;
      button.appendChild(label);

      button.addEventListener('click', () => {
        setActiveYear(index, { focusYear: true });
      });

      button.addEventListener('focus', () => {
        if (suppressFocusSync) {
          return;
        }
        setActiveYear(index, { focusYear: false });
      });

      yearTrack.appendChild(button);
      return button;
    });

    updateFocusOffset();
  }

  function handleKeydown(event) {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    const target = event.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
      return;
    }

    switch (event.key) {
      case 'ArrowRight': {
        if (!yearGroups.length) {
          return;
        }
        event.preventDefault();
        const next = Math.min(yearGroups.length - 1, activeYearIndex + 1);
        setActiveYear(next, { focusYear: true });
        break;
      }
      case 'ArrowLeft': {
        if (!yearGroups.length) {
          return;
        }
        event.preventDefault();
        const next = Math.max(0, activeYearIndex - 1);
        setActiveYear(next, { focusYear: true });
        break;
      }
      case 'ArrowDown': {
        if (!entryItems.length) {
          return;
        }
        event.preventDefault();
        if (document.activeElement && yearButtons.includes(document.activeElement)) {
          setActiveEntry(0, { focus: true });
        } else {
          setActiveEntry(activeEntryIndex + 1, { focus: true });
        }
        break;
      }
      case 'ArrowUp': {
        if (!entryItems.length) {
          return;
        }
        event.preventDefault();
        if (document.activeElement && entryItems.includes(document.activeElement)) {
          if (activeEntryIndex === 0) {
            const activeButton = yearButtons[activeYearIndex];
            if (activeButton) {
              suppressFocusSync = true;
              activeButton.focus({ preventScroll: true });
              suppressFocusSync = false;
            }
          } else {
            setActiveEntry(activeEntryIndex - 1, { focus: true });
          }
        } else {
          const activeButton = yearButtons[activeYearIndex];
          if (activeButton) {
            suppressFocusSync = true;
            activeButton.focus({ preventScroll: true });
            suppressFocusSync = false;
          }
        }
        break;
      }
      default:
    }
  }

  function handleResize() {
    updateFocusOffset();
    alignYearTrack();
    applyEntryPositions();
  }

  document.addEventListener('keydown', handleKeydown);
  window.addEventListener('resize', handleResize);

  function fetchJson(url) {
    return fetch(url).then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load ${url}`);
      }
      return response.json();
    });
  }

  Promise.all([
    fetchJson('data/timeline.json'),
    fetchJson('data/menu.json').catch(error => {
      console.warn('Menu configuration could not be loaded:', error);
      return null;
    }),
  ])
    .then(([timelineData, menuConfig]) => {
      const groups = buildYearGroups(timelineData) || [];
      yearGroups = applyMenuConfiguration(groups, menuConfig);
      if (!yearGroups.length) {
        showLoading('No timeline data available.');
        return;
      }
      renderYearButtons(yearGroups);
      hideLoading();
      requestAnimationFrame(() => {
        refreshLayoutMetrics();
        setActiveYear(0, { focusYear: true });
      });
    })
    .catch(error => {
      console.error(error);
      showLoading('We could not load the timeline data. Please refresh the page.');
    });
})();
