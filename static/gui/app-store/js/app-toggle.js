(function () {
  const ADD_APP_ID = '999-999';

  function isAddAppAlwaysVisible() {
    const path = window.location.pathname;
    return path.includes('/app-store/006') || path.includes('/dashboard/006');
  }

  function isAddAppEnabled() {
    return localStorage.getItem(ADD_APP_ID) !== 'removed';
  }

  function syncCheckboxState(card) {
    const appId = card.dataset.appId;
    const checkbox = card.querySelector('.app-checkbox');
    if (!appId || !checkbox) {
      return;
    }

    const storedValue = localStorage.getItem(appId);
    const isInstalled = storedValue === 'added';
    const isAddApp = appId === ADD_APP_ID;
    const addAppAlwaysVisible = isAddApp && isAddAppAlwaysVisible();

    if (isAddApp) {
      const addAppEnabled = addAppAlwaysVisible || isAddAppEnabled();
      checkbox.checked = addAppEnabled;

      if (addAppAlwaysVisible) {
        checkbox.setAttribute('disabled', 'disabled');
        card.classList.add('app-card--disabled');
      } else {
        checkbox.removeAttribute('disabled');
        card.classList.toggle('app-card--disabled', !addAppEnabled);
      }
      return;
    }

    checkbox.checked = isInstalled;
  }

  function toggleAppInstallation(appId, checkbox) {
    const isAddApp = appId === ADD_APP_ID;
    const addAppAlwaysVisible = isAddApp && isAddAppAlwaysVisible();

    if (isAddApp) {
      if (addAppAlwaysVisible) {
        checkbox.checked = true;
        return;
      }

      if (checkbox.checked) {
        localStorage.setItem(appId, 'added');
      } else {
        localStorage.setItem(appId, 'removed');
      }
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
    const addAppAlwaysVisible = isAddAppAlwaysVisible();

    cards.forEach(function (card) {
      const appId = card.dataset.appId;
      const checkbox = card.querySelector('.app-checkbox');
      if (!checkbox) {
        return;
      }

      syncCheckboxState(card);

      if (appId === ADD_APP_ID && addAppAlwaysVisible) {
        return;
      }

      checkbox.addEventListener('change', function () {
        toggleAppInstallation(appId, checkbox);

        if (appId === ADD_APP_ID) {
          card.classList.toggle('app-card--disabled', !checkbox.checked);
        }
      });
    });
  });
})();
