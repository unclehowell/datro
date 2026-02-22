(function(){
  function applyTheme(t){
    document.body.dataset.theme = t;
    try{localStorage.setItem('pcp_theme', t);}catch(e){}
  }
  function ensureAudio(){
    var audio = document.getElementById('radioPlayer');
    if (!audio) {
      audio = document.createElement('audio');
      audio.id = 'radioPlayer';
      audio.src = 'https://stream.rcs.revma.com/fxp289cp81uvv';
      audio.preload = 'none';
      document.body.appendChild(audio);
    }
    return audio;
  }
  function initGlobalControls(){
    var host = document.getElementById('globalControls') || document.querySelector('.app-content-header .col-sm-6.text-end');
    if (!host) {
      host = document.createElement('div');
      host.id = 'globalControls';
      host.style.cssText = 'position:fixed; top:8px; right:12px; z-index:9999;';
      document.body.appendChild(host);
    }
    if (host.dataset.bound) return;
    host.dataset.bound = '1';
    host.innerHTML = '<div style="display:flex; align-items:center; justify-content:flex-end; gap:0.5rem; flex-wrap:wrap;">'
      + '<span id="localTime" class="text-muted"></span>'
      + '<span style="font-size:0.9rem;">Now playing: Retro LED Radio</span>'
      + '<button id="radioMute" class="btn btn-sm btn-outline-secondary" type="button">🔇</button>'
      + '<input id="radioVolume" type="range" min="0" max="100" value="75" style="width:140px;">'
      + '<select id="themeSelect" class="form-select form-select-sm" style="width:140px;"></select>'
      + '</div>';
    var sel = document.getElementById('themeSelect');
    if (sel && sel.options.length === 0) {
      ['dark','combat','light'].forEach(function(v){
        var o = document.createElement('option');
        o.value = v; o.textContent = v[0].toUpperCase()+v.slice(1);
        sel.appendChild(o);
      });
    }
  }
  function initThemeToggle(){
    var sel = document.getElementById('themeSelect');
    var saved = null;
    try{saved = localStorage.getItem('pcp_theme');}catch(e){}
    var theme = saved || 'dark';
    applyTheme(theme);
    if (!sel) return;
    sel.value = theme;
    sel.addEventListener('change', function(){ applyTheme(sel.value); });
  }
  function initRadioAutoplay(){
    var audio = ensureAudio();
    var vol = document.getElementById('radioVolume');
    var mute = document.getElementById('radioMute');
    var savedVol = 75;
    try{ savedVol = Number(localStorage.getItem('pcp_volume')||75); }catch(e){}
    if (vol) vol.value = savedVol;
    var applyVolume = function(){
      var v = vol ? Number(vol.value) : savedVol;
      v = Math.max(0, Math.min(100, v));
      audio.volume = (v/100) * 0.1;
      try{localStorage.setItem('pcp_volume', String(v));}catch(e){}
    };
    if (vol) vol.addEventListener('input', applyVolume);
    applyVolume();
    if (mute) {
      mute.addEventListener('click', function(){
        audio.muted = !audio.muted;
        mute.textContent = audio.muted ? '🔇' : '🔊';
      });
    }
    audio.play().catch(function(){});
  }
  function initClock(){
    var el = document.getElementById('localTime');
    if (!el || !window.Intl) return;
    var update = function(){
      var fmt = new Intl.DateTimeFormat(undefined, { hour:'2-digit', minute:'2-digit', second:'2-digit', timeZoneName:'short' });
      el.textContent = fmt.format(new Date());
    };
    update();
    setInterval(update, 1000);
  }
  window.PCPTheme = { initThemeToggle, applyTheme, initRadioAutoplay };
  document.addEventListener('DOMContentLoaded', function(){
    initGlobalControls();
    initThemeToggle();
    initClock();
    initRadioAutoplay();
  });
})();
