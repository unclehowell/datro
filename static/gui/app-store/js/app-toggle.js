(function () {
  function syncCheckboxState(card) {
    const appId = card.dataset.appId;
    const checkbox = card.querySelector('.app-checkbox');
    if (!appId || !checkbox) {
      return;
    }

    const storedValue = localStorage.getItem(appId);
    const isInstalled = storedValue === 'added' || (appId === '999-999' && storedValue !== 'removed');

    checkbox.checked = appId === '999-999' ? true : isInstalled;

    if (appId === '999-999') {
      checkbox.setAttribute('disabled', 'disabled');
      card.classList.add('app-card--disabled');
    }
  }

  function toggleAppInstallation(appId, checkbox) {
    if (appId === '999-999') {
      checkbox.checked = true;
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
