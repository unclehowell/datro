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

  function showLoading(message) {
    if (!loadingBanner) {
      return;
    }
    loadingBanner.textContent = message;
    loadingBanner.classList.remove('is-hidden');
  }

  function hideLoading() {
    if (!loadingBanner) {
      return;
    }
    loadingBanner.classList.add('is-hidden');
  }

  function limitWords(value, maxWords) {
    if (!value) {
      return '';
    }
    const words = String(value).trim().split(/\s+/);
    return words.slice(0, Math.max(1, maxWords)).join(' ');
  }

  function normaliseSide(side) {
    if (!side) {
      return 'both';
    }
    const normalised = String(side).toLowerCase();
    if (normalised === 'buckler' || normalised === 'bp' || normalised === 'both') {
      return normalised;
    }
    return 'both';
  }

  function describeSide(side) {
    switch (normaliseSide(side)) {
      case 'buckler':
        return 'Buckler family';
      case 'bp':
        return 'BP';
      default:
        return 'Shared history';
    }
  }

  function ensureButtonVisible(button) {
    if (!button || !yearViewport) {
      return;
    }
    const buttonRect = button.getBoundingClientRect();
    const viewportRect = yearViewport.getBoundingClientRect();
    if (buttonRect.left < viewportRect.left) {
      yearViewport.scrollBy({
        left: buttonRect.left - viewportRect.left - 16,
        behavior: 'smooth',
      });
    } else if (buttonRect.right > viewportRect.right) {
      yearViewport.scrollBy({
        left: buttonRect.right - viewportRect.right + 16,
        behavior: 'smooth',
      });
    }
  }

  function ensureEntryVisible(entry) {
    if (!entry || !entryViewport) {
      return;
    }
    const entryRect = entry.getBoundingClientRect();
    const viewportRect = entryViewport.getBoundingClientRect();
    if (entryRect.top < viewportRect.top) {
      entryViewport.scrollBy({
        top: entryRect.top - viewportRect.top - 24,
        behavior: 'smooth',
      });
    } else if (entryRect.bottom > viewportRect.bottom) {
      entryViewport.scrollBy({
        top: entryRect.bottom - viewportRect.bottom + 24,
        behavior: 'smooth',
      });
    }
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

    ordered.forEach(group => {
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
      group.yearLabel = limitWords(primaryEvent?.year || group.label, 3) || group.label;
      group.subtitle = limitWords(primaryEvent?.summary || primaryEvent?.title || group.label, 6);
    });

    return ordered;
  }

  function clearEntries() {
    entryList.innerHTML = '';
    entryItems = [];
    activeEntryIndex = 0;
  }

  function setActiveEntry(index, { focus = false } = {}) {
    if (!entryItems.length) {
      activeEntryIndex = 0;
      return;
    }

    const clamped = Math.max(0, Math.min(entryItems.length - 1, index));
    activeEntryIndex = clamped;

    entryItems.forEach((item, itemIndex) => {
      const isActive = itemIndex === clamped;
      item.classList.toggle('is-active', isActive);
      if (isActive && focus) {
        item.focus({ preventScroll: false });
      }
    });

    ensureEntryVisible(entryItems[clamped]);
  }

  function renderEntryList(group) {
    clearEntries();

    if (!group || !group.events.length) {
      const empty = document.createElement('p');
      empty.textContent = 'No timeline entries available for this year yet.';
      empty.className = 'timeline-empty';
      entryList.appendChild(empty);
      return;
    }

    const header = document.createElement('div');
    header.className = 'timeline-year-header';

    const icon = document.createElement('div');
    icon.className = 'timeline-year-header__icon';
    icon.textContent = group.icon || '🕰️';
    header.appendChild(icon);

    const yearLabel = document.createElement('div');
    yearLabel.className = 'timeline-year-header__year';
    yearLabel.textContent = group.yearLabel;
    header.appendChild(yearLabel);

    if (group.subtitle) {
      const subtitle = document.createElement('div');
      subtitle.className = 'timeline-year-header__subtitle';
      subtitle.textContent = group.subtitle;
      header.appendChild(subtitle);
    }

    entryList.appendChild(header);

    const row = document.createElement('div');
    row.className = 'timeline-card-row';
    entryList.appendChild(row);

    entryItems = group.events.map((entry, index) => {
      const { event } = entry;
      const side = normaliseSide(event.side);

      const card = document.createElement('article');
      card.className = `timeline-card timeline-card--${side}`;
      card.dataset.eventId = event.id;
      card.tabIndex = 0;

      const sideLabel = document.createElement('span');
      sideLabel.className = 'timeline-card__side';
      sideLabel.textContent = describeSide(side);
      card.appendChild(sideLabel);

      const title = document.createElement('h3');
      title.className = 'timeline-card__title';
      title.textContent = event.title || group.label;
      card.appendChild(title);

      if (event.summary) {
        const summary = document.createElement('p');
        summary.className = 'timeline-card__summary';
        summary.textContent = event.summary;
        card.appendChild(summary);
      }

      const link = document.createElement('a');
      link.className = 'timeline-card__link';
      link.href = `entries/${event.id}.html`;
      link.textContent = 'View details';
      link.setAttribute('aria-label', `${event.title || group.label} details`);
      card.appendChild(link);

      card.addEventListener('focus', () => {
        setActiveEntry(index, { focus: false });
      });

      row.appendChild(card);
      return card;
    });

    setActiveEntry(0, { focus: false });
  }

  function setActiveYear(index, { focusYear = false } = {}) {
    if (!yearGroups.length) {
      return;
    }

    const clamped = Math.max(0, Math.min(yearGroups.length - 1, index));
    activeYearIndex = clamped;
    const group = yearGroups[clamped];

    yearButtons.forEach((button, buttonIndex) => {
      const isActive = buttonIndex === clamped;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
      button.tabIndex = isActive ? 0 : -1;
      if (isActive && focusYear) {
        button.focus({ preventScroll: true });
      }
    });

    ensureButtonVisible(yearButtons[clamped]);
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
      icon.textContent = group.icon || '🕰️';
      button.appendChild(icon);

      const label = document.createElement('span');
      label.className = 'xmb-year__label';
      label.textContent = limitWords(group.yearLabel || group.label, 3);
      button.appendChild(label);

      button.addEventListener('click', () => {
        setActiveYear(index, { focusYear: false });
      });

      button.addEventListener('focus', () => {
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

    switch (event.key) {
      case 'ArrowRight': {
        if (!yearGroups.length) {
          return;
        }
        event.preventDefault();
        setActiveYear(Math.min(yearGroups.length - 1, activeYearIndex + 1), { focusYear: true });
        break;
      }
      case 'ArrowLeft': {
        if (!yearGroups.length) {
          return;
        }
        event.preventDefault();
        setActiveYear(Math.max(0, activeYearIndex - 1), { focusYear: true });
        break;
      }
      case 'ArrowDown': {
        if (!entryItems.length) {
          return;
        }
        event.preventDefault();
        setActiveEntry(Math.min(entryItems.length - 1, activeEntryIndex + 1), { focus: true });
        break;
      }
      case 'ArrowUp': {
        if (!entryItems.length) {
          return;
        }
        event.preventDefault();
        setActiveEntry(Math.max(0, activeEntryIndex - 1), { focus: true });
        break;
      }
      case 'Home': {
        if (!yearGroups.length) {
          return;
        }
        event.preventDefault();
        setActiveYear(0, { focusYear: true });
        break;
      }
      case 'End': {
        if (!yearGroups.length) {
          return;
        }
        event.preventDefault();
        setActiveYear(yearGroups.length - 1, { focusYear: true });
        break;
      }
      default:
    }
  }

  document.addEventListener('keydown', handleKeydown);

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
        setActiveYear(0, { focusYear: false });
      });
    })
    .catch(error => {
      console.error(error);
      showLoading('We could not load the timeline data. Please refresh the page.');
    });
})();
