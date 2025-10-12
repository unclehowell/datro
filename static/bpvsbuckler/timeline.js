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
  const centurySelector = document.getElementById('century-selector');
  const centurySelect = document.getElementById('century-select');
  const timelineContainer = document.getElementById('timeline');
  const loadingMessage = document.getElementById('timeline-loading');
  const modal = document.getElementById('modal');
  const closeBtn = modal ? modal.querySelector('.close-btn') : null;
  const modalTitle = document.getElementById('modal-title');
  const modalSource = document.getElementById('modal-source');
  const modalDescription = document.getElementById('modal-description');
  const modalBody = document.getElementById('modal-body');

  const eventIndex = new Map();
  const storageKey = 'ghf-theme';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  let sharedSidePreference = 'right';
  let centuriesData = [];

  function createPhotoAlbumEvent(year) {
    const numericYear = Number(year);
    if (!Number.isFinite(numericYear)) {
      return null;
    }
    const roundedYear = Math.round(numericYear);
    const id = `photos-${roundedYear}`;
    return {
      id,
      year: String(roundedYear).padStart(4, '0'),
      yearValue: roundedYear,
      side: 'both',
      title: `${roundedYear} Photos`,
      summary: `Open the ${roundedYear} photo album to view and organise images from this year.`,
      icon: '📸',
      iconLabel: 'Photo album',
      type: 'photo-album',
      albumYear: roundedYear,
    };
  }

  function ensurePhotoAlbumsForCentury(century, bounds) {
    const baseEvents = Array.isArray(century?.events) ? [...century.events] : [];
    const existingIds = new Set(baseEvents.map(event => event.id));
    const years = new Set();

    baseEvents.forEach(event => {
      const eventYear = getEventYearValue(event, bounds);
      if (Number.isFinite(eventYear)) {
        years.add(Math.round(eventYear));
      } else if (typeof event.year === 'string') {
        const match = event.year.match(/(1[5-9]\d{2}|20\d{2})/);
        if (match) {
          years.add(Number(match[0]));
        }
      }
    });

    years.forEach(year => {
      const id = `photos-${year}`;
      if (existingIds.has(id)) {
        return;
      }
      const albumEvent = createPhotoAlbumEvent(year);
      if (albumEvent) {
        baseEvents.push(albumEvent);
        existingIds.add(id);
      }
    });

    return baseEvents;
  }

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
        console.warn('Unable to persist theme preference', error);
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

  function choosePosition(event) {
    if (event.side === 'buckler') {
      return 'left';
    }
    if (event.side === 'bp') {
      return 'right';
    }
    sharedSidePreference = sharedSidePreference === 'left' ? 'right' : 'left';
    return sharedSidePreference;
  }

  function normalizeCenturyBounds(century) {
    const start = Number(century?.startYear);
    const end = Number(century?.endYear);
    if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
      return { startYear: start, endYear: end, span: Math.max(1, end - start) };
    }
    if (Number.isFinite(start)) {
      const inferredEnd = start + 99;
      return { startYear: start, endYear: inferredEnd, span: Math.max(1, inferredEnd - start) };
    }
    if (Number.isFinite(end)) {
      const inferredStart = end - 99;
      return { startYear: inferredStart, endYear: end, span: Math.max(1, end - inferredStart) };
    }
    return { startYear: 0, endYear: 99, span: 99 };
  }

  function getEventYearValue(event, bounds) {
    if (!event) {
      return bounds.endYear;
    }
    const direct = Number(event.yearValue);
    if (Number.isFinite(direct)) {
      return direct;
    }
    const match = typeof event.year === 'string' ? event.year.match(/(1[6-9]\d{2}|20\d{2})/) : null;
    if (match) {
      return Number(match[0]);
    }
    return bounds.endYear;
  }

  function positionForYear(year, bounds) {
    const { startYear, endYear, span } = bounds;
    if (!Number.isFinite(year)) {
      return 0;
    }
    const clamped = Math.min(Math.max(year, startYear), endYear);
    const offset = clamped - startYear;
    const raw = (offset / span) * 100;
    return Math.min(98, Math.max(2, raw));
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

    const { startYear, endYear, span } = bounds;
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

      const offset = ((year - startYear) / span) * 100;
      const position = Math.min(100, Math.max(0, offset));
      tick.style.top = `${position}%`;

      if (year % 10 === 0) {
        const label = document.createElement('span');
        label.className = 'timeline-century__tick-label';
        label.textContent = String(year);
        tick.appendChild(label);
      }

      const mark = document.createElement('span');
      mark.className = 'timeline-century__tick-mark';
      tick.appendChild(mark);

      ticks.appendChild(tick);
    }

    container.prepend(scale);
  }

  function buildEvent(event, century, bounds) {
    const position = choosePosition(event);
    const entry = document.createElement('div');
    entry.className = 'timeline-entry';
    entry.dataset.position = position;
    entry.dataset.eventId = event.id;

    const eventYear = getEventYearValue(event, bounds);
    const topPosition = positionForYear(eventYear, bounds);
    entry.style.top = `${topPosition}%`;
    entry.dataset.yearPosition = topPosition.toFixed(3);
    if (Number.isFinite(eventYear)) {
      entry.dataset.yearValue = String(eventYear);
    }

    const leftColumn = document.createElement('div');
    leftColumn.className = 'timeline-entry__column timeline-entry__column--left';

    const axisColumn = document.createElement('div');
    axisColumn.className = 'timeline-axis';
    axisColumn.setAttribute('aria-hidden', 'true');

    const yearWrapper = document.createElement('div');
    yearWrapper.className = 'timeline-year';
    const node = document.createElement('div');
    node.className = 'timeline-node';
    const yearLabel = (event.year && String(event.year).trim()) || (Number.isFinite(eventYear) ? String(eventYear) : '');
    node.textContent = yearLabel || '•';
    yearWrapper.appendChild(node);
    axisColumn.appendChild(yearWrapper);

    const rightColumn = document.createElement('div');
    rightColumn.className = 'timeline-entry__column timeline-entry__column--right';

    const bubble = document.createElement('button');
    bubble.className = `timeline-bubble timeline-bubble--${event.side || 'both'}`;
    bubble.type = 'button';
    bubble.dataset.eventId = event.id;
    bubble.dataset.title = event.title;

    const bubbleYear = (() => {
      if (Number.isFinite(eventYear)) {
        return Math.round(eventYear);
      }
      const match = typeof event.year === 'string' ? event.year.match(/(1[5-9]\d{2}|20\d{2})/) : null;
      if (match) {
        return Number(match[0]);
      }
      const fallbackMatch = typeof event.label === 'string' ? event.label.match(/(1[5-9]\d{2}|20\d{2})/) : null;
      return fallbackMatch ? Number(fallbackMatch[0]) : null;
    })();

    const bubbleIcon = typeof event.icon === 'string' && event.icon.trim().length ? event.icon.trim() : null;
    const bubbleLabel = bubbleIcon || (bubbleYear != null ? String(bubbleYear).padStart(4, '0') : (event.year ? String(event.year) : (event.label || '•')));
    const bubbleIconLabel = typeof event.iconLabel === 'string' && event.iconLabel.trim().length ? event.iconLabel.trim() : null;

    const accessibilityLabelParts = [event.title];
    if (bubbleIconLabel) {
      accessibilityLabelParts.push(bubbleIconLabel);
    }
    if (bubbleYear != null) {
      accessibilityLabelParts.push(String(bubbleYear));
    } else if (event.year) {
      accessibilityLabelParts.push(String(event.year));
    }

    const accessibilityLabel = accessibilityLabelParts.join(' – ');

    bubble.setAttribute('aria-label', accessibilityLabel);
    bubble.setAttribute('title', accessibilityLabel);
    bubble.textContent = bubbleLabel;
    bubble.addEventListener('click', () => openEvent(event.id));
    bubble.addEventListener('keydown', eventKey => {
      if (eventKey.key === 'Enter' || eventKey.key === ' ') {
        eventKey.preventDefault();
        openEvent(event.id);
      }
    });

    if (position === 'left') {
      leftColumn.appendChild(bubble);
      rightColumn.classList.add('timeline-entry__column--empty');
    } else {
      rightColumn.appendChild(bubble);
      leftColumn.classList.add('timeline-entry__column--empty');
    }

    entry.appendChild(leftColumn);
    entry.appendChild(axisColumn);
    entry.appendChild(rightColumn);

    eventIndex.set(event.id, { event, century });
    return entry;
  }

  const layoutConfig = {
    step: 28,
    maxOffset: 180,
    minScale: 0.65,
    scaleStep: 0.08,
    spacing: 14,
  };

  let layoutFrame = null;

  function computeAdjustedRect(rect, position, offset, scale) {
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const shift = position === 'left' ? -offset : offset;
    const width = rect.width * scale;
    const height = rect.height * scale;
    const left = centerX + shift - width / 2;
    const top = centerY - height / 2;
    return {
      left,
      right: left + width,
      top,
      bottom: top + height,
    };
  }

  function rectanglesOverlap(a, b, spacing) {
    const verticalOverlap = a.bottom > b.top - spacing && a.top < b.bottom + spacing;
    const horizontalOverlap = a.right > b.left - spacing && a.left < b.right + spacing;
    return verticalOverlap && horizontalOverlap;
  }

  function resolveOverlaps(entries) {
    if (!entries.length) {
      return [];
    }
    const data = entries
      .map(entry => {
        const bubble = entry.querySelector('.timeline-bubble');
        if (!bubble) {
          return null;
        }
        const rect = bubble.getBoundingClientRect();
        const position = entry.dataset.position === 'left' ? 'left' : 'right';
        return { entry, bubble, rect, position };
      })
      .filter(Boolean)
      .sort((a, b) => a.rect.top - b.rect.top);

    const placements = { left: [], right: [] };
    const adjustments = [];

    data.forEach(item => {
      const placed = placements[item.position];
      let offset = 0;
      let scale = 1;
      let candidate = computeAdjustedRect(item.rect, item.position, offset, scale);
      let iterations = 0;
      const limit = 24;

      while (iterations < limit && placed.some(rect => rectanglesOverlap(rect, candidate, layoutConfig.spacing))) {
        if (offset < layoutConfig.maxOffset) {
          offset += layoutConfig.step;
        } else if (scale > layoutConfig.minScale) {
          scale = Math.max(layoutConfig.minScale, scale - layoutConfig.scaleStep);
        } else {
          offset += layoutConfig.step;
        }
        candidate = computeAdjustedRect(item.rect, item.position, offset, scale);
        iterations += 1;
      }

      placed.push(candidate);
      adjustments.push({ entry: item.entry, offset, scale });
    });

    return adjustments;
  }

  function resetEntryLayout(section) {
    if (!section || section.classList.contains('timeline-century--collapsed')) {
      return;
    }
    const entries = section.querySelector('.timeline-century__entries');
    if (!entries || entries.hidden) {
      return;
    }
    entries.querySelectorAll('.timeline-entry').forEach(entry => {
      entry.style.removeProperty('--bubble-offset');
      entry.style.removeProperty('--bubble-scale');
      entry.style.removeProperty('--connector-length');
    });
  }

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
      const axisCenter = targetRect.left + targetRect.width / 2;
      const distance = entry.dataset.position === 'left'
        ? axisCenter - bubbleRect.right
        : bubbleRect.left - axisCenter;
      entry.style.setProperty('--connector-length', `${Math.max(distance, 0)}px`);
    });
  }

  function applyLayout() {
    const sections = Array.from(timelineContainer.querySelectorAll('.timeline-century'));
    sections.forEach(resetEntryLayout);

    requestAnimationFrame(() => {
      sections.forEach(section => {
        if (section.classList.contains('timeline-century--collapsed')) {
          return;
        }
        const entries = section.querySelector('.timeline-century__entries');
        if (!entries || entries.hidden) {
          return;
        }
        const entryNodes = Array.from(entries.querySelectorAll('.timeline-entry'));
        const adjustments = resolveOverlaps(entryNodes);

        adjustments.forEach(({ entry, offset, scale }) => {
          entry.style.setProperty('--bubble-offset', `${offset}px`);
          entry.style.setProperty('--bubble-scale', scale.toFixed(3));
        });
      });

      requestAnimationFrame(() => {
        sections.forEach(updateConnectorLengths);
      });
    });
  }

  function scheduleLayout() {
    if (layoutFrame) {
      cancelAnimationFrame(layoutFrame);
    }
    layoutFrame = requestAnimationFrame(() => {
      layoutFrame = null;
      applyLayout();
    });
  }

  function buildCenturySection(century, index) {
    const section = document.createElement('section');
    section.className = 'timeline-century';

    const header = document.createElement('div');
    header.className = 'timeline-century__header';

    const heading = document.createElement('h2');
    heading.className = 'timeline-century__heading';
    const headingText = century.title || 'Century of occupation';
    heading.textContent = century.range ? `${headingText} (${century.range})` : headingText;
    header.appendChild(heading);

    section.appendChild(header);

    if (century.summary) {
      const summary = document.createElement('p');
      summary.className = 'timeline-century__summary';
      summary.textContent = century.summary;
      section.appendChild(summary);
    }

    const entries = document.createElement('div');
    entries.className = 'timeline-century__entries';
    const idSeed = (century.id || `century-${index + 1}`).toString();
    const normalizedId = idSeed.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    entries.id = `${normalizedId || `century-${index + 1}`}-entries`;

    const bounds = normalizeCenturyBounds(century);
    entries.style.setProperty('--century-span', String(bounds.span || 100));
    buildCenturyScale(entries, bounds);

    const events = ensurePhotoAlbumsForCentury(century, bounds);
    events.sort((a, b) => {
      const yearA = getEventYearValue(a, bounds);
      const yearB = getEventYearValue(b, bounds);
      if (yearA === yearB) {
        return (a.label || a.id || '').localeCompare(b.label || b.id || '');
      }
      return yearA - yearB;
    });
    events.forEach(event => {
      const entry = buildEvent(event, century, bounds);
      entries.appendChild(entry);
    });

    section.appendChild(entries);
    return section;
  }

  function showEmptyTimelineState() {
    timelineContainer.innerHTML = '';
    const empty = document.createElement('p');
    empty.className = 'text-center text-slate-500 dark:text-slate-300';
    empty.textContent = 'No timeline entries available.';
    timelineContainer.appendChild(empty);
  }

  function displayCentury(value) {
    if (!Array.isArray(centuriesData) || !centuriesData.length) {
      showEmptyTimelineState();
      return;
    }

    let record = centuriesData.find(entry => entry.value === value);
    if (!record) {
      [record] = centuriesData;
      if (!record) {
        showEmptyTimelineState();
        return;
      }
      if (centurySelect) {
        centurySelect.value = record.value;
      }
    }

    timelineContainer.innerHTML = '';
    eventIndex.clear();
    sharedSidePreference = 'right';

    const section = buildCenturySection(record.century, record.index);
    timelineContainer.appendChild(section);
    scheduleLayout();
  }

  function renderTimeline(data) {
    const centuries = Array.isArray(data.centuries) ? [...data.centuries].reverse() : [];
    centuriesData = centuries.map((century, index) => {
      const idSeed = (century.id || `century-${index + 1}`).toString();
      const normalizedId = idSeed.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return {
        century,
        index,
        value: normalizedId || `century-${index + 1}`,
      };
    });

    if (centurySelect) {
      centurySelect.innerHTML = '';
      if (!centuriesData.length) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No centuries available';
        centurySelect.appendChild(option);
        centurySelect.disabled = true;
      } else {
        centuriesData.forEach(entry => {
          const option = document.createElement('option');
          option.value = entry.value;
          const title = entry.century.title || entry.century.range || `Century ${entry.index + 1}`;
          if (entry.century.title && entry.century.range) {
            option.textContent = `${entry.century.title} (${entry.century.range})`;
          } else {
            option.textContent = title;
          }
          centurySelect.appendChild(option);
        });
        centurySelect.disabled = centuriesData.length <= 1;
      }

      if (centurySelector) {
        centurySelector.classList.toggle('hidden', !centuriesData.length);
      }

      centurySelect.onchange = event => {
        const { value } = event.target;
        displayCentury(value);
        try {
          const url = new URL(window.location.href);
          if (value) {
            url.searchParams.set('century', value);
          } else {
            url.searchParams.delete('century');
          }
          window.history.replaceState(null, '', url);
        } catch (error) {
          // ignore URL update issues
        }
      };
    }

    if (!centuriesData.length) {
      showEmptyTimelineState();
      return;
    }

    let defaultCentury = centuriesData[0];
    try {
      const url = new URL(window.location.href);
      const searchCentury = url.searchParams.get('century');
      const hashCentury = window.location.hash ? window.location.hash.replace(/^#/, '') : '';
      const requested = searchCentury || hashCentury || '';
      if (requested) {
        const found = centuriesData.find(entry => entry.value === requested);
        if (found) {
          defaultCentury = found;
        }
      }
    } catch (error) {
      // ignore URL parsing issues
    }
    if (centurySelect) {
      centurySelect.value = defaultCentury.value;
    }
    displayCentury(defaultCentury.value);
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

    if (event.type === 'photo-album') {
      const albumWrapper = document.createElement('div');
      albumWrapper.className = 'modal-photo-album';

      const placeholder = document.createElement('div');
      placeholder.className = 'photo-album-placeholder';

      const icon = document.createElement('div');
      icon.className = 'photo-album-placeholder__icon';
      icon.textContent = event.icon || '📸';
      placeholder.appendChild(icon);

      const text = document.createElement('p');
      text.className = 'photo-album-placeholder__text';
      const albumYear = event.albumYear || event.yearValue || event.year || '';
      const readableYear = albumYear ? String(albumYear) : 'selected year';
      text.textContent = `This space will showcase the ${readableYear} photo collection.`;
      placeholder.appendChild(text);

      albumWrapper.appendChild(placeholder);
      modalBody.appendChild(albumWrapper);
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

  const handleWindowResize = () => scheduleLayout();
  window.addEventListener('resize', handleWindowResize);
  window.addEventListener('orientationchange', handleWindowResize);

  const timelineLayoutObserver = typeof ResizeObserver !== 'undefined' && timelineContainer
    ? new ResizeObserver(() => scheduleLayout())
    : null;
  if (timelineLayoutObserver) {
    timelineLayoutObserver.observe(timelineContainer);
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => scheduleLayout());
  }

  fetch('data/timeline.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to load timeline data');
      }
      return response.json();
    })
    .then(data => {
      loadingMessage.classList.add('hidden');
      renderIntro(data);
      renderTimeline(data);
    })
    .catch(error => {
      console.error(error);
      loadingMessage.textContent = 'We could not load the timeline data. Please refresh the page.';
    });
})();

