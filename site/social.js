/* social.js — "See more / See less" on long posts, and opening a post's Source from #id links. — Sion's Tab agent */
(function(){
  function wire(){
    document.querySelectorAll(".sp-b.clamp").forEach(function(b){
      var btn=b.nextElementSibling; if(!btn||!btn.classList.contains("sp-more"))return;
      b.classList.add("closed");
      if(b.scrollHeight<=b.clientHeight+8){b.classList.remove("closed");return;}
      btn.hidden=false; btn.setAttribute("aria-expanded","false");
      btn.addEventListener("click",function(){var open=b.classList.toggle("closed")===false;btn.textContent=open?"See less":"See more";btn.setAttribute("aria-expanded",open?"true":"false");if(!open)b.closest("article").scrollIntoView({block:"nearest"});});
    });
  }
  // keep the quoted comments right under Like · Comment · Share once comments.js has drawn its bar
  function place(){document.querySelectorAll("article.sp").forEach(function(a){var q=a.querySelector(":scope > .sp-qc"),ac=a.querySelector(".fbc-acts");if(q&&ac&&ac.nextElementSibling!==q){ac.parentNode.insertBefore(q,ac.nextSibling);}});}
  var mo=new MutationObserver(function(){place();});
  function obs(){mo.observe(document.body,{childList:true,subtree:true});setTimeout(function(){mo.disconnect();},15000);place();}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",obs);else obs();
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",wire);else wire();
})();

/* 21 Oct 2026: top-bar menu + search, and the full-screen story viewer (tap a story card). — Sion's Tab agent */
(function(){
  var X='<svg viewBox="0 0 24 24" aria-hidden="true" class="si"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
  function q(s,r){return (r||document).querySelector(s);} function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
  function init(){
    var menu=q("#fb-menu");
    qa(".fb-menu-btn").forEach(function(b){b.addEventListener("click",function(){var open=menu.hidden;menu.hidden=!open;qa(".fb-menu-btn").forEach(function(x){x.setAttribute("aria-expanded",open?"true":"false");});});});
    document.addEventListener("click",function(ev){if(menu&&!menu.hidden&&!ev.target.closest("#fb-menu,.fb-menu-btn"))menu.hidden=true;});
    var sf=q(".fb-search"),sb=q(".fb-search-btn"),inp=sf&&q("input",sf);
    function filter(v){v=(v||"").trim().toLowerCase();var any=false,home=document.body.classList.contains("fb-home");if(!home)return;
      qa("article.sp").forEach(function(a){var hit=!v||a.textContent.toLowerCase().indexOf(v)>-1;a.classList.toggle("fb-hide",!hit);if(hit)any=true;});
      qa(".sb-era").forEach(function(h){var n=h.nextElementSibling,show=!v;while(n&&!n.classList.contains("sb-era")){if(!n.classList.contains("fb-hide")&&n.matches("article.sp"))show=true;n=n.nextElementSibling;}h.classList.toggle("fb-hide",!show);});
      var nr=q(".fb-noresults");if(nr)nr.hidden=any||!v;}
    if(sb&&sf){sb.addEventListener("click",function(){sf.hidden=!sf.hidden;sb.setAttribute("aria-expanded",sf.hidden?"false":"true");if(!sf.hidden)inp.focus();});
      q(".fb-search-x",sf).addEventListener("click",function(){inp.value="";filter("");sf.hidden=true;sb.setAttribute("aria-expanded","false");});
      inp.addEventListener("input",function(){filter(inp.value);});
      sf.addEventListener("submit",function(ev){if(document.body.classList.contains("fb-home")){ev.preventDefault();filter(inp.value);}});
      var m=/[?&]q=([^&]*)/.exec(location.search);if(m&&document.body.classList.contains("fb-home")){inp.value=decodeURIComponent(m[1].replace(/\+/g," "));sf.hidden=false;filter(inp.value);}}
    // stories
    var dataEl=q("#fb-stories-data");if(!dataEl)return;var S=[];try{S=JSON.parse(dataEl.textContent);}catch(e){return;}
    var sv=null,cur=-1,timer=null,vid=null,muted=false;
    function build(){sv=document.createElement("div");sv.className="sv";sv.setAttribute("role","dialog");sv.setAttribute("aria-label","Story");sv.hidden=true;
      sv.innerHTML='<div class="sv-bars">'+S.map(function(){return '<div class="sv-bar"><i></i></div>';}).join("")+'</div><div class="sv-head"><img alt=""><div><b></b><small></small></div><button type="button" class="sv-x" aria-label="Close">'+X+'</button></div><div class="sv-stage"><button type="button" class="sv-tap l" aria-label="Previous story"></button><button type="button" class="sv-tap r" aria-label="Next story"></button></div><p class="sv-foot"></p>';
      document.body.appendChild(sv);
      q(".sv-x",sv).addEventListener("click",close);q(".sv-tap.l",sv).addEventListener("click",function(){go(cur-1);});q(".sv-tap.r",sv).addEventListener("click",function(){go(cur+1);});
      document.addEventListener("keydown",function(ev){if(sv.hidden)return;if(ev.key==="Escape")close();if(ev.key==="ArrowRight")go(cur+1);if(ev.key==="ArrowLeft")go(cur-1);});
      var sx=null;sv.addEventListener("touchstart",function(ev){sx=ev.touches[0].clientX;},{passive:true});sv.addEventListener("touchend",function(ev){if(sx===null)return;var dx=ev.changedTouches[0].clientX-sx;sx=null;if(dx<-60)go(cur+1);else if(dx>60)go(cur-1);},{passive:true});}
    function stage(){var st=q(".sv-stage",sv);qa("video,iframe,.sv-mute",st).forEach(function(n){n.remove();});return st;}
    function setBars(i,frac){qa(".sv-bar",sv).forEach(function(b,k){b.classList.toggle("done",k<i);q("i",b).style.width=k<i?"100%":(k===i?(Math.round(frac*1000)/10)+"%":"0");});}
    function go(i){if(i<0)i=0;if(i>=S.length){close();return;}cur=i;var s=S[i];if(timer){clearInterval(timer);timer=null;}
      q(".sv-head img",sv).src=s.av;q(".sv-head b",sv).textContent=s.by;q(".sv-head small",sv).textContent=s.title;
      q(".sv-foot",sv).innerHTML='<span></span> · <a href="'+s.link+'">Open</a>';q(".sv-foot span",sv).textContent=s.credit;
      var st=stage();setBars(i,0);
      if(s.kind==="youtube"){var f=document.createElement("iframe");f.src="https://www.youtube-nocookie.com/embed/"+s.yt+"?autoplay=1&playsinline=1&rel=0&modestbranding=1"+(s.start?"&start="+s.start:"");f.allow="autoplay; encrypted-media; picture-in-picture; fullscreen";f.allowFullscreen=true;f.title=s.title;st.insertBefore(f,q(".sv-tap.l",st));setBars(i,1);
        // the embed keeps its own controls: the side tap zones stay for moving between stories
        qa(".sv-tap",st).forEach(function(t){t.style.width="18%";});}
      else{var v=document.createElement("video");v.src=s.src;v.poster=s.thumb;v.playsInline=true;v.setAttribute("playsinline","");v.autoplay=true;v.muted=muted;v.preload="auto";v.controls=false;st.insertBefore(v,q(".sv-tap.l",st));vid=v;
        qa(".sv-tap",st).forEach(function(t){t.style.width="30%";});
        var mb=document.createElement("button");mb.type="button";mb.className="sv-mute";mb.textContent=muted?"Sound on":"Mute";mb.addEventListener("click",function(){muted=!muted;v.muted=muted;mb.textContent=muted?"Sound on":"Mute";});st.appendChild(mb);
        v.addEventListener("timeupdate",function(){if(v.duration)setBars(cur,v.currentTime/v.duration);});
        v.addEventListener("ended",function(){go(cur+1);});
        var p=v.play();if(p&&p.catch)p.catch(function(){v.muted=true;muted=true;mb.textContent="Sound on";v.play().catch(function(){v.controls=true;});});}}
    function open(id){if(!sv)build();var i=S.findIndex(function(s){return s.id===id;});if(i<0)return;sv.hidden=false;document.body.style.overflow="hidden";document.body.classList.add("sv-open");go(i);}
    function close(){if(!sv)return;stage();sv.hidden=true;document.body.style.overflow="";document.body.classList.remove("sv-open");cur=-1;}
    qa("[data-story]").forEach(function(a){a.addEventListener("click",function(ev){ev.preventDefault();open(a.getAttribute("data-story"));});});
    var h=/^#story=(.+)$/.exec(location.hash);if(h)open(h[1]);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();

/* Friends page filters — Sion's Tab agent */
(function(){var b=document.querySelectorAll('.fr-filters button');if(!b.length)return;b.forEach(function(x){x.addEventListener('click',function(){b.forEach(function(y){y.setAttribute('aria-pressed',y===x?'true':'false')});document.querySelectorAll('.fr').forEach(function(f){f.hidden=!(x.dataset.f==='all'||f.dataset.tag===x.dataset.f)})})})})();
