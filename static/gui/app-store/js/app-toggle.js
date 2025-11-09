
(function () {
  const ADD_APP_ID = '999-999';

  function isAddApp(card) {
    return Boolean(card && card.dataset.appId === ADD_APP_ID);
  }

  function isAddAppLocked(card) {
    if (!isAddApp(card)) {
      return false;
    }

    if (card.dataset.lockAddApp === 'true') {
      return true;
    }

    return document.body && document.body.dataset.lockAddApp === 'true';
  }

  function ensureAddCardClickHandling(card) {
    const wrapperLink = card.closest('.app-card-link');
    if (!wrapperLink || wrapperLink.dataset.toggleHandlerBound) {
      return;
    }

    wrapperLink.addEventListener('click', function (event) {
      if (event.target.closest('.app-card__toggle')) {
        event.preventDefault();
      }
    });
    wrapperLink.dataset.toggleHandlerBound = 'true';
  }

  function setLinkInteractivity(card, shouldDisable) {
    const wrapperLink = card.closest('.app-card-link');
    if (!wrapperLink) {
      return;
    }

    if (shouldDisable) {
      wrapperLink.classList.add('app-card-link--inactive');
      wrapperLink.setAttribute('aria-disabled', 'true');
    } else {
      wrapperLink.classList.remove('app-card-link--inactive');
      wrapperLink.removeAttribute('aria-disabled');
    }
  }

  function applyAddCardState(card, checkbox, isLocked, storedValue) {
    if (isLocked) {
      checkbox.checked = true;
      checkbox.setAttribute('disabled', 'disabled');
      card.classList.add('app-card--disabled');
      setLinkInteractivity(card, true);
      return;
    }

    checkbox.removeAttribute('disabled');
    card.classList.remove('app-card--disabled');
    setLinkInteractivity(card, false);
    ensureAddCardClickHandling(card);

    const isRemoved = storedValue === 'removed';
    checkbox.checked = !isRemoved;
  }

  function syncCheckboxState(card) {
    const appId = card.dataset.appId;
    const checkbox = card.querySelector('.app-checkbox');
    if (!appId || !checkbox) {
      return;
    }

    if (isAddApp(card)) {
      let storedValue = localStorage.getItem(ADD_APP_ID);
      if (storedValue === null) {
        localStorage.setItem(ADD_APP_ID, 'added');
        storedValue = 'added';
      }

      const locked = isAddAppLocked(card);
      applyAddCardState(card, checkbox, locked, storedValue);
      return;
    }

    checkbox.checked = localStorage.getItem(appId) === 'added';
  }

  function toggleAppInstallation(card, checkbox) {
    const appId = card.dataset.appId;
    if (!appId) {
      return;
    }

    if (isAddApp(card)) {
      if (isAddAppLocked(card)) {
        checkbox.checked = true;
        return;
      }

      localStorage.setItem(ADD_APP_ID, checkbox.checked ? 'added' : 'removed');
      return;
    }

    if (checkbox.checked) {
      localStorage.setItem(appId, 'added');
    } else {
      localStorage.removeItem(appId);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    const cards = document.querySelectorAll('.app-card[data-app-id]');

    cards.forEach(function (card) {
      const checkbox = card.querySelector('.app-checkbox');
      if (!checkbox) {
        return;
      }

      syncCheckboxState(card);

      checkbox.addEventListener('change', function () {
        toggleAppInstallation(card, checkbox);
      });
    });
  });
})();
