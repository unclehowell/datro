/* watchtower.bucklerfamily.estate v3 — institution page changes about Great House Farm, from the Internet Archive — Sion's Tab agent */
(function(){
var D=null,sel=document.getElementById('inst'),chart=document.getElementById('chart'),dlg=document.getElementById('dlg'),body=document.getElementById('dbody');
var COL={appeared:'#f2c94c',added:'#30a46c',removed:'#e5484d',altered:'#3e7bfa',gone:'#e5484d'};
var LAB={appeared:'Page appeared',added:'Text added',removed:'Text removed',altered:'Text changed',gone:'Page gone'};
var NS='http://www.w3.org/2000/svg';
function el(n,a,p){var e=document.createElementNS(NS,n);for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function dt(s){return new Date(s.slice(0,10)+'T12:00:00Z')}
var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fmt(s){if(!s)return'';var d=dt(s);return d.getUTCDate()+' '+MON[d.getUTCMonth()]+' '+d.getUTCFullYear()}
/* year-weighted time scale: years with changes get more width, empty years stay visible */
function scale(from,to,counts,x0,x1){
  var y0=+from.slice(0,4),y1=+to.slice(0,4),segs=[],tot=0;
  for(var y=y0;y<=y1;y++){var n=counts[y]||0,w=n?2+Math.log(1+n)/Math.LN2:0.6;segs.push({y:y,w:w});tot+=w}
  var acc=x0;segs.forEach(function(s){s.a=acc;s.b=acc+s.w/tot*(x1-x0);acc=s.b});
  function X(s){var d=dt(s),y=d.getUTCFullYear(),g=null;for(var i=0;i<segs.length;i++)if(segs[i].y===y){g=segs[i];break}
    if(!g)return y<y0?x0:x1;var st=Date.UTC(y,0,1),en=Date.UTC(y+1,0,1);return g.a+Math.min(1,(d-st)/(en-st))*(g.b-g.a)}
  X.segs=segs;return X}
function draw(){
  var f=sel.value,pts=D.changes.filter(function(c){return !f||c.inst===f});
  var cnt={};pts.forEach(function(c){cnt[c.inst]=(cnt[c.inst]||0)+1});
  var rows=D.institutions.filter(function(i){return cnt[i.id]}).map(function(i){return{id:i.id,label:i.short,title:i.name}});
  var W=Math.max(320,chart.clientWidth||360),narrow=W<560,LW=narrow?92:170,R=narrow?26:28,top=6,bot=26;
  var H=top+bot+Math.max(1,rows.length)*R;chart.innerHTML='';
  var svg=el('svg',{viewBox:'0 0 '+W+' '+H,width:W,height:H,role:'img','aria-label':'Scatter graph of page changes by date and institution'},chart);
  var yc={};D.changes.forEach(function(c){var y=c.date.slice(0,4);yc[y]=(yc[y]||0)+1});
  var X=scale(D.window.from,D.window.to,yc,LW+8,W-10);
  X.segs.forEach(function(s){el('line',{x1:s.a,x2:s.a,y1:top,y2:H-bot,'class':'grid'},svg);var wd=s.b-s.a;var t=el('text',{x:(s.a+s.b)/2,y:H-bot+15,'text-anchor':'middle','class':'tick'},svg);t.textContent=wd>30?String(s.y):(wd>15?"'"+String(s.y).slice(2):'')});
  rows.forEach(function(r,i){var y=top+i*R+R/2;
    el('line',{x1:LW,x2:W-6,y1:y,y2:y,'class':'row'},svg);
    var t=el('text',{x:LW-6,y:y+4,'text-anchor':'end','class':'lbl'},svg);var mx=narrow?14:24;t.textContent=r.label.length>mx?r.label.slice(0,mx-1)+'…':r.label;el('title',{},t).textContent=r.title;
    var mine=pts.filter(function(c){return c.inst===r.id}).sort(function(a,b){return a.date<b.date?-1:1}),lastx=-99,lane=0;
    mine.forEach(function(c){var cx=X(c.date);if(cx-lastx<7)lane++;else lane=0;lastx=cx;var cy=y+[0,-6,6,-9,9][lane%5];
      var g=el('g',{tabindex:0,role:'button','aria-label':LAB[c.type]+', '+fmt(c.date)},svg);
      if(c.type==='gone')el('circle',{cx:cx,cy:cy,r:4.5,fill:'none',stroke:COL.gone,'stroke-width':2,'class':'dot'},g);
      else el('circle',{cx:cx,cy:cy,r:5.5,fill:COL[c.type],'class':'dot'},g);
      el('circle',{cx:cx,cy:cy,r:12,'class':'hit'},g);
      g.addEventListener('click',function(){open(c)});g.addEventListener('keydown',function(ev){if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();open(c)}});
    });
  });
  [].forEach.call(document.querySelectorAll('ol.list li'),function(li){li.hidden=!!f&&li.getAttribute('data-inst')!==f});
}
function open(c){
  var p=D.pmap[c.page]||{},i=D.imap[c.inst]||{};
  var h='<h3>'+esc(p.title||p.url)+'</h3><p class="url">'+esc(i.name)+' · <a href="'+esc(p.url)+'" rel="noopener" target="_blank">'+esc(p.url)+'</a></p>';
  h+='<p><span class="tag '+c.type+'">'+LAB[c.type]+'</span> '+(c.d1?fmt(c.d1)+' → ':'')+fmt(c.date)+'</p><p class="what">'+esc(c.summary)+'</p>';
  (c.rem||[]).forEach(function(t){h+='<span class="q rem">− '+esc(t)+'</span>'});
  (c.add||[]).forEach(function(t){h+='<span class="q add">+ '+esc(t)+'</span>'});
  h+='<p class="url">Archive captures of this page: '+(p.captures||0)+' ('+fmt(p.first)+' to '+fmt(p.last)+')</p>';
  h+='<div class="ba">'+(c.before_url?'<a href="'+esc(c.before_url)+'" rel="noopener" target="_blank">Before · '+fmt(c.d1)+'</a>':'')+'<a href="'+esc(c.after_url)+'" rel="noopener" target="_blank">'+(c.type==='gone'?'Gone · ':'After · ')+fmt(c.date)+'</a></div>';
  body.innerHTML=h;history.replaceState(null,'','#c='+c.id);
  if(dlg.showModal)dlg.showModal();else dlg.setAttribute('open','');
}
dlg.addEventListener('close',function(){history.replaceState(null,'',location.pathname)});
dlg.addEventListener('click',function(e){if(e.target===dlg)dlg.close()});
fetch('data/changes.json?n='+Date.now()).then(function(r){return r.json()}).then(function(d){
  D=d;D.pmap={};D.pages.forEach(function(p){D.pmap[p.id]=p});D.imap={};D.institutions.forEach(function(i){D.imap[i.id]=i});
  D.institutions.forEach(function(i){var o=document.createElement('option');o.value=i.id;o.textContent=i.name+' ('+i.n_changes+')';sel.appendChild(o)});
  sel.addEventListener('change',draw);var rt;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(draw,150)});
  draw();var m=/^#c=(\w+)/.exec(location.hash);if(m){var c=D.changes.filter(function(x){return x.id===m[1]})[0];if(c)open(c)}
}).catch(function(){chart.textContent=''});
})();
