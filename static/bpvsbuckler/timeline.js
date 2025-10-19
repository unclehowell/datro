(function () {
  const yearList = document.getElementById('timeline-year-list');
  const yearViewport = document.getElementById('year-list-viewport');
  const entryViewport = document.getElementById('entry-bar-viewport');
  const entryTrack = document.getElementById('timeline-entry-track');
  const loadingBanner = document.getElementById('timeline-loading');

  if (!yearList || !yearViewport || !entryViewport || !entryTrack) {
    return;
  }

  let yearGroups = [];
  let yearButtons = [];
  let entryCards = [];
  let activeYearIndex = -1;
  let activeEntryIndex = -1;
  let suppressFocusSync = false;

  function showLoading(message) {
    if (!loadingBanner) {
      return;
    }
    if (typeof message === 'string' && message.trim()) {
      loadingBanner.textContent = message.trim();
    }
    loadingBanner.classList.remove('is-hidden');
  }

  function hideLoading() {
    if (loadingBanner) {
      loadingBanner.classList.add('is-hidden');
    }
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
    return limitWords(subtitleSource, 6);
  }

  function getEventSubtitle(event) {
    if (!event) {
      return '';
    }
    if (event.summary) {
      return limitWords(event.summary, 8);
    }
    if (event.title) {
      return limitWords(event.title, 8);
    }
    return limitWords(event.year, 8);
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
            sortValue: Number.isFinite(event.yearValue) ? event.yearValue : Number.POSITIVE_INFINITY,
          });
        }
        const group = groups.get(key);
        const yearValue = Number.isFinite(event.yearValue) ? event.yearValue : Number.POSITIVE_INFINITY;
        if (!Number.isFinite(group.sortValue) || yearValue < group.sortValue) {
          group.sortValue = yearValue;
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
      const aValue = Number.isFinite(a.sortValue) ? a.sortValue : Number.POSITIVE_INFINITY;
      const bValue = Number.isFinite(b.sortValue) ? b.sortValue : Number.POSITIVE_INFINITY;
      if (aValue !== bValue) {
        return aValue - bValue;
      }
      return a.label.localeCompare(b.label, undefined, { numeric: true });
    });

    ordered.forEach((group, index) => {
      group.events.sort((a, b) => {
        const aValue = Number.isFinite(a.event.yearValue) ? a.event.yearValue : Number.POSITIVE_INFINITY;
        const bValue = Number.isFinite(b.event.yearValue) ? b.event.yearValue : Number.POSITIVE_INFINITY;
        if (aValue !== bValue) {
          return aValue - bValue;
        }
        return a.eventIndex - b.eventIndex;
      });
      const primaryEventWithIcon = group.events.find(entry => entry.event.icon);
      const primaryEvent = group.events[0]?.event;
      group.icon = primaryEventWithIcon?.event?.icon || '🕰️';
      group.yearLabel = limitWords(primaryEvent?.year || group.label, 3) || `Year ${index + 1}`;
      group.subtitle = getYearSubtitle(group);
    });

    return ordered;
  }

  function alignYearList() {
    const activeButton = yearButtons[activeYearIndex];
    if (!activeButton) {
      yearList.style.transform = 'translateY(0)';
      return;
    }

    const viewportHeight = yearViewport?.clientHeight || 0;
    const listHeight = yearList.scrollHeight;
    const buttonCenter = activeButton.offsetTop + activeButton.offsetHeight / 2;
    let translate = viewportHeight / 2 - buttonCenter;
    const minTranslate = Math.min(0, viewportHeight - listHeight);
    const maxTranslate = 0;
    if (!Number.isFinite(translate)) {
      translate = 0;
    }
    translate = Math.max(minTranslate, Math.min(maxTranslate, translate));
    yearList.style.transform = `translateY(${translate}px)`;
  }

  function readAnchorRatio() {
    try {
      const styles = window.getComputedStyle(document.documentElement);
      const rawValue = styles.getPropertyValue('--timeline-anchor');
      if (!rawValue) {
        return 0.5;
      }
      const numeric = parseFloat(rawValue);
      if (!Number.isFinite(numeric)) {
        return 0.5;
      }
      if (rawValue.includes('%') || numeric > 1) {
        return Math.min(0.8, Math.max(0.2, numeric / 100));
      }
      return Math.min(0.8, Math.max(0.2, numeric));
    } catch (error) {
      console.warn('Failed to read timeline anchor ratio', error);
      return 0.5;
    }
  }

  function alignEntryTrack() {
    const activeCard = entryCards[activeEntryIndex];
    if (!activeCard) {
      entryTrack.style.transform = 'translateX(0)';
      return;
    }

    const viewportWidth = entryViewport?.clientWidth || 0;
    const trackWidth = entryTrack.scrollWidth;
    const cardCenter = activeCard.offsetLeft + activeCard.offsetWidth / 2;
    const anchorRatio = readAnchorRatio();
    const anchor = viewportWidth * anchorRatio;
    const firstCard = entryCards[0];
    const lastCard = entryCards[entryCards.length - 1];
    const firstCenter = firstCard ? firstCard.offsetLeft + firstCard.offsetWidth / 2 : cardCenter;
    const lastCenter = lastCard ? lastCard.offsetLeft + lastCard.offsetWidth / 2 : cardCenter;
    let translate = anchor - cardCenter;
    const maxCandidate = Number.isFinite(anchor - firstCenter) ? anchor - firstCenter : 0;
    const limitedMax = firstCard ? Math.min(maxCandidate, firstCard.offsetLeft) : maxCandidate;
    const maxTranslate = Math.max(limitedMax, 0);
    const minCandidate = Number.isFinite(anchor - lastCenter) ? anchor - lastCenter : viewportWidth - trackWidth;
    const minTranslate = Math.max(Math.min(minCandidate, 0), viewportWidth - trackWidth);
    if (!Number.isFinite(translate)) {
      translate = 0;
    }
    translate = Math.max(minTranslate, Math.min(maxTranslate, translate));
    entryTrack.style.transform = `translateX(${translate}px)`;
  }

  window.addEventListener('resize', () => {
    requestAnimationFrame(alignEntryTrack);
  });

  function clearEntries() {
    entryTrack.innerHTML = '';
    entryTrack.style.transform = 'translateX(0)';
    entryCards = [];
    activeEntryIndex = -1;
  }

  function setActiveEntry(index, { focus = false } = {}) {
    if (!entryCards.length) {
      return;
    }
    const clamped = Math.max(0, Math.min(entryCards.length - 1, index));
    activeEntryIndex = clamped;

    entryCards.forEach((card, cardIndex) => {
      const isActive = cardIndex === activeEntryIndex;
      card.classList.toggle('is-active', isActive);
      card.tabIndex = isActive ? 0 : -1;
      card.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    const activeCard = entryCards[activeEntryIndex];
    if (focus && activeCard) {
      requestAnimationFrame(() => {
        activeCard.focus({ preventScroll: true });
      });
    }

    requestAnimationFrame(alignEntryTrack);
  }

  function renderEntryTrack(group) {
    clearEntries();
    if (!group || !group.events.length) {
      return;
    }

    const fragment = document.createDocumentFragment();

    group.events.forEach(({ event }, index) => {
      const link = document.createElement('a');
      link.className = 'xmb-entry';
      link.href = `entries/${event.id}.html`;
      link.setAttribute('role', 'option');
      link.setAttribute('aria-label', event.title || event.year || 'Timeline entry');
      link.setAttribute('aria-selected', 'false');
      link.tabIndex = -1;

      if (event.side) {
        link.dataset.side = event.side;
      }

      const icon = document.createElement('span');
      icon.className = 'xmb-entry__icon';
      icon.textContent = event.icon || '📘';
      link.appendChild(icon);

      const copy = document.createElement('span');
      copy.className = 'xmb-entry__copy';

      const title = document.createElement('span');
      title.className = 'xmb-entry__title';
      title.textContent = limitWords(event.iconLabel || event.title || event.year || 'Entry', 6);
      copy.appendChild(title);

      const subtitleText = getEventSubtitle(event);
      if (subtitleText) {
        const subtitle = document.createElement('span');
        subtitle.className = 'xmb-entry__subtitle';
        subtitle.textContent = subtitleText;
        copy.appendChild(subtitle);
      }

      link.appendChild(copy);

      link.addEventListener('mouseenter', () => {
        setActiveEntry(index, { focus: false });
      });

      link.addEventListener('focus', () => {
        if (suppressFocusSync) {
          return;
        }
        setActiveEntry(index, { focus: false });
      });

      fragment.appendChild(link);
    });

    entryTrack.appendChild(fragment);
    entryCards = Array.from(entryTrack.querySelectorAll('.xmb-entry'));
    setActiveEntry(0, { focus: false });
  }

  function renderYearButtons(groups) {
    yearList.innerHTML = '';
    const fragment = document.createDocumentFragment();

    groups.forEach((group, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'xmb-year';
      button.dataset.yearKey = group.key;
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', 'false');
      button.setAttribute('aria-label', group.label);
      button.tabIndex = -1;

      const icon = document.createElement('span');
      icon.className = 'xmb-year__icon';
      icon.textContent = group.icon;
      button.appendChild(icon);

      const copy = document.createElement('span');
      copy.className = 'xmb-year__copy';

      const title = document.createElement('span');
      title.className = 'xmb-year__title';
      title.textContent = group.yearLabel;
      copy.appendChild(title);

      if (group.subtitle) {
        const subtitle = document.createElement('span');
        subtitle.className = 'xmb-year__subtitle';
        subtitle.textContent = group.subtitle;
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

      fragment.appendChild(button);
    });

    yearList.appendChild(fragment);
    yearButtons = Array.from(yearList.querySelectorAll('.xmb-year'));
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

    renderEntryTrack(group);
    alignYearList();
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
      case 'ArrowDown': {
        if (!yearGroups.length) {
          return;
        }
        event.preventDefault();
        const next = Math.min(yearGroups.length - 1, activeYearIndex + 1);
        setActiveYear(next, { focusYear: true });
        break;
      }
      case 'ArrowUp': {
        if (!yearGroups.length) {
          return;
        }
        event.preventDefault();
        const next = Math.max(0, activeYearIndex - 1);
        setActiveYear(next, { focusYear: true });
        break;
      }
      case 'ArrowRight': {
        if (!entryCards.length) {
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
      case 'ArrowLeft': {
        if (!entryCards.length) {
          return;
        }
        event.preventDefault();
        if (document.activeElement && entryCards.includes(document.activeElement)) {
          if (activeEntryIndex <= 0) {
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
    requestAnimationFrame(() => {
      alignYearList();
      alignEntryTrack();
    });
  }

  document.addEventListener('keydown', handleKeydown);
  window.addEventListener('resize', handleResize);

  showLoading('Loading timeline…');

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
