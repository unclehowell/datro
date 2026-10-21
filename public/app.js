/* maps.bucklerfamily.estate — Tŷ Mawr title map 1877–1987 · v1.0.0 · Sion's Tab agent
   Our case, prospective. Not a finding of any court. */
(function(){
"use strict";
var $=function(id){return document.getElementById(id)};
var moved=false,allB=null,D,G,map,overlay=null,curBase=null,layers={},labelsOn=true,mode='case',idx=0,playing=false,muted=false,timer=null;
var esc=function(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
var BASES={'1878':'OS six-inch, surveyed 1878–79','1900':'OS 25-inch, revised 1898 (pub. 1900)','1920':'OS 25-inch, revised 1915 (pub. 1920)','1947':'OS 25-inch, revised 1941 (pub. 1947)','aerial':"Today's aerial (Esri World Imagery)"};
var voice=$('voice');
// Cedwyn Estate shell (basecamp.js) puts its bar and location strip at the top of the page: start the app below them.
function shellH(){var m=0;document.querySelectorAll('.ghf-ui').forEach(function(e){if(e.matches('nav.ghf-bc,.ghf-lf,.ghf-glow')||e.closest('#app'))return;var r=e.getBoundingClientRect();if(r.height>0&&r.top<140&&r.bottom<240&&r.width>window.innerWidth*0.5)m=Math.max(m,r.bottom)});var v=Math.round(m)+'px';if(document.documentElement.style.getPropertyValue('--shellH')!==v){document.documentElement.style.setProperty('--shellH',v);if(map)setTimeout(function(){map.invalidateSize();if(!moved&&allB)fit(allB)},60)}}
var shTicks=0,shI=setInterval(function(){shellH();if(++shTicks>20)clearInterval(shI)},400);window.addEventListener('resize',shellH);

try{muted=localStorage.getItem('maps-muted')==='1'}catch(e){}
Promise.all([fetch('data/story.json').then(function(r){return r.json()}),fetch('data/parcels.geojson').then(function(r){return r.json()})]).then(function(a){D=a[0];G=a[1];init()});

function srcList(keys){return (keys||[]).map(function(k){var s=D.sources[k];if(!s)return'';return '<li>'+(s.u?'<a href="'+esc(s.u)+'" target="_blank" rel="noopener">'+esc(s.t)+'</a>':esc(s.t))+'</li>'}).join('')}

function init(){
  map=L.map('map',{zoomControl:false,attributionControl:false,minZoom:14,maxZoom:20,zoomSnap:0.25,tap:true});
  
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:20,maxNativeZoom:19,attribution:'Aerial: Esri, Maxar, Earthstar Geographics, GIS User Community'}).addTo(map);
  // SVG hatch patterns
  map.whenReady(function(){});
  var all=L.geoJSON(G);allB=all.getBounds();fit(allB);map.on('dragstart',function(){moved=true});
  // patterns need the svg renderer root
  var svgR=L.svg({padding:0.5}).addTo(map);
  setTimeout(function(){makePatterns(svgR)},0);
  G.features.forEach(function(f){
    var lyr=L.geoJSON(f,{renderer:svgR,style:{weight:2,color:'#fff',fillOpacity:.45}}).addTo(map);
    lyr.on('click',function(e){var mh=map.getSize().y,ph=($('panel').getBoundingClientRect().height||0),side=window.innerWidth>window.innerHeight&&window.innerHeight<520;L.popup({maxWidth:290,maxHeight:Math.max(160,Math.round((side?mh:mh-ph)*0.62)),autoPanPaddingTopLeft:[10,64],autoPanPaddingBottomRight:[side?Math.min(window.innerWidth*.46,420)+10:10,side?10:ph+10]}).setLatLng(e.latlng).setContent(popup(f.properties.id)).openOn(map)});
    layers[f.properties.id]={lyr:lyr,f:f};
  });
  D.markers.forEach(function(m){
    var rec=m.kind==='recollection';
    var cm=L.circleMarker([m.lat,m.lon],{radius:rec?7:6,color:rec?'#ffd27a':'#fff',weight:2,dashArray:rec?'3 3':null,fillColor:rec?'#ffb020':(m.kind==='feature'?'#5fb7ff':'#e9e2d0'),fillOpacity:.9});
    cm.bindPopup('<div class="pp"><h3>'+esc(m.label)+'</h3><div>'+esc(m.text)+'</div>'+(rec?'<div class="tag recon">family recollection, 1988</div>':'')+'<div class="k" style="margin-top:6px">Sources</div><ul style="margin:2px 0;padding-left:16px">'+srcList(m.src)+'</ul></div>');
    if(rec) cm.bindTooltip(esc(m.label),{permanent:true,direction:'right',className:'lbl',offset:[6,0]});
    m._l=cm;
  });
  // slider + ticks
  var s=$('slider');s.max=D.steps.length-1;
  var ticks=$('ticks'),years=[1877,1900,1939,1955,1970,1987.5,1994];
  D.steps.forEach(function(st,i){ if(['1877','1916','1939','1955','1970','1983','1988'].indexOf(st.id)>=0){var sp=document.createElement('span');sp.style.left=(i/(D.steps.length-1)*100)+'%';sp.textContent=st.id.slice(0,4);ticks.appendChild(sp)} });
  s.addEventListener('input',function(){go(+s.value,true)});
  $('bPrev').onclick=function(){stopPlay();go(Math.max(0,idx-1),true)};
  $('bNext').onclick=function(){stopPlay();go(Math.min(D.steps.length-1,idx+1),true)};
  $('bPlay').onclick=function(){playing?stopPlay():startPlay()};
  $('mCase').onclick=function(){setMode('case')};$('mRec').onclick=function(){setMode('rec')};
  $('bMute').onclick=function(){muted=!muted;try{localStorage.setItem('maps-muted',muted?'1':'0')}catch(e){};updMute();if(muted){voice.pause();if(window.speechSynthesis)speechSynthesis.cancel();if(playing)schedule()}else if(playing){speak()}};
  $('bFull').onclick=toggleFull;$('rFull').onclick=function(){toggleFull();hideRotate(true)};$('rSkip').onclick=function(){hideRotate(true)};
  $('bLayers').onclick=function(){$('layers').classList.toggle('hidden')};
  $('bInfo').onclick=function(){$('about').classList.remove('hidden')};$('aClose').onclick=function(){$('about').classList.add('hidden')};
  $('about').addEventListener('click',function(e){if(e.target.id==='about')$('about').classList.add('hidden')});
  $('bCollapse').onclick=function(){var p=$('panel');p.classList.toggle('collapsed');$('bCollapse').textContent=p.classList.contains('collapsed')?'▴':'▾'};
  $('fade').addEventListener('input',function(){if(overlay)overlay.setOpacity(this.value/100)});
  $('showLabels').addEventListener('change',function(){labelsOn=this.checked;render()});
  voice.addEventListener('ended',function(){if(playing)timer=setTimeout(nextAuto,1200)});
  voice.addEventListener('error',function(){if(playing&&!muted)webSpeech()});
  document.addEventListener('keydown',function(e){if(e.target.tagName==='INPUT')return;if(e.key==='ArrowRight')$('bNext').click();if(e.key==='ArrowLeft')$('bPrev').click();if(e.key===' '){e.preventDefault();$('bPlay').click()}});
  updMute();checkRotate();window.addEventListener('resize',checkRotate);
  var h=location.hash.match(/step=([\w]+)/),start=0;if(h){D.steps.forEach(function(st,i){if(st.id===h[1])start=i})}
  go(start,false);
}
function fit(b){map.fitBounds(b.pad(window.innerWidth<600?0.12:0.25),{paddingTopLeft:[0,60],paddingBottomRight:[window.innerWidth>window.innerHeight&&window.innerHeight<520?Math.min(window.innerWidth*.46,420):0,window.innerHeight<520?0:Math.min(window.innerHeight*.42,330)]})}
function makePatterns(r){
  var svg=r._container;if(!svg)return;var ns='http://www.w3.org/2000/svg';var defs=svg.querySelector('defs')||svg.insertBefore(document.createElementNS(ns,'defs'),svg.firstChild);
  Object.keys(D.holders).forEach(function(k){var c=D.holders[k][1];var p=document.createElementNS(ns,'pattern');p.setAttribute('id','h-'+k);p.setAttribute('patternUnits','userSpaceOnUse');p.setAttribute('width','9');p.setAttribute('height','9');p.setAttribute('patternTransform','rotate(45)');
    var bg=document.createElementNS(ns,'rect');bg.setAttribute('width','9');bg.setAttribute('height','9');bg.setAttribute('fill',c);bg.setAttribute('fill-opacity','0.18');p.appendChild(bg);
    var l=document.createElementNS(ns,'rect');l.setAttribute('width','3.5');l.setAttribute('height','9');l.setAttribute('fill',c);p.appendChild(l);defs.appendChild(p)});
  render();
}
function holderOf(st,id){var p=st.parcels[id];return p?(mode==='case'?p.case:p.rec):null}
function popup(id){
  var st=D.steps[idx],P=layers[id].f.properties,p=st.parcels[id]||{};var hr=D.holders[p.rec]||['—'],hc=D.holders[p.case]||['—'];
  var recon=P.recon||st.recon_all;
  return '<div class="pp"><h3>'+esc(P.name)+'</h3>'+
   '<div class="tag '+(recon?'recon':'traced')+'">'+(recon?'reconstruction / estimate':'traced from a source')+'</div> <span class="k">confidence: '+esc(st.recon_all&&!P.recon?'reconstruction (1877 plan missing)':P.confidence)+'</span>'+
   '<div style="margin-top:6px"><span class="k">At '+esc(st.date)+' — records held:</span> <b>'+esc(hr[0])+'</b></div>'+
   '<div><span class="k">Our case (prospective):</span> <b>'+esc(hc[0])+'</b></div>'+(p.note?'<div style="margin-top:4px">'+esc(p.note)+'</div>':'')+
   '<div style="margin-top:6px"><span class="k">Area:</span> '+esc(P.os)+'; this outline ≈'+P.traced_ac+' ac</div>'+
   '<div style="margin-top:4px" class="k">'+esc(P.conf_text)+'</div>'+
   '<div class="k" style="margin-top:6px">Sources</div><ul style="margin:2px 0;padding-left:16px">'+srcList(P.src)+'</ul></div>';
}
function render(){
  var st=D.steps[idx];if(!st)return;var used={};
  Object.keys(layers).forEach(function(id){
    var L_=layers[id],P=L_.f.properties,h=holderOf(st,id);var on=!!h;
    L_.lyr.eachLayer(function(l){
      if(!on){l.setStyle({opacity:0,fillOpacity:0});return}
      var c=(D.holders[h]||D.holders.unknown)[1];used[h]=1;var recon=P.recon||st.recon_all;
      var pend=(st.pend||[]).indexOf(id)>=0;if(st.one){l.setStyle({color:c,weight:0,dashArray:null,opacity:0,fillColor:c,fillOpacity:0.55})}else{l.setStyle({color:recon?(pend?c:'#fff'):c,weight:recon?(pend?2.5:2):3,dashArray:pend?'2 7':(recon?'6 5':(st.merged&&(id==='AM'||id==='B')?'1 6':null)),opacity:1,fillColor:recon?'url(#h-'+h+')':c,fillOpacity:recon?(pend?0.6:0.95):0.42})}
      l.unbindTooltip();
      if(labelsOn&&st.one&&id!=='B'){}else if(labelsOn&&st.one){l.bindTooltip('One parcel (reconstruction)',{permanent:true,direction:'center',className:'lbl'})}else if(labelsOn){var syn=(h==='woodp'||h==='greenp');var t=(h==='woodp'?'Woodland':h==='greenp'?'Green':P.short)+(syn?((st.pend||[]).indexOf(id)>=0?' · forming':' · from A'):(recon?' (est.)':''));if(st.merged&&id==='B'&&st.id!=='1990')t='WA231076 (amalgamated): B + house';if(st.merged&&id==='AM'&&st.id!=='1990')t='house parcel, merged 1987';l.bindTooltip(esc(t),{permanent:true,direction:'center',className:'lbl'})}
    });
  });
  var y=st.year;D.markers.forEach(function(m){var show=(m.kind==='recollection')?!!st.recollection:(y>=m.from_&&y<=m.to);if(show&&st.base==='aerial')show=false;if(show)m._l.addTo(map);else map.removeLayer(m._l)});
  var lg='<div class="k" style="color:var(--mut)">'+(mode==='case'?'Our case (prospective)':'Records held')+' at '+esc(st.date)+'</div>';
  Object.keys(used).forEach(function(k){lg+='<div><span class="sw" style="background:'+D.holders[k][1]+'"></span>'+esc(D.holders[k][0])+'</div>'});
  lg+='<div><span class="hatchkey"></span> reconstruction / estimate</div>';$('legend').innerHTML=lg;
}
function setBase(b){
  if(b===curBase)return;curBase=b;$('baseName').textContent=BASES[b]||b;
  if(overlay){map.removeLayer(overlay);overlay=null}
  if(b!=='aerial'&&D.overlays[b]){overlay=L.imageOverlay('img/os'+b+'.webp',D.overlays[b],{opacity:$('fade').value/100,attribution:'OS maps: National Library of Scotland (CC-BY)',interactive:false}).addTo(map);overlay.bringToBack()}
}
function go(i,user){
  idx=i;var st=D.steps[i];$('slider').value=i;setBase(st.base);
  $('cDate').textContent=st.date;$('cTitle').textContent=st.title;$('cText').textContent=st.short||st.text;var cm=$('cMore');if(cm){$('cLong').textContent=st.text;cm.style.display=(st.short&&st.short!==st.text)?'':'none'}
  $('cImg').innerHTML=st.img?'<a href="'+esc(st.img.src)+'" target="_blank" rel="noopener"><img src="'+esc(st.img.src)+'" alt="">'+esc(st.img.cap)+'</a>':'';
  $('cSrc').querySelector('ul').innerHTML=srcList(st.src);
  try{history.replaceState(null,'','#step='+st.id)}catch(e){}
  map.closePopup();render();
  if(playing){speak()}
}
function speak(){
  clearTimeout(timer);voice.pause();if(window.speechSynthesis)speechSynthesis.cancel();
  if(muted){schedule();return}
  var st=D.steps[idx];voice.src='audio/'+st.id+'.mp3';var pr=voice.play();if(pr&&pr.catch)pr.catch(function(){schedule()});
}
function webSpeech(){
  if(!window.speechSynthesis){schedule();return}
  var u=new SpeechSynthesisUtterance(D.steps[idx].say||D.steps[idx].text);u.lang='en-GB';u.rate=1;u.onend=function(){if(playing)timer=setTimeout(nextAuto,1000)};speechSynthesis.speak(u);
}
function schedule(){clearTimeout(timer);var st=D.steps[idx];timer=setTimeout(nextAuto,Math.max(6000,(st.dur||10)*1000+800))}
function nextAuto(){if(!playing)return;if(idx>=D.steps.length-1){stopPlay();return}go(idx+1,false)}
function startPlay(){playing=true;$('bPlay').textContent='❚❚';$('bPlay').classList.add('on');$('bPlay').setAttribute('aria-label','Pause');if(idx>=D.steps.length-1)go(0,false);else speak()}
function stopPlay(){playing=false;clearTimeout(timer);voice.pause();if(window.speechSynthesis)speechSynthesis.cancel();$('bPlay').textContent='▶';$('bPlay').classList.remove('on');$('bPlay').setAttribute('aria-label','Play the story')}
function setMode(m){mode=m;$('mCase').classList.toggle('on',m==='case');$('mRec').classList.toggle('on',m==='rec');$('mCase').setAttribute('aria-pressed',m==='case');$('mRec').setAttribute('aria-pressed',m==='rec');render()}
function updMute(){$('bMute').textContent=muted?'🔇':'🔊';$('bMute').setAttribute('aria-label',muted?'Unmute narration':'Mute narration')}
function toggleFull(){var d=document,el=d.documentElement;if(!d.fullscreenElement&&!d.webkitFullscreenElement){(el.requestFullscreen||el.webkitRequestFullscreen||function(){}).call(el);try{screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape').catch(function(){})}catch(e){}}else{(d.exitFullscreen||d.webkitExitFullscreen).call(d)}setTimeout(function(){map.invalidateSize()},400)}
var rotDismissed=false;try{rotDismissed=sessionStorage.getItem('maps-rot')==='1'}catch(e){}
function checkRotate(){var portrait=window.innerHeight>window.innerWidth&&window.innerWidth<600;$('rotate').classList.toggle('hidden',!(portrait&&!rotDismissed));if(map)map.invalidateSize()}
function hideRotate(remember){rotDismissed=true;try{sessionStorage.setItem('maps-rot','1')}catch(e){};$('rotate').classList.add('hidden')}
})();
