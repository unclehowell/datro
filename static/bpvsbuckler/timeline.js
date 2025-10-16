(function () {
  const yearTrack = document.getElementById('timeline-year-track');
  const yearViewport = document.getElementById('year-bar-viewport');
  const entryViewport = document.getElementById('timeline-entry-viewport');
  const entryList = document.getElementById('timeline-year-entries');
  const loadingBanner = document.getElementById('timeline-loading');

  if (!yearTrack || !entryViewport || !entryList) {
    return;
  }

  let yearGroups = [];
  let yearButtons = [];
  let entryItems = [];
  let activeYearIndex = 0;
  let activeEntryIndex = 0;
  let suppressFocusSync = false;

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
      group.icon = primaryEventWithIcon?.event?.icon || '🕰️';
      group.title = limitWords(group.label, 2) || `Year ${index + 1}`;
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
    entryList.style.transform = 'translateY(0)';
    entryItems = [];
  }

  function alignYearTrack() {
    const activeButton = yearButtons[activeYearIndex];
    if (!activeButton) {
      yearTrack.style.transform = 'translateX(0)';
      return;
    }

    const offset = activeButton.offsetLeft;
    const viewportWidth = yearViewport?.clientWidth || 0;
    const trackWidth = yearTrack.scrollWidth;
    const maxTranslate = 0;
    const minTranslate = Math.min(0, viewportWidth - trackWidth);
    const desired = -offset;
    const clamped = Math.max(minTranslate, Math.min(maxTranslate, desired));
    yearTrack.style.transform = `translateX(${clamped}px)`;
  }

  function alignEntryList() {
    const activeEntry = entryItems[activeEntryIndex];
    if (!activeEntry) {
      entryList.style.transform = 'translateY(0)';
      return;
    }
    const offset = activeEntry.offsetTop;
    const viewportHeight = entryViewport?.clientHeight || 0;
    const listHeight = entryList.scrollHeight;
    const activeHeight = activeEntry.offsetHeight;
    const focusOffset = Math.max(0, viewportHeight - activeHeight);
    const desired = focusOffset - offset;
    const minTranslate = Math.min(0, viewportHeight - listHeight);
    const maxTranslate = Math.max(0, focusOffset);
    const clamped = Math.max(minTranslate, Math.min(maxTranslate, desired));
    entryList.style.transform = `translateY(${clamped}px)`;
  }

  function setActiveEntry(index, { focus = false } = {}) {
    if (!entryItems.length) {
      entryList.style.transform = 'translateY(0)';
      return;
    }
    const clamped = Math.max(0, Math.min(entryItems.length - 1, index));
    activeEntryIndex = clamped;
    entryItems.forEach((item, itemIndex) => {
      const isActive = itemIndex === activeEntryIndex;
      item.classList.toggle('is-active', isActive);
      item.tabIndex = isActive ? 0 : -1;
      if (isActive && focus) {
        requestAnimationFrame(() => {
          item.focus({ preventScroll: true });
        });
      }
    });
    alignEntryList();
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
        if (index >= 0) {
          activeEntryIndex = index;
          alignEntryList();
          entryItems.forEach((item, idx) => {
            item.classList.toggle('is-active', idx === index);
            item.tabIndex = idx === index ? 0 : -1;
          });
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
    yearButtons = groups.map((group, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'xmb-year';
      button.dataset.yearKey = group.key;
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', 'false');
      button.setAttribute('aria-label', group.label);
      button.tabIndex = index === 0 ? 0 : -1;

      const icon = document.createElement('span');
      icon.className = 'xmb-year__icon';
      icon.textContent = group.icon;
      button.appendChild(icon);

      const copy = document.createElement('span');
      copy.className = 'xmb-year__copy';

      const title = document.createElement('span');
      title.className = 'xmb-year__title';
      title.textContent = limitWords(group.label, 2) || `Year ${index + 1}`;
      copy.appendChild(title);

      const subtitleText = group.subtitle;
      if (subtitleText) {
        const subtitle = document.createElement('span');
        subtitle.className = 'xmb-year__subtitle';
        subtitle.textContent = subtitleText;
        copy.appendChild(subtitle);
      }

      button.appendChild(copy);

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
    alignYearTrack();
    alignEntryList();
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
        setActiveYear(0, { focusYear: true });
      });
    })
    .catch(error => {
      console.error(error);
      showLoading('We could not load the timeline data. Please refresh the page.');
    });
})();
