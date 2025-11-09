(function () {
  function isAddIconProtected() {
    return /app-store\/006/i.test(window.location.pathname);
  }

  function syncCheckboxState(card) {
    const appId = card.dataset.appId;
    const checkbox = card.querySelector('.app-checkbox');
    if (!appId || !checkbox) {
      return;
    }

    const storedValue = localStorage.getItem(appId);
    const addIconProtected = appId === '999-999' && isAddIconProtected();

    let isInstalled = storedValue === 'added';
    if (appId === '999-999') {
      if (addIconProtected) {
        isInstalled = true;
      } else {
        isInstalled = storedValue !== 'removed';
      }
    }

    checkbox.checked = isInstalled;

    if (appId === '999-999') {
      if (addIconProtected) {
        checkbox.setAttribute('disabled', 'disabled');
      } else {
        checkbox.removeAttribute('disabled');
      }
      card.classList.toggle('app-card--disabled', addIconProtected);
    }
  }

  function toggleAppInstallation(appId, checkbox) {
    const addIconProtected = appId === '999-999' && isAddIconProtected();
    if (addIconProtected) {
      checkbox.checked = true;
      return;
    }

    if (checkbox.checked) {
      localStorage.setItem(appId, 'added');
    } else if (appId === '999-999') {
      localStorage.setItem(appId, 'removed');
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
