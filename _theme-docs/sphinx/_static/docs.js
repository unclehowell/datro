/* Furo follows the family sites' day/night mode (<html data-ghf-mode="day|night">, set by ghf-boot.js before the first paint and by
   the family toggle): day = light, night = dark. The page is drawn in both schemes itself (<html data-ghf-native="auto">), so it is
   never colour-inverted. One toggle only: the family's (Furo's own is hidden in docs.css). — Cedwyn editors */
(function  {
  var de = document.documentElement;
  function want { var m = de.getAttribute('data-ghf-mode'); return m === 'day' ? 'light' : m === 'night' ? 'dark' : null; }
  function apply {
    var t = want; if (!t) return;
    try { localStorage.setItem('theme', t); } catch (e) {}   // Furo reads this at the start of <body>: no flash on the next page
    if (document.body && document.body.getAttribute('data-theme') !== t) document.body.setAttribute('data-theme', t);
  }
  apply;
  document.addEventListener('DOMContentLoaded', apply);
  document.addEventListener('ghf-theme-change', apply);
  try { new MutationObserver(apply).observe(de, { attributes: true, attributeFilter: ['data-ghf-mode'] }); } catch (e) {}
});
