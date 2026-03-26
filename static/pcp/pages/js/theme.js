(function () {
  function applyTheme(mode) {
    var normalized = mode === 'light' ? 'light' : 'dark';
    var root = document.documentElement;
    if (root) root.setAttribute('data-bs-theme', normalized);
    if (document.body) {
      if (normalized === 'dark') document.body.classList.add('dark-mode');
      else document.body.classList.remove('dark-mode');
    }
    try {
      localStorage.setItem('theme', normalized);
    } catch (error) {}
  }

  function initTheme() {
    var saved = 'dark';
    try {
      saved = localStorage.getItem('theme') || 'dark';
    } catch (error) {}
    applyTheme(saved);
  }

  window.setTheme = applyTheme;
  window.addEventListener('DOMContentLoaded', initTheme);

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', function (event) {
      event.preventDefault();
      var isDark = document.documentElement.getAttribute('data-bs-theme') !== 'light';
      applyTheme(isDark ? 'light' : 'dark');
    });
  });
})();

