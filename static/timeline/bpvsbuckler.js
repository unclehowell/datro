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

  function limitCharacters(value, maxChars) {
    if (!value) {
      return '';
    }
    const trimmed = String(value).trim();
    if (!Number.isFinite(maxChars) || maxChars <= 0 || trimmed.length <= maxChars) {
      return trimmed;
    }

    const shortened = trimmed.slice(0, maxChars);
    const withoutDangling = shortened.replace(/\s+\S*$/, '');
    if (withoutDangling.length >= Math.max(3, Math.floor(maxChars * 0.6))) {
      return withoutDangling;
    }
    return shortened.slice(0, Math.max(1, maxChars - 1));
  }

  function getYearSubtitle(group) {
    if (!group || !group.events.length) {
      return '';
    }
    const primaryEvent = group.events[0].event;
    const subtitleSource = primaryEvent.iconLabel || primaryEvent.title || primaryEvent.year || '';
    return limitWords(subtitleSource, 6);
  }

  function getEventSubtitle(event, maxChars) {
    if (!event) {
      return '';
    }
    if (event.summary) {
      return limitCharacters(limitWords(event.summary, 8), maxChars);
    }
    if (event.title) {
      return limitCharacters(limitWords(event.title, 8), maxChars);
    }
    return limitCharacters(limitWords(event.year, 8), maxChars);
  }

  function formatOrdinal(value) {
    const absValue = Math.abs(value);
    const mod100 = absValue % 100;
    if (mod100 >= 11 && mod100 <= 13) {
      return `${value}th`;
    }
    switch (absValue % 10) {
      case 1:
        return `${value}st`;
      case 2:
        return `${value}nd`;
      case 3:
        return `${value}rd`;
      default:
        return `${value}th`;
    }
  }

  function formatYearLabel(event, fallbackLabel) {
    const fallback = (fallbackLabel || event?.year || '').trim() || 'Undated';
    if (!event) {
      return fallback;
    }

    const raw = (event.year || '').trim();
    if (/^\d{4}$/.test(raw)) {
      return raw;
    }

    const centuryMatch = raw.match(/(\d+)(?:st|nd|rd|th)?\s*century/i);
    if (centuryMatch) {
      const centuryNumber = parseInt(centuryMatch[1], 10);
      if (Number.isFinite(centuryNumber)) {
        return `${formatOrdinal(centuryNumber)} century`;
      }
    }

    const value = Number.isFinite(event.yearValue) ? event.yearValue : Number.NaN;

    if (raw.toLowerCase().includes('century') && Number.isFinite(value)) {
      const inferredCentury = Math.ceil(value / 100);
      if (inferredCentury >= 1) {
        return `${formatOrdinal(inferredCentury)} century`;
      }
    }

    if (Number.isFinite(value)) {
      const decade = Math.floor(value / 10) * 10;
      const padded = decade.toString().padStart(4, '0');
      return `${padded}'s`;
    }

    const explicitYear = raw.match(/(\d{4})/);
    if (explicitYear) {
      return explicitYear[1];
    }

    const decadeMatch = raw.match(/(\d{3})/);
    if (decadeMatch) {
      return `${decadeMatch[1]}0's`;
    }

    return fallback;
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
      const aValue = Number.isFinite(a.sortValue) ? a.sortValue : Number.NEGATIVE_INFINITY;
      const bValue = Number.isFinite(b.sortValue) ? b.sortValue : Number.NEGATIVE_INFINITY;
      if (aValue !== bValue) {
        return bValue - aValue;
      }
      return b.label.localeCompare(a.label, undefined, { numeric: true });
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
      const representativeEvent = group.events.find(entry => Number.isFinite(entry.event.yearValue))?.event
        || group.events[0]?.event;
      group.icon = primaryEventWithIcon?.event?.icon || '🕰️';
      group.yearLabel = formatYearLabel(representativeEvent, group.label) || `Year ${index + 1}`;
      group.subtitle = '';
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
      const titleText = limitWords(event.iconLabel || event.title || event.year || 'Entry', 2);
      title.textContent = titleText;
      copy.appendChild(title);

      const normalizedTitleLength = titleText.replace(/\s+/g, '').length;
      const maxSubtitleChars = Math.max(12, Math.round(normalizedTitleLength * 1.8));
      const subtitleText = getEventSubtitle(event, maxSubtitleChars);
      if (subtitleText) {
        const subtitle = document.createElement('span');
        subtitle.className = 'xmb-entry__subtitle';
        subtitle.textContent = subtitleText;
        subtitle.title = subtitleText;
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
    requestAnimationFrame(updateEntrySubtitleWidths);
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

  function updateEntrySubtitleWidths() {
    if (!entryCards.length) {
      return;
    }
    entryCards.forEach(card => {
      const title = card.querySelector('.xmb-entry__title');
      const subtitle = card.querySelector('.xmb-entry__subtitle');
      if (!title || !subtitle) {
        return;
      }
      subtitle.style.maxWidth = '';
      const rect = title.getBoundingClientRect();
      const width = rect?.width;
      if (Number.isFinite(width) && width > 0) {
        subtitle.style.maxWidth = `${Math.ceil(width)}px`;
      }
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

// Touch handling for year navigation
let yearTouchStartY = null;
let yearTouchStartTime = null;

yearViewport.addEventListener('touchstart', (event) => {
  yearTouchStartY = event.touches[0].clientY;
  yearTouchStartTime = Date.now();
}, { passive: true });

yearViewport.addEventListener('touchmove', (event) => {
  if (yearTouchStartY === null) return;
  
  const touchY = event.touches[0].clientY;
  const deltaY = touchY - yearTouchStartY;
  const threshold = 50; // minimum swipe distance
  
  if (Math.abs(deltaY) > threshold) {
    const timeDiff = Date.now() - yearTouchStartTime;
    if (timeDiff < 300) { // quick swipe
      if (deltaY > 0) {
        // Swipe down = previous year
        setActiveYear(Math.max(0, activeYearIndex - 1), { focusYear: false });
      } else {
        // Swipe up = next year
        setActiveYear(Math.min(yearGroups.length - 1, activeYearIndex + 1), { focusYear: false });
      }
      yearTouchStartY = null;
    }
  }
}, { passive: true });

yearViewport.addEventListener('touchend', () => {
  yearTouchStartY = null;
  yearTouchStartTime = null;
}, { passive: true });

// Touch handling for entry navigation
let entryTouchStartX = null;
let entryTouchStartTime = null;

entryViewport.addEventListener('touchstart', (event) => {
  entryTouchStartX = event.touches[0].clientX;
  entryTouchStartTime = Date.now();
}, { passive: true });

entryViewport.addEventListener('touchmove', (event) => {
  if (entryTouchStartX === null) return;
  
  const touchX = event.touches[0].clientX;
  const deltaX = touchX - entryTouchStartX;
  const threshold = 50; // minimum swipe distance
  
  if (Math.abs(deltaX) > threshold) {
    const timeDiff = Date.now() - entryTouchStartTime;
    if (timeDiff < 300) { // quick swipe
      if (deltaX > 0) {
        // Swipe right = previous entry
        setActiveEntry(Math.max(0, activeEntryIndex - 1), { focus: false });
      } else {
        // Swipe left = next entry
        setActiveEntry(Math.min(entryCards.length - 1, activeEntryIndex + 1), { focus: false });
      }
      entryTouchStartX = null;
    }
  }
}, { passive: true });

entryViewport.addEventListener('touchend', () => {
  entryTouchStartX = null;
  entryTouchStartTime = null;
}, { passive: true });

  function handleResize() {
    requestAnimationFrame(() => {
      alignYearList();
      alignEntryTrack();
      updateEntrySubtitleWidths();
    });
  }

  document.addEventListener('keydown', handleKeydown);
  window.addEventListener('resize', handleResize);

  const backgroundVideo = document.getElementById('background-video');
  if (backgroundVideo) {
    window.addEventListener('load', () => {
      const playPromise = backgroundVideo.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          backgroundVideo.style.opacity = '1';
        }).catch(error => {
          console.warn('Video autoplay was prevented:', error);
          const enablePlayback = () => {
            backgroundVideo.play().then(() => {
              backgroundVideo.style.opacity = '1';
            }).catch(err => console.warn('Video playback failed:', err));
          };
          document.addEventListener('click', enablePlayback, { once: true });
          document.addEventListener('touchstart', enablePlayback, { once: true });
          document.addEventListener('keydown', enablePlayback, { once: true });
        });
      }
    });
  }

  showLoading('Loading timeline…');

  fetch('data/bpvsbuckler.json')
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
