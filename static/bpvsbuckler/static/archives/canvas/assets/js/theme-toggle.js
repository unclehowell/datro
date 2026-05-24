(function(){
  function applyTheme(mode){
    if(mode === 'dark') document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
    localStorage.setItem('theme', mode);
  }
  function init(){
    const saved = localStorage.getItem('theme') || 'dark';
    applyTheme(saved);
  }
  window.addEventListener('DOMContentLoaded', init);
  document.addEventListener('DOMContentLoaded', function(){
    const btn = document.getElementById('theme-toggle');
    if(btn){
      btn.addEventListener('click', function(e){ e.preventDefault(); const next = document.body.classList.contains('dark-mode') ? 'light' : 'dark'; applyTheme(next); });
    }
  });
})();
