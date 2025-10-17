(function () {
  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  var yearTrack;
  var yearViewport;
  var entryList;
  var loadingBanner;
  var yearGroups = [];
  var yearButtons = [];
  var entryItems = [];
  var activeYearIndex = -1;
  var activeEntryIndex = -1;

  onReady(initialize);

  function initialize() {
    yearTrack = document.getElementById('timeline-year-track');
    yearViewport = document.getElementById('year-bar-viewport');
    entryList = document.getElementById('timeline-year-entries');
    loadingBanner = document.getElementById('timeline-loading');

    if (!yearTrack || !entryList) {
      return;
    }

    if (yearTrack.getAttribute('role') !== 'listbox') {
      yearTrack.setAttribute('role', 'listbox');
    }

    showLoading('Loading timeline…');

    fetch('data/timeline.json')
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Failed to load timeline data');
        }
        return response.json();
      })
      .then(function (data) {
        yearGroups = buildCenturyGroups(data);
        if (!yearGroups.length) {
          showLoading('Timeline data is not available.');
          return;
        }
        renderYearButtons(yearGroups);
        setActiveYear(0, true);
        hideLoading();
      })
      .catch(function (error) {
        console.error(error);
        showLoading('We could not load the timeline data. Please refresh the page.');
      });

    document.addEventListener('keydown', handleKeyNavigation);
  }

  function buildCenturyGroups(data) {
    var result = [];
    if (!data || !data.centuries || !data.centuries.length) {
      return result;
    }

    for (var i = 0; i < data.centuries.length; i += 1) {
      var century = data.centuries[i] || {};
      var events = Array.isArray(century.events)
        ? century.events.slice()
        : [];

      events.sort(function (a, b) {
        var aValue = typeof a.yearValue === 'number' ? a.yearValue : Number.POSITIVE_INFINITY;
        var bValue = typeof b.yearValue === 'number' ? b.yearValue : Number.POSITIVE_INFINITY;
        if (aValue !== bValue) {
          return aValue - bValue;
        }
        var aLabel = (a.year || '').toString();
        var bLabel = (b.year || '').toString();
        return aLabel.localeCompare(bLabel, undefined, { numeric: true });
      });

      var groupIcon = '🕰️';
      for (var j = 0; j < events.length; j += 1) {
        if (events[j] && events[j].icon) {
          groupIcon = events[j].icon;
          break;
        }
      }

      var rangeLabel = typeof century.range === 'string' && century.range.trim()
        ? century.range.trim()
        : '';
      var titleLabel = typeof century.title === 'string' && century.title.trim()
        ? century.title.trim()
        : '';

      var sortValue = typeof century.startYear === 'number'
        ? century.startYear
        : null;
      if (sortValue === null && events.length) {
        var firstEvent = events[0];
        if (firstEvent && typeof firstEvent.yearValue === 'number') {
          sortValue = firstEvent.yearValue;
        }
      }
      if (sortValue === null) {
        sortValue = Number.POSITIVE_INFINITY;
      }

      result.push({
        id: century.id || 'century-' + i,
        icon: groupIcon,
        label: rangeLabel || titleLabel || 'Century ' + (i + 1),
        subtitle: rangeLabel && titleLabel && rangeLabel !== titleLabel ? titleLabel : '',
        range: rangeLabel,
        title: titleLabel,
        events: events,
        sortValue: sortValue,
      });
    }

    result.sort(function (a, b) {
      if (a.sortValue !== b.sortValue) {
        return a.sortValue - b.sortValue;
      }
      return a.label.localeCompare(b.label, undefined, { numeric: true });
    });

    return result;
  }

  function renderYearButtons(groups) {
    yearTrack.innerHTML = '';
    yearButtons = [];

    for (var i = 0; i < groups.length; i += 1) {
      var group = groups[i];
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'xmb-year';
      button.dataset.yearKey = group.id;
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', 'false');
      button.title = group.subtitle ? group.label + ' · ' + group.subtitle : group.label;

      var icon = document.createElement('span');
      icon.className = 'xmb-year__icon';
      icon.textContent = group.icon;
      button.appendChild(icon);

      var label = document.createElement('span');
      label.className = 'xmb-year__label';
      label.textContent = group.label;
      button.appendChild(label);

      if (group.subtitle) {
        var subtitle = document.createElement('span');
        subtitle.className = 'xmb-year__subtitle';
        subtitle.textContent = group.subtitle;
        button.appendChild(subtitle);
      }

      (function (index) {
        button.addEventListener('click', function () {
          setActiveYear(index, false);
        });
        button.addEventListener('keydown', function (event) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setActiveYear(index, true);
          }
        });
      })(i);

      yearTrack.appendChild(button);
      yearButtons.push(button);
    }
  }

  function setActiveYear(index, focusYear) {
    if (!yearGroups.length) {
      return;
    }

    var clamped = Math.max(0, Math.min(yearGroups.length - 1, index));
    if (clamped === activeYearIndex && !focusYear) {
      return;
    }

    activeYearIndex = clamped;
    for (var i = 0; i < yearButtons.length; i += 1) {
      var isActive = i === clamped;
      var button = yearButtons[i];
      if (!button) {
        continue;
      }
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
      button.tabIndex = isActive ? 0 : -1;
      if (isActive && focusYear) {
        button.focus({ preventScroll: true });
      }
    }

    scrollYearIntoView(clamped);
    renderEntryList(yearGroups[clamped]);
  }

  function renderEntryList(group) {
    entryList.innerHTML = '';
    entryItems = [];
    activeEntryIndex = -1;

    if (!group) {
      return;
    }

    if (group.title || group.range) {
      entryList.appendChild(createCenturyHeader(group));
    }

    if (!group.events.length) {
      var empty = document.createElement('p');
      empty.textContent = 'No events recorded for this period.';
      entryList.appendChild(empty);
      return;
    }

    for (var i = 0; i < group.events.length; i += 1) {
      var event = group.events[i];
      if (!event) {
        continue;
      }
      var entry = createEventEntry(event, i);
      entryList.appendChild(entry);
      entryItems.push(entry);
    }

    if (entryItems.length) {
      setActiveEntry(0, false);
    }
  }

  function createCenturyHeader(group) {
    var header = document.createElement('header');
    header.className = 'xmb-century-header';

    if (group.title) {
      var title = document.createElement('h2');
      title.className = 'xmb-century-header__title';
      title.textContent = group.title;
      header.appendChild(title);
    }

    if (group.range) {
      var range = document.createElement('p');
      range.className = 'xmb-century-header__range';
      range.textContent = group.range;
      header.appendChild(range);
    }

    return header;
  }

  function createEventEntry(event, index) {
    var entry = document.createElement('article');
    entry.className = 'xmb-entry';
    entry.setAttribute('role', 'listitem');
    entry.tabIndex = 0;

    var side = typeof event.side === 'string' ? event.side.toLowerCase() : '';
    if (side === 'both') {
      side = 'shared';
    }
    if (!side) {
      side = 'shared';
    }
    entry.dataset.side = side;

    var icon = document.createElement('span');
    icon.className = 'xmb-entry__icon';
    icon.textContent = event.icon || selectFallbackIcon(side);
    entry.appendChild(icon);

    var copy = document.createElement('div');
    copy.className = 'xmb-entry__copy';
    entry.appendChild(copy);

    var title = document.createElement('h3');
    title.className = 'xmb-entry__title';
    title.textContent = event.title || event.year || 'Timeline entry';
    copy.appendChild(title);

    var subtitleText = buildEntrySubtitle(event);
    if (subtitleText) {
      var subtitle = document.createElement('p');
      subtitle.className = 'xmb-entry__subtitle';
      subtitle.textContent = subtitleText;
      copy.appendChild(subtitle);
    }

    var body = document.createElement('div');
    body.className = 'xmb-entry__body';

    appendParagraph(body, event.summary);
    appendListSection(body, 'Context', event.context);
    appendEvidenceSection(body, event.evidence);

    if (body.childNodes.length) {
      copy.appendChild(body);
    }

    entry.addEventListener('click', function () {
      setActiveEntry(index, false);
    });

    entry.addEventListener('keydown', function (eventObject) {
      if (eventObject.key === 'Enter' || eventObject.key === ' ') {
        eventObject.preventDefault();
        setActiveEntry(index, true);
      }
    });

    return entry;
  }

  function buildEntrySubtitle(event) {
    var pieces = [];
    if (event.year) {
      pieces.push(String(event.year));
    }
    if (event.summary && pieces.join(' ').length < 120) {
      pieces.push(event.summary);
    }
    return pieces.join(' • ');
  }

  function appendParagraph(container, text) {
    if (!text) {
      return;
    }
    var paragraph = document.createElement('p');
    paragraph.textContent = text;
    container.appendChild(paragraph);
  }

  function appendListSection(container, heading, items) {
    if (!Array.isArray(items) || !items.length) {
      return;
    }
    var list = document.createElement('ul');
    for (var i = 0; i < items.length; i += 1) {
      if (!items[i]) {
        continue;
      }
      var item = document.createElement('li');
      item.textContent = items[i];
      list.appendChild(item);
    }
    if (!list.childNodes.length) {
      return;
    }
    var details = document.createElement('details');
    var summary = document.createElement('summary');
    summary.textContent = heading;
    details.appendChild(summary);
    details.appendChild(list);
    container.appendChild(details);
  }

  function appendEvidenceSection(container, evidenceItems) {
    if (!Array.isArray(evidenceItems) || !evidenceItems.length) {
      return;
    }

    var list = document.createElement('ul');

    for (var i = 0; i < evidenceItems.length; i += 1) {
      var evidence = evidenceItems[i];
      if (!evidence) {
        continue;
      }
      var listItem = document.createElement('li');

      if (evidence.title) {
        var title = document.createElement('strong');
        title.textContent = evidence.title;
        listItem.appendChild(title);
      }

      if (evidence.description) {
        var description = document.createElement('p');
        description.textContent = evidence.description;
        listItem.appendChild(description);
      }

      if (evidence.source && evidence.source.url) {
        var sourceLink = document.createElement('a');
        sourceLink.href = evidence.source.url;
        sourceLink.target = '_blank';
        sourceLink.rel = 'noopener noreferrer';
        sourceLink.textContent = evidence.source.name || evidence.source.url;
        listItem.appendChild(sourceLink);
      }

      if (Array.isArray(evidence.content) && evidence.content.length) {
        var subList = document.createElement('ul');
        for (var j = 0; j < evidence.content.length; j += 1) {
          if (!evidence.content[j]) {
            continue;
          }
          var bullet = document.createElement('li');
          bullet.textContent = evidence.content[j];
          subList.appendChild(bullet);
        }
        if (subList.childNodes.length) {
          listItem.appendChild(subList);
        }
      }

      list.appendChild(listItem);
    }

    if (list.childNodes.length) {
      var details = document.createElement('details');
      var summary = document.createElement('summary');
      summary.textContent = 'Evidence';
      details.appendChild(summary);
      details.appendChild(list);
      container.appendChild(details);
    }
  }

  function selectFallbackIcon(side) {
    if (side === 'buckler') {
      return '🌿';
    }
    if (side === 'bp') {
      return '🏢';
    }
    return '📜';
  }

  function setActiveEntry(index, focusEntry) {
    if (!entryItems.length) {
      return;
    }

    var clamped = Math.max(0, Math.min(entryItems.length - 1, index));
    if (clamped === activeEntryIndex && !focusEntry) {
      return;
    }

    activeEntryIndex = clamped;

    for (var i = 0; i < entryItems.length; i += 1) {
      var entry = entryItems[i];
      if (!entry) {
        continue;
      }
      var isActive = i === clamped;
      entry.classList.toggle('is-active', isActive);
      if (isActive) {
        entry.setAttribute('aria-current', 'true');
        var details = entry.querySelectorAll('details');
        for (var j = 0; j < details.length; j += 1) {
          details[j].open = true;
        }
        ensureEntryVisible(entry);
        if (focusEntry) {
          entry.focus({ preventScroll: true });
        }
      } else {
        entry.removeAttribute('aria-current');
        var allDetails = entry.querySelectorAll('details');
        for (var k = 0; k < allDetails.length; k += 1) {
          allDetails[k].open = false;
        }
      }
    }
  }

  function ensureEntryVisible(entry) {
    if (!entry) {
      return;
    }
    var viewport = entryList.parentElement || entryList;
    if (!viewport || typeof viewport.getBoundingClientRect !== 'function') {
      return;
    }
    var viewportRect = viewport.getBoundingClientRect();
    var entryRect = entry.getBoundingClientRect();
    if (entryRect.top < viewportRect.top + 20 || entryRect.bottom > viewportRect.bottom - 20) {
      if (typeof entry.scrollIntoView === 'function') {
        entry.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  function scrollYearIntoView(index) {
    if (!yearViewport || !yearButtons.length) {
      return;
    }
    var button = yearButtons[index];
    if (!button) {
      return;
    }
    var target = button.offsetLeft - Math.max(0, (yearViewport.clientWidth - button.offsetWidth) / 2);
    if (target < 0) {
      target = 0;
    }
    if (typeof yearViewport.scrollTo === 'function') {
      yearViewport.scrollTo({ left: target, behavior: 'smooth' });
    } else {
      yearViewport.scrollLeft = target;
    }
  }

  function handleKeyNavigation(event) {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    if (!yearGroups.length) {
      return;
    }

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        setActiveYear(activeYearIndex + 1, true);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        setActiveYear(activeYearIndex - 1, true);
        break;
      case 'ArrowDown':
        if (entryItems.length) {
          event.preventDefault();
          setActiveEntry(activeEntryIndex + 1, true);
        }
        break;
      case 'ArrowUp':
        if (entryItems.length) {
          event.preventDefault();
          setActiveEntry(activeEntryIndex - 1, true);
        }
        break;
      default:
    }
  }

  function showLoading(message) {
    if (!loadingBanner) {
      return;
    }
    if (message) {
      loadingBanner.textContent = message;
    }
    loadingBanner.classList.remove('is-hidden');
  }

  function hideLoading() {
    if (loadingBanner) {
      loadingBanner.classList.add('is-hidden');
    }
  }
})();
