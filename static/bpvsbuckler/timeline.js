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
    baseOffset: 0,
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
    const fallbackBase =
      layoutMetrics.historyHeight * 2 + layoutMetrics.horizontalHeight + layoutMetrics.spacerHeight;
    layoutMetrics.baseOffset = readCssNumber('--vertical-base-offset', fallbackBase);
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

  function buildYearGroups(data) {
    if (!Array.isArray(data?.centuries)) {
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

  function showLoading(message) {
    if (loadingBanner) {
      loadingBanner.textContent = message;
      loadingBanner.classList.remove('is-hidden');
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
    const fallback = readCssNumber('--focus-offset-width', 0);
    focusColumnOffset = firstButton ? firstButton.offsetLeft : fallback;
    rootElement.style.setProperty('--computed-focus-offset', `${focusColumnOffset}px`);
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

    const baseTop = layoutMetrics.baseOffset;
    const step = layoutMetrics.entryHeight + layoutMetrics.entryGap;
    const minFutureItems = 2;

    entryItems.forEach((item, index) => {
      item.classList.remove('is-history-slot-1', 'is-history-slot-2', 'is-hidden');

      let offset;

      if (index === activeEntryIndex) {
        offset = baseTop;
      } else if (index === activeEntryIndex + 1) {
        offset = baseTop + step;
      } else if (index > activeEntryIndex + 1) {
        const diff = index - (activeEntryIndex + 1);
        offset = baseTop + step + diff * step;
      } else if (index === activeEntryIndex - 1) {
        offset = layoutMetrics.historyHeight;
        item.classList.add('is-history-slot-1');
      } else if (index === activeEntryIndex - 2) {
        offset = 0;
        item.classList.add('is-history-slot-2');
      } else {
        item.classList.add('is-hidden');
        item.style.removeProperty('--entry-offset');
        return;
      }

      item.style.setProperty('--entry-offset', `${offset}px`);
    });

    const visibleFutureCount = Math.max(minFutureItems, entryItems.length - activeEntryIndex);
    const totalHeight = baseTop + visibleFutureCount * step + layoutMetrics.entryHeight;
    entryList.style.minHeight = `${totalHeight}px`;
  }

  function setActiveEntry(index, { focus = false } = {}) {
    if (!entryItems.length) {
      entryList.style.minHeight = '';
      return;
    }

    const clamped = Math.max(0, Math.min(entryItems.length - 1, index));
    activeEntryIndex = clamped;

    entryItems.forEach((item, itemIndex) => {
      const isActive = itemIndex === activeEntryIndex;
      const isBefore = itemIndex < activeEntryIndex;
      item.classList.toggle('is-active', isActive);
      item.classList.toggle('is-before', isBefore);
      item.tabIndex = isActive ? 0 : -1;
      if (isActive && focus) {
        requestAnimationFrame(() => {
          item.focus({ preventScroll: true });
        });
      }
    });

    applyEntryPositions();
  }

  function renderEntryList(group) {
    clearEntryList();
    if (!group || !group.events.length) {
      return;
    }

    group.events.forEach(({ event }) => {
      const link = document.createElement('a');
      link.className = 'xmb-entry';
      link.href = `entries/${event.id}.html`;
      link.setAttribute('role', 'menuitem');
      link.setAttribute('aria-label', event.title || event.year || 'Timeline entry');
      link.tabIndex = -1;

      const icon = document.createElement('span');
      icon.className = 'xmb-entry__icon';
      icon.textContent = event.icon || '📘';
      link.appendChild(icon);

      const copy = document.createElement('span');
      copy.className = 'xmb-entry__copy';

      const title = document.createElement('span');
      title.className = 'xmb-entry__title';
      title.textContent = limitWords(event.iconLabel || event.title || event.year || 'Entry', 2);
      copy.appendChild(title);

      const subtitleText = getEventSubtitle(event);
      if (subtitleText) {
        const subtitle = document.createElement('span');
        subtitle.className = 'xmb-entry__subtitle';
        subtitle.textContent = subtitleText;
        copy.appendChild(subtitle);
      }

      link.appendChild(copy);

      link.addEventListener('focus', () => {
        const index = entryItems.indexOf(link);
        if (index >= 0 && index !== activeEntryIndex) {
          setActiveEntry(index, { focus: false });
        }
      });

      entryList.appendChild(link);
      entryItems.push(link);
    });

    setActiveEntry(0);
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
      const yearLabel = group.label || `Year ${index + 1}`;
      button.setAttribute('aria-label', yearLabel);
      button.tabIndex = index === 0 ? 0 : -1;

      const icon = document.createElement('span');
      icon.className = 'xmb-year__icon';
      icon.textContent = group.icon;
      button.appendChild(icon);

      const label = document.createElement('span');
      label.className = 'xmb-year__year';
      label.textContent = yearLabel;
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

  fetch('data/timeline.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to load timeline data');
      }
      return response.json();
    })
    .then(data => {
      yearGroups = buildYearGroups(data);
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
