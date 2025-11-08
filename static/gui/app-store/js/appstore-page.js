(function () {
  function setCheckboxState(checkbox, installed, locked) {
    checkbox.checked = installed;
    if (locked) {
      checkbox.checked = true;
      checkbox.setAttribute('disabled', 'disabled');
    } else {
      checkbox.removeAttribute('disabled');
    }
  }

  function initAppStore(appIds, lockedIds) {
    var lockedSet = new Set(lockedIds || []);

    function sync() {
      appIds.forEach(function (appId) {
        var checkbox = document.getElementById(appId);
        if (!checkbox) {
          return;
        }
        var installed = lockedSet.has(appId) || localStorage.getItem(appId) === 'added';
        setCheckboxState(checkbox, installed, lockedSet.has(appId));
      });
    }

    function toggle(event) {
      var checkbox = event.target;
      var appId = checkbox.id;
      if (lockedSet.has(appId)) {
        setCheckboxState(checkbox, true, true);
        return;
      }
      var installed = localStorage.getItem(appId) === 'added';
      if (installed) {
        localStorage.removeItem(appId);
      } else {
        localStorage.setItem(appId, 'added');
      }
      sync();
    }

    sync();

    document.querySelectorAll('.app-checkbox').forEach(function (checkbox) {
      if (!appIds.includes(checkbox.id)) {
        return;
      }
      var locked = lockedSet.has(checkbox.id);
      if (!locked) {
        checkbox.addEventListener('change', toggle);
      }
    });

    window.addEventListener('storage', sync);
  }

  window.initAppStore = initAppStore;
})();
