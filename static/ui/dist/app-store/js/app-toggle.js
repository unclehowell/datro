(function () {
  function shouldLockAddAppIcon() {
    const path = window.location.pathname || '';
    return path.includes('/app-store/006');
  }

  function setAddIconCardState(card, checkbox, isLocked) {
    const cardLink = card.closest('.app-card-link');

    if (isLocked) {
      checkbox.checked = true;
      checkbox.setAttribute('disabled', 'disabled');
      card.classList.add('app-card--disabled');
      if (cardLink) {
        cardLink.classList.add('app-card-link--inactive');
        cardLink.setAttribute('aria-disabled', 'true');
      }
      return;
    }

    checkbox.removeAttribute('disabled');
    card.classList.remove('app-card--disabled');
    if (cardLink) {
      cardLink.classList.remove('app-card-link--inactive');
      cardLink.removeAttribute('aria-disabled');
    }
  }

  function syncCheckboxState(card) {
    const appId = card.dataset.appId;
    const checkbox = card.querySelector('.app-checkbox');
    if (!appId || !checkbox) {
      return;
    }

    const storedValue = localStorage.getItem(appId);

    if (appId === '999-999') {
      const isLocked = shouldLockAddAppIcon();
      setAddIconCardState(card, checkbox, isLocked);
      if (!isLocked) {
        const isEnabled = storedValue !== 'removed';
        checkbox.checked = isEnabled;
      }
      return;
    }

    const isInstalled = storedValue === 'added';
    checkbox.checked = isInstalled;
  }

  function toggleAppInstallation(appId, checkbox, card) {
    if (appId === '999-999') {
      const isLocked = shouldLockAddAppIcon();
      if (isLocked) {
        checkbox.checked = true;
        setAddIconCardState(card, checkbox, true);
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
        toggleAppInstallation(appId, checkbox, card);
      });
    });
  });
})();
