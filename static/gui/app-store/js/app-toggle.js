
(function () {
  function isAddAppLocked(card) {
    if (!card || card.dataset.appId !== '999-999') {
      return false;
    }

    if (card.dataset.lockAddApp === 'true') {
      return true;
    }

    return document.body && document.body.dataset.lockAddApp === 'true';
  }

  function syncCheckboxState(card) {
    const appId = card.dataset.appId;
    const checkbox = card.querySelector('.app-checkbox');
    if (!appId || !checkbox) {
      return;
    }

    let storedValue = localStorage.getItem(appId);

    if (appId === '999-999') {
      if (storedValue === null) {
        localStorage.setItem(appId, 'added');
        storedValue = 'added';
      }

      if (isAddAppLocked(card)) {
        checkbox.checked = true;
        checkbox.setAttribute('disabled', 'disabled');
        card.classList.add('app-card--disabled');
        return;
      }

      checkbox.removeAttribute('disabled');
      card.classList.remove('app-card--disabled');

      const wrapperLink = card.closest('.app-card-link');
      if (wrapperLink) {
        wrapperLink.classList.remove('app-card-link--inactive');
        wrapperLink.removeAttribute('aria-disabled');

        if (!wrapperLink.dataset.toggleHandlerBound) {
          wrapperLink.addEventListener('click', function (event) {
            if (event.target.closest('.app-card__toggle')) {
              event.preventDefault();
            }
          });
          wrapperLink.dataset.toggleHandlerBound = 'true';
        }
      }

      checkbox.checked = storedValue !== 'removed';
      return;
    }

    const isInstalled = storedValue === 'added';
    checkbox.checked = isInstalled;
  }

  function toggleAppInstallation(appId, checkbox) {
    if (appId === '999-999') {
      const card = checkbox.closest('.app-card');
      if (isAddAppLocked(card)) {
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

    cards.forEach(function (card) {
      const appId = card.dataset.appId;
      const checkbox = card.querySelector('.app-checkbox');
      if (!checkbox) {
        return;
      }

      syncCheckboxState(card);

      checkbox.addEventListener('change', function () {
        toggleAppInstallation(appId, checkbox);
      });
    });
  });
})();
