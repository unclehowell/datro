(function () {
  const body = document.body;
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = themeToggle ? themeToggle.querySelector('[data-theme-icon]') : null;
  const caseTitle = document.getElementById('case-title');
  const caseSubtitle = document.getElementById('case-subtitle');
  const caseIntro = document.getElementById('case-intro');
  const keyThemes = document.getElementById('key-themes');
  const yearTrack = document.getElementById('timeline-year-track');
  const yearViewport = document.getElementById('year-bar-viewport');
  const loadingBanner = document.getElementById('timeline-loading');
  const yearTitle = document.getElementById('timeline-year-title');
  const yearMeta = document.getElementById('timeline-year-meta');
  const entryViewport = document.getElementById('timeline-entry-viewport');
  const entryList = document.getElementById('timeline-year-entries');

  const storageKey = 'ghf-theme';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  let yearGroups = [];
  let yearButtons = [];
  let entryLinks = [];
  let activeYearIndex = 0;
  let activeEntryIndex = 0;

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
        // ignore persistence errors
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
    const groups = new Map();

    if (!Array.isArray(data?.centuries)) {
      return [];
    }

    data.centuries.forEach((century, centuryIndex) => {
      const events = Array.isArray(century?.events) ? century.events : [];
      events.forEach((event, eventIndex) => {
        if (!event || !event.id) {
          return;
        }
        const label = (typeof event.year === 'string' && event.year.trim()) || 'Undated';
        const normalized = label.toLowerCase();
        if (!groups.has(normalized)) {
          groups.set(normalized, {
            label,
            normalized,
            sortValue: null,
            events: [],
            centuries: [],
          });
        }
        const group = groups.get(normalized);
        const sortValue = getEventYearValue(event);
        if (Number.isFinite(sortValue)) {
          if (!Number.isFinite(group.sortValue) || sortValue < group.sortValue) {
            group.sortValue = sortValue;
          }
        }
        group.events.push({
          event,
          century,
          centuryIndex,
          eventIndex,
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

    const usedKeys = new Set();
    ordered.forEach((group, index) => {
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
        return a.eventIndex - b.eventIndex;
      });
    });

    return ordered;
  }

  function updateOverview(data) {
    if (data.caseTitle && caseTitle) {
      caseTitle.textContent = data.caseTitle;
    }

    if (caseSubtitle) {
      caseSubtitle.textContent = data.caseSubtitle || '';
      if (data.caseSubtitle) {
        caseSubtitle.classList.remove('hidden');
      } else {
        caseSubtitle.classList.add('hidden');
      }
    }

    if (caseIntro) {
      caseIntro.innerHTML = '';
      const introParagraphs = Array.isArray(data.introduction) ? data.introduction : [];
      if (introParagraphs.length) {
        introParagraphs.forEach(content => {
          const paragraph = document.createElement('p');
          paragraph.innerHTML = content;
          caseIntro.appendChild(paragraph);
        });
        caseIntro.classList.remove('hidden');
      } else {
        caseIntro.classList.add('hidden');
      }
    }

    if (keyThemes) {
      keyThemes.innerHTML = '';
      const themes = Array.isArray(data.keyThemes) ? data.keyThemes : [];
      if (themes.length) {
        themes.forEach(theme => {
          const card = document.createElement('article');
          card.className = 'key-theme-card';

          const heading = document.createElement('h3');
          heading.textContent = theme.title || 'Theme';
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
    }
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
    const descriptors = group.centuries.map(entry => {
      if (entry.title && entry.range) {
        return `${entry.title} (${entry.range})`;
      }
      if (entry.title) {
        return entry.title;
      }
      return entry.range || '';
    }).filter(Boolean);
    yearMeta.textContent = descriptors.join(' • ');
    yearMeta.classList.remove('hidden');
  }

  function alignYearTrack() {
    if (!yearViewport || !yearTrack) {
      return;
    }
    const activeButton = yearButtons[activeYearIndex];
    if (!activeButton) {
      yearTrack.style.transform = 'translateX(0)';
      return;
    }
    const paddingLeft = parseFloat(getComputedStyle(yearViewport).paddingLeft) || 0;
    const offset = activeButton.offsetLeft;
    const translateX = paddingLeft - offset;
    yearTrack.style.transform = `translateX(${translateX}px)`;
  }

  function alignEntryList() {
    if (!entryViewport || !entryList) {
      return;
    }
    const activeEntry = entryLinks[activeEntryIndex];
    if (!activeEntry) {
      entryList.style.transform = 'translateY(0)';
      return;
    }
    const styles = getComputedStyle(entryViewport);
    const paddingTop = parseFloat(styles.paddingTop) || 0;
    const paddingBottom = parseFloat(styles.paddingBottom) || 0;
    const viewportHeight = entryViewport.clientHeight;
    const availableHeight = viewportHeight - paddingTop - paddingBottom;
    const entryHeight = activeEntry.offsetHeight;
    const focusTop = paddingTop + Math.max(0, availableHeight - entryHeight);
    const translateY = focusTop - activeEntry.offsetTop;
    entryList.style.transform = `translateY(${translateY}px)`;
  }

  function updateEntryHighlight(options = {}) {
    if (!entryLinks.length) {
      entryList.style.transform = 'translateY(0)';
      return;
    }

    entryLinks.forEach((link, index) => {
      const isActive = index === activeEntryIndex;
      link.classList.toggle('is-active', isActive);
      link.tabIndex = isActive ? 0 : -1;
      if (isActive && options.focus) {
        requestAnimationFrame(() => {
          link.focus();
        });
      }
    });
    alignEntryList();
  }

  function renderEntries(group) {
    entryList.innerHTML = '';
    entryList.style.transform = 'translateY(0)';
    entryLinks = [];
    if (!group) {
      return;
    }
    group.events.forEach(({ event }) => {
      const card = document.createElement('a');
      card.className = 'entry-card';
      card.href = `entries/${event.id}.html`;
      card.setAttribute('role', 'menuitem');
      card.tabIndex = -1;

      const heading = document.createElement('h3');
      heading.textContent = event.title || 'Timeline entry';
      card.appendChild(heading);

      if (event.summary) {
        const summary = document.createElement('p');
        summary.textContent = event.summary;
        card.appendChild(summary);
      }

      entryList.appendChild(card);
      entryLinks.push(card);
    });

    activeEntryIndex = 0;
    updateEntryHighlight();
  }

  function updateYearButtons() {
    yearButtons.forEach((button, index) => {
      const isActive = index === activeYearIndex;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
      button.tabIndex = isActive ? 0 : -1;
      if (isActive) {
        button.focus();
      }
    });
    alignYearTrack();
  }

  function activateYear(nextIndex, options = {}) {
    if (!yearGroups.length) {
      return;
    }
    const clamped = Math.max(0, Math.min(yearGroups.length - 1, nextIndex));
    const changed = clamped !== activeYearIndex;
    activeYearIndex = clamped;

    if (changed || options.force) {
      updateYearButtons();
    } else if (options.focusYear) {
      const activeButton = yearButtons[activeYearIndex];
      if (activeButton) {
        activeButton.focus();
      }
    }

    const group = yearGroups[activeYearIndex];
    if (yearTitle) {
      yearTitle.textContent = group ? group.label : '';
    }
    updateYearMeta(group);
    renderEntries(group);

    const shouldFocusEntry = Boolean(options.focusEntry);
    updateEntryHighlight({ focus: shouldFocusEntry && entryLinks.length > 0 });
  }

  function changeEntry(delta, { focus = true } = {}) {
    if (!entryLinks.length) {
      return;
    }
    const next = Math.max(0, Math.min(entryLinks.length - 1, activeEntryIndex + delta));
    if (next === activeEntryIndex) {
      return;
    }
    activeEntryIndex = next;
    updateEntryHighlight({ focus });
  }

  function handleKeyboard(event) {
    const target = event.target;
    const tag = target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) {
      return;
    }

    switch (event.key) {
      case 'ArrowRight': {
        if (!yearGroups.length) {
          return;
        }
        event.preventDefault();
        const nextIndex = Math.min(yearGroups.length - 1, activeYearIndex + 1);
        if (nextIndex !== activeYearIndex) {
          activateYear(nextIndex, { focusYear: true });
        }
        break;
      }
      case 'ArrowLeft': {
        if (!yearGroups.length) {
          return;
        }
        event.preventDefault();
        const nextIndex = Math.max(0, activeYearIndex - 1);
        if (nextIndex !== activeYearIndex) {
          activateYear(nextIndex, { focusYear: true });
        }
        break;
      }
      case 'ArrowDown': {
        if (!entryLinks.length) {
          return;
        }
        event.preventDefault();
        if (document.activeElement && yearButtons.includes(document.activeElement)) {
          updateEntryHighlight({ focus: true });
        } else {
          changeEntry(1, { focus: true });
        }
        break;
      }
      case 'ArrowUp': {
        if (!entryLinks.length) {
          return;
        }
        event.preventDefault();
        if (document.activeElement && entryLinks.includes(document.activeElement)) {
          changeEntry(-1, { focus: true });
        } else {
          const activeButton = yearButtons[activeYearIndex];
          if (activeButton) {
            activeButton.focus();
          }
        }
        break;
      }
      default:
    }
  }

  document.addEventListener('keydown', handleKeyboard);

  function hideLoading() {
    if (loadingBanner) {
      loadingBanner.classList.add('hidden');
    }
  }

  function showLoadingMessage(message) {
    if (loadingBanner) {
      loadingBanner.textContent = message;
      loadingBanner.classList.remove('hidden');
    }
  }

  function renderYearBar(groups) {
    yearTrack.innerHTML = '';
    yearButtons = groups.map((group, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'year-item';
      button.textContent = group.label;
      button.dataset.yearKey = group.key;
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', 'false');
      button.tabIndex = index === 0 ? 0 : -1;
      button.addEventListener('click', () => {
        activateYear(index, { focusYear: true });
      });
      yearTrack.appendChild(button);
      return button;
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
      updateOverview(data);
      yearGroups = buildYearGroups(data);
      if (!yearGroups.length) {
        showLoadingMessage('No timeline data available.');
        return;
      }
      renderYearBar(yearGroups);
      hideLoading();
      activateYear(0, { focusYear: true, force: true });
    })
    .catch(error => {
      console.error(error);
      showLoadingMessage('We could not load the timeline data. Please refresh the page.');
    });
})();
