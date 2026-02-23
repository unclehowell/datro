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
  function initThemeToggle(){
    var sel = document.getElementById('settingsThemeSelect') || document.getElementById('themeSelect');
    var saved = null;
    try{saved = localStorage.getItem('pcp_theme');}catch(e){}
    var theme = saved || 'dark';
    applyTheme(theme);
    if (!sel) return;
    if (sel.options.length === 0) {
      ['dark','combat','light'].forEach(function(v){
        var o = document.createElement('option');
        o.value = v; o.textContent = v[0].toUpperCase()+v.slice(1);
        sel.appendChild(o);
      });
    }
    sel.value = theme;
    sel.addEventListener('change', function(){ applyTheme(sel.value); });
  }
  function initRadioAutoplay(){
    var audio = ensureAudio();
    var vol = document.getElementById('settingsVolume') || document.getElementById('radioVolume');
    var mute = document.getElementById('settingsMute') || document.getElementById('radioMute');
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
    initThemeToggle();
    // no clock in header
    initRadioAutoplay();
  });
})();
