/* Follow the family sites' day/night setting (set on <html data-ghf-theme> by ghf-boot.js) in Furo. — Sion's Tab agent */
(function () {
  var de = document.documentElement;
  function apply() {
    var t = de.getAttribute('data-ghf-theme');
    if (t === 'night' || t === 'day') document.body && document.body.setAttribute('data-theme', t === 'night' ? 'dark' : 'light');
  }
  document.addEventListener('DOMContentLoaded', apply);
  try { new MutationObserver(apply).observe(de, { attributes: true, attributeFilter: ['data-ghf-theme'] }); } catch (e) {}
})();
