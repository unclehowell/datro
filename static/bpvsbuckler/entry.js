(function () {
  const body = document.body;
  const entryId = body.dataset.entryId;
  const storageKey = 'ghf-theme';

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
  const entryMeta = document.getElementById('entry-meta');
  const entryHeading = document.getElementById('entry-heading');
  const entrySummary = document.getElementById('entry-summary');
  const entryContext = document.getElementById('entry-context');
  const entryContextList = document.getElementById('entry-context-list');
  const entryEvidence = document.getElementById('entry-evidence');
  const entryEvidenceList = document.getElementById('entry-evidence-list');

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

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
        // ignore persistence issues
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

  function renderIntroduction(data) {
    if (data.caseTitle && caseTitle) {
      caseTitle.textContent = data.caseTitle;
    }

    const hasIntro = Array.isArray(data.introduction) && data.introduction.length;
    if (caseIntro) {
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
    }

    const hasThemes = Array.isArray(data.keyThemes) && data.keyThemes.length;
    if (keyThemes) {
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

  function renderContext(event) {
    if (!entryContext || !entryContextList) {
      return;
    }
    entryContext.classList.add('hidden');
    entryContextList.innerHTML = '';
    if (Array.isArray(event.context) && event.context.length) {
      event.context.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        entryContextList.appendChild(li);
      });
      entryContext.classList.remove('hidden');
    }
  }

  function renderEvidence(event) {
    if (!entryEvidence || !entryEvidenceList) {
      return;
    }
    entryEvidence.classList.add('hidden');
    entryEvidenceList.innerHTML = '';

    if (!Array.isArray(event.evidence) || !event.evidence.length) {
      return;
    }

    event.evidence.forEach(evidence => {
      const block = document.createElement('article');
      block.className = 'detail-evidence-item';

      const heading = document.createElement('h4');
      heading.textContent = evidence.title;
      block.appendChild(heading);

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
          iframe.style.width = '100%';
          iframe.style.minHeight = '320px';
          block.appendChild(iframe);
        } else if (evidence.embed.type === 'object') {
          const object = document.createElement('object');
          object.data = evidence.embed.src;
          object.type = evidence.embed.mime || 'application/pdf';
          object.style.width = '100%';
          object.style.minHeight = '320px';
          block.appendChild(object);
        }
      }

      if (evidence.source && (evidence.source.name || evidence.source.url)) {
        const meta = document.createElement('p');
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

      entryEvidenceList.appendChild(block);
    });

    entryEvidence.classList.remove('hidden');
  }

  function normaliseCenturyValue(idSeed, fallback) {
    const normalized = idSeed.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return normalized || fallback;
  }

  function populateCenturies(centuriesData, selectedValue) {
    if (!centurySelect) {
      return;
    }
    centurySelect.innerHTML = '';

    if (!centuriesData.length) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No centuries available';
      centurySelect.appendChild(option);
      centurySelect.disabled = true;
      if (centurySelector) {
        centurySelector.classList.add('hidden');
      }
      return;
    }

    centuriesData.forEach(entry => {
      const option = document.createElement('option');
      option.value = entry.value;
      const title = entry.century.title || entry.century.range || `Century ${entry.index + 1}`;
      option.textContent = entry.century.title && entry.century.range ? `${entry.century.title} (${entry.century.range})` : title;
      centurySelect.appendChild(option);
    });

    centurySelect.disabled = centuriesData.length <= 1;
    if (centurySelector) {
      centurySelector.classList.toggle('hidden', !centuriesData.length);
    }

    if (selectedValue) {
      centurySelect.value = selectedValue;
    }

    centurySelect.onchange = event => {
      const value = event.target.value;
      if (value) {
        window.location.href = `../index.html?century=${value}`;
      } else {
        window.location.href = '../index.html';
      }
    };
  }

  function renderEntry(data) {
    const centuries = Array.isArray(data.centuries) ? [...data.centuries].reverse() : [];
    const centuriesData = centuries.map((century, index) => {
      const idSeed = (century.id || `century-${index + 1}`).toString();
      return {
        century,
        index,
        value: normaliseCenturyValue(idSeed, `century-${index + 1}`),
      };
    });

    let selectedCentury = null;
    let selectedCenturyValue = null;
    let selectedEvent = null;

    centuriesData.forEach(entry => {
      if (selectedEvent) {
        return;
      }
      const events = Array.isArray(entry.century.events) ? entry.century.events : [];
      events.forEach(event => {
        if (!selectedEvent && event.id === entryId) {
          selectedEvent = event;
          selectedCentury = entry.century;
          selectedCenturyValue = entry.value;
        }
      });
    });

    if (caseSubtitle && selectedEvent) {
      caseSubtitle.textContent = selectedEvent.title;
    }

    if (entryHeading && selectedEvent) {
      entryHeading.textContent = selectedEvent.title;
    }

    if (entrySummary && selectedEvent) {
      entrySummary.innerHTML = selectedEvent.summary;
    }

    if (entryMeta && selectedEvent) {
      const parts = [selectedEvent.year];
      if (selectedCentury) {
        parts.push(selectedCentury.title || selectedCentury.range);
        if (selectedCentury.range && selectedCentury.title) {
          parts.push(selectedCentury.range);
        }
      }
      entryMeta.textContent = parts.filter(Boolean).join(' • ');
    }

    if (selectedEvent) {
      renderContext(selectedEvent);
      renderEvidence(selectedEvent);
      const pageTitle = data.caseTitle ? `${selectedEvent.title} – ${data.caseTitle} timeline` : selectedEvent.title;
      document.title = pageTitle;
    } else if (entrySummary) {
      entrySummary.textContent = 'We could not find details for this timeline entry.';
    }

    populateCenturies(centuriesData, selectedCenturyValue);
  }

  fetch('../data/timeline.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to load timeline data');
      }
      return response.json();
    })
    .then(data => {
      renderIntroduction(data);
      renderEntry(data);
    })
    .catch(error => {
      console.error(error);
      if (entrySummary) {
        entrySummary.textContent = 'We were unable to load the entry details. Please try again later.';
      }
      if (centurySelector) {
        centurySelector.classList.add('hidden');
      }
    });
})();
