(function () {
  const ADD_APP_ID = '999-999';
  const ADD_APP_REMOVED = 'removed';
  const ADD_APP_ADDED = 'added';
  const path = window.location.pathname;
  const isProtectedContext =
    path.includes('/app-store/006') || path.includes('/dashboard/006');

  function isAddAppEnabled() {
    if (isProtectedContext) {
      return true;
    }

    return localStorage.getItem(ADD_APP_ID) !== ADD_APP_REMOVED;
  }

  function applyAddAppState(card) {
    const checkbox = card.querySelector('.app-checkbox');
    if (!checkbox) {
      return;
    }

    const link = card.closest('.app-card-link');
    const enabled = isAddAppEnabled();
    const effectiveEnabled = isProtectedContext ? true : enabled;

    checkbox.checked = effectiveEnabled;
    checkbox.disabled = isProtectedContext;

    card.classList.remove('app-card--disabled');

    if (link) {
      link.classList.remove('app-card-link--inactive');
      if (effectiveEnabled) {
        link.removeAttribute('aria-disabled');
      } else {
        link.setAttribute('aria-disabled', 'true');
      }
    }
  }

  function syncCheckboxState(card) {
    const appId = card.dataset.appId;
    const checkbox = card.querySelector('.app-checkbox');
    if (!appId || !checkbox) {
      return;
    }

    if (appId === ADD_APP_ID) {
      applyAddAppState(card);
      return;
    }

    const storedValue = localStorage.getItem(appId);
    const isInstalled = storedValue === ADD_APP_ADDED;

    checkbox.checked = isInstalled;
  }

  function toggleAppInstallation(appId, checkbox, card) {
    if (appId === ADD_APP_ID) {
      if (isProtectedContext) {
        checkbox.checked = true;
        return;
      }

      const enabled = checkbox.checked;
      localStorage.setItem(appId, enabled ? ADD_APP_ADDED : ADD_APP_REMOVED);
      applyAddAppState(card);
      refreshAddAppCards();
      return;
    }

    if (checkbox.checked) {
      localStorage.setItem(appId, ADD_APP_ADDED);
    } else {
      localStorage.removeItem(appId);
    }
  }

  function refreshAddAppCards() {
    document
      .querySelectorAll('.app-card[data-app-id="' + ADD_APP_ID + '"]')
      .forEach(applyAddAppState);
  }

  document.addEventListener('DOMContentLoaded', function () {
    const cards = document.querySelectorAll('.app-card[data-app-id]');

    cards.forEach(function (card) {
      const appId = card.dataset.appId;
      const checkbox = card.querySelector('.app-checkbox');
      if (!checkbox) {
        return;
      }

      syncCheckboxState(card);

      checkbox.addEventListener('change', function () {
        toggleAppInstallation(appId, checkbox, card);
      });
    });
  });

  window.addEventListener('storage', function (event) {
    if (event.key === ADD_APP_ID) {
      refreshAddAppCards();
    }
  });
})();
