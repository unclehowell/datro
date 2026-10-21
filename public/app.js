/* watchtower.bucklerfamily.estate v2.0.0 — contacts since 2016 + page changes — Sion's Tab agent */
(function(){
var D=null,C=null,mode='contacts',sel=document.getElementById('inst'),chart=document.getElementById('chart'),dlg=document.getElementById('dlg'),body=document.getElementById('dbody'),legend=document.getElementById('legend');
var types={removed:true,added:true,altered:true},farmOnly=false,clsOn={};
var COL={removed:'#e5484d',added:'#30a46c',altered:'#3e7bfa'};
var NS='http://www.w3.org/2000/svg';
function el(n,a,p){var e=document.createElementNS(NS,n);for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function dt(s){return new Date(s.slice(0,10)+'T12:00:00Z')}
var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fmt(s){if(!s)return'';var d=dt(s);return d.getUTCDate()+' '+MON[d.getUTCMonth()]+' '+d.getUTCFullYear()}
/* year-weighted time scale: busy years get more width, quiet years stay visible */
function scale(from,to,counts,x0,x1){
  var y0=+from.slice(0,4),y1=+to.slice(0,4),segs=[],tot=0;
  for(var y=y0;y<=y1;y++){var n=counts[y]||0,w=n?2+Math.log(1+n)/Math.LN2*1.2:0.7;if(y===y1){var f=(dt(to)-Date.UTC(y,0,1))/(Date.UTC(y+1,0,1)-Date.UTC(y,0,1));w=Math.max(0.7,w*Math.max(f,0.5))}segs.push({y:y,w:w});tot+=w}
  var acc=x0;segs.forEach(function(s){s.a=acc;s.b=acc+s.w/tot*(x1-x0);acc=s.b});
  function X(s){var d=dt(s),y=d.getUTCFullYear(),g=null;for(var i=0;i<segs.length;i++)if(segs[i].y===y){g=segs[i];break}
    if(!g)return y<y0?x0:x1;var st=Date.UTC(y,0,1),en=(y===y1)?dt(to).getTime()+864e5*3:Date.UTC(y+1,0,1);return g.a+Math.min(1,(d-st)/(en-st))*(g.b-g.a)}
  X.segs=segs;return X}
function axis(svg,X,top,H,bot,narrow){
  X.segs.forEach(function(s,i){el('line',{x1:s.a,x2:s.a,y1:top,y2:H-bot,'class':'grid yr'},svg);
    var wide=s.b-s.a;var t=el('text',{x:(s.a+s.b)/2,y:H-bot+14,'text-anchor':'middle','class':'tick'},svg);t.textContent=wide>34?String(s.y):(wide>18?"'"+String(s.y).slice(2):'');
    if(wide>140){for(var m=1;m<12;m++){var mx=s.a+(Date.UTC(s.y,m,1)-Date.UTC(s.y,0,1))/(Date.UTC(s.y+1,0,1)-Date.UTC(s.y,0,1))*(s.b-s.a);if(mx>s.b-4)break;el('line',{x1:mx,x2:mx,y1:top,y2:H-bot,'class':'grid'},svg);
      if(wide>(narrow?300:240)&&m%(narrow?3:2)===0){var mt=el('text',{x:mx,y:H-bot+26,'text-anchor':'middle','class':'tick sm'},svg);mt.textContent=MON[m]}}}});
}
function load(){
  Promise.all([fetch('data/contacts.json?n='+Date.now()).then(function(r){return r.json()}),fetch('data/changes.json?n='+Date.now()).then(function(r){return r.json()})]).then(function(a){
    C=a[0];D=a[1];
    C.pmap={};C.parties.forEach(function(p){C.pmap[p.id]=p});C.cmap={};C.classes.forEach(function(c){C.cmap[c.id]=c;clsOn[c.id]=true});C.tmap={};C.items.forEach(function(i){if(i.thread)(C.tmap[i.thread]=C.tmap[i.thread]||[]).push(i)});
    D.pmap={};D.pages.forEach(function(p){D.pmap[p.id]=p});D.imap={};D.institutions.forEach(function(i){D.imap[i.id]=i});
    var h=(location.hash||'').slice(1);if(/^(c=|changes)/.test(h)||(h&&D.imap[h]))mode='changes';
    setMode(mode,true);
    var cm=/^c=(\w+)/.exec(h);if(cm){var c=D.changes.filter(function(x){return x.id===cm[1]})[0];if(c)openChange(c)}
    var im=/^i=(.+)$/.exec(h);if(im){var it=C.items.filter(function(x){return x.id===decodeURIComponent(im[1])})[0];if(it)openItem(it)}
  }).catch(function(e){chart.textContent='The data could not be loaded.'});
}
function setMode(m,first){
  mode=m;[].forEach.call(document.querySelectorAll('.seg button'),function(b){var on=b.getAttribute('data-m')===m;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)});
  sel.innerHTML='';var o0=document.createElement('option');o0.value='';o0.textContent=m==='contacts'?'All bodies and channels':'All institutions';sel.appendChild(o0);
  if(m==='contacts'){C.parties.slice().sort(function(a,b){return a.name.localeCompare(b.name)}).forEach(function(p){var o=document.createElement('option');o.value=p.id;o.textContent=p.name+' ('+p.n+')';sel.appendChild(o)})}
  else{D.institutions.slice().sort(function(a,b){return a.name.localeCompare(b.name)}).forEach(function(i){var o=document.createElement('option');o.value=i.id;o.textContent=i.name+' ('+i.n_changes+')';sel.appendChild(o)})}
  var h=(location.hash||'').slice(1);if(!first)history.replaceState(null,'',location.pathname+(m==='changes'?'#changes':''));else if(m==='changes'&&D.imap[h])sel.value=h;
  buildLegend();draw();
}
function buildLegend(){
  legend.innerHTML='';var sm=document.getElementById('keysum');
  if(mode==='contacts'){
    C.classes.forEach(function(c){var b=document.createElement('button');b.type='button';b.className='chip'+(clsOn[c.id]?' on':'');b.setAttribute('aria-pressed',!!clsOn[c.id]);
      b.innerHTML='<i class="d'+(c.id==='raised'?' o':'')+(c.id==='no reply'?' nr':'')+'" style="'+(c.id==='raised'?'border-color:'+c.color:(c.id==='no reply'?'':'background:'+c.color))+'"></i>'+esc(c.label)+' <b data-c="'+esc(c.id)+'"></b>';
      b.addEventListener('click',function(){clsOn[c.id]=!clsOn[c.id];b.classList.toggle('on',clsOn[c.id]);b.setAttribute('aria-pressed',clsOn[c.id]);draw()});legend.appendChild(b)});
  }else{
    [['removed','r','Removed'],['added','g','Added'],['altered','b','Altered']].forEach(function(t){var b=document.createElement('button');b.type='button';b.className='chip'+(types[t[0]]?' on':'');b.innerHTML='<i class="d '+t[1]+'"></i>'+t[2]+' <b id="n-'+t[0]+'"></b>';
      b.addEventListener('click',function(){types[t[0]]=!types[t[0]];b.classList.toggle('on',types[t[0]]);draw()});legend.appendChild(b)});
    var f=document.createElement('button');f.type='button';f.className='chip'+(farmOnly?' on':'');f.innerHTML='<i class="d f"></i>Farm &amp; records';f.addEventListener('click',function(){farmOnly=!farmOnly;f.classList.toggle('on',farmOnly);draw()});legend.appendChild(f);
  }
}
function frame(rows){
  var W=Math.max(320,chart.clientWidth||360),narrow=W<560,LW=narrow?96:180,R=narrow?24:28,top=8,bot=34;
  var H=top+bot+Math.max(1,rows.length)*R;chart.innerHTML='';
  var svg=el('svg',{viewBox:'0 0 '+W+' '+H,width:W,height:H,role:'img'},chart);
  return {svg:svg,W:W,H:H,LW:LW,R:R,top:top,bot:bot,narrow:narrow};
}
function rowsDraw(f,rows,X,pts,rowOf,mk){
  if(!rows.length){var e=el('text',{x:f.W/2,y:f.top+f.R/2+4,'text-anchor':'middle','class':'empty'},f.svg);e.textContent='Nothing matches this view.'}
  rows.forEach(function(r,i){var y=f.top+i*f.R+f.R/2;
    el('line',{x1:f.LW,x2:f.W-6,y1:y,y2:y,'class':'row'},f.svg);
    var t=el('text',{x:f.LW-6,y:y+4,'text-anchor':'end','class':'lbl'},f.svg);var mx=f.narrow?15:26;t.textContent=r.label.length>mx?r.label.slice(0,mx-1)+'…':r.label;var tt=el('title',{},t);tt.textContent=r.title||r.label;
    var mine=pts.filter(function(c){return rowOf(c)===r.id}).sort(function(a,b){return a.date<b.date?-1:1}),lastx=-99,lane=0;
    mine.forEach(function(c){var cx=X(c.date);if(cx-lastx<7){lane++}else{lane=0}lastx=cx;var cy=y+[0,-6,6,-10,10][lane%5];mk(c,cx,cy)});
  });
}
function draw(){ if(mode==='contacts')drawContacts();else drawChanges(); }
function drawContacts(){
  var p=sel.value,its=C.items.filter(function(i){return !p||i.party===p});
  C.classes.forEach(function(c){var n=c.id==='no reply'?its.filter(function(i){return i.unanswered}).length:its.filter(function(i){return i.cls===c.id}).length;var b=legend.querySelector('b[data-c="'+c.id+'"]');if(b)b.textContent=n});
  var vis=its.filter(function(i){return clsOn[i.cls]||(i.unanswered&&clsOn['no reply'])});
  var cnt={};vis.forEach(function(i){cnt[i.party]=(cnt[i.party]||0)+1});
  var rows=Object.keys(cnt).sort(function(a,b){return C.pmap[a].first<C.pmap[b].first?-1:C.pmap[a].first>C.pmap[b].first?1:cnt[b]-cnt[a]}).map(function(id){return{id:id,label:C.pmap[id].short,title:C.pmap[id].name}});
  var f=frame(rows),yc={};C.items.forEach(function(i){var y=i.date.slice(0,4);yc[y]=(yc[y]||0)+1});
  var X=scale(C.window.from,C.window.to,yc,f.LW+8,f.W-10);axis(f.svg,X,f.top,f.H,f.bot,f.narrow);
  var rr=f.narrow?5:5.5;
  rowsDraw(f,rows,X,vis,function(i){return i.party},function(i,cx,cy){
    var g=el('g',{tabindex:0,role:'button','aria-label':(C.cmap[i.cls]||{}).label+' '+fmt(i.date)},f.svg);
    var c=C.cmap[i.cls]||C.cmap['other reply'];
    if(clsOn[i.cls]){if(i.cls==='raised')el('circle',{cx:cx,cy:cy,r:rr,fill:'none',stroke:c.color,'stroke-width':2,'class':'dot'},g);else el('circle',{cx:cx,cy:cy,r:rr,fill:c.color,'class':'dot'},g)}
    if(i.unanswered&&clsOn['no reply'])el('circle',{cx:cx,cy:cy,r:rr+3.5,'class':'nr'},g);
    if(i.date<'2025-01-01')el('circle',{cx:cx,cy:cy,r:rr+6,'class':'early'},g);
    el('circle',{cx:cx,cy:cy,r:12,'class':'hit'},g);
    g.addEventListener('click',function(){openItem(i)});g.addEventListener('keydown',function(ev){if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();openItem(i)}});
  });
  var raised=its.filter(function(i){return i.cls==='raised'}).length,rep=its.filter(function(i){return i.dir==='reply'}).length,un=its.filter(function(i){return i.unanswered}).length;
  var first=its.length?its[0].date:null;
  document.getElementById('meta').textContent=raised+' raised · '+rep+' replies · '+un+' with no reply on record'+(p?' · '+C.pmap[p].name:' · '+C.parties.length+' bodies and channels')+(first?' · '+fmt(first)+' to '+fmt(C.window.to):'')+'. Wide rings: before 2025. Busy years are drawn wider.';
}
function drawChanges(){
  var inst=sel.value,cs=D.changes.filter(function(c){return(!inst||c.inst===inst)});
  ['removed','added','altered'].forEach(function(t){var e=document.getElementById('n-'+t);if(e)e.textContent=cs.filter(function(c){return c.type===t&&(!farmOnly||c.farm||(c.keywords&&c.keywords.length))}).length});
  cs=cs.filter(function(c){return types[c.type]&&(!farmOnly||c.farm||(c.keywords&&c.keywords.length))});
  var rows,rowOf;
  if(!inst){var cnt={};cs.forEach(function(c){cnt[c.inst]=(cnt[c.inst]||0)+1});rows=Object.keys(cnt).sort(function(a,b){return cnt[b]-cnt[a]||D.imap[a].name.localeCompare(D.imap[b].name)}).map(function(id){return{id:id,label:D.imap[id].short,title:D.imap[id].name}});rowOf=function(c){return c.inst}}
  else{var pc={};cs.forEach(function(c){pc[c.page]=(pc[c.page]||0)+1});rows=Object.keys(pc).sort(function(a,b){return pc[b]-pc[a]}).map(function(id){return{id:id,label:D.pmap[id].short,title:D.pmap[id].url}});rowOf=function(c){return c.page}}
  var f=frame(rows),yc={};D.changes.forEach(function(c){var y=c.date.slice(0,4);yc[y]=(yc[y]||0)+1});
  var X=scale(D.window.from,D.window.to,yc,f.LW+8,f.W-10);axis(f.svg,X,f.top,f.H,f.bot,f.narrow);
  rowsDraw(f,rows,X,cs,rowOf,function(c,cx,cy){var g=el('g',{tabindex:0,role:'button','aria-label':c.type+' '+fmt(c.date)},f.svg);
    el('circle',{cx:cx,cy:cy,r:f.narrow?5:5.5,fill:COL[c.type],'class':'dot'+(c.yearly?' yearly':'')},g);if(c.farm)el('circle',{cx:cx,cy:cy,r:9,'class':'ring'},g);el('circle',{cx:cx,cy:cy,r:12,'class':'hit'},g);
    g.addEventListener('click',function(){openChange(c)});g.addEventListener('keydown',function(ev){if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();openChange(c)}})});
  var np=inst?D.pages.filter(function(p){return p.inst===inst}).length:D.pages.length;
  document.getElementById('meta').textContent=cs.length+' change'+(cs.length===1?'':'s')+' shown · '+np+' pages tracked · '+fmt(D.window.from)+' to '+fmt(D.window.to)+' · checked '+fmt(D.generated.slice(0,10))+'. Faded dots before Sep 2025: the archive copies for that year differ (one dot per page per year). Gold ring: mentions the farm, Llandough or the family.';
}
function show(h,hash){body.innerHTML=h;if(hash)history.replaceState(null,'','#'+hash);if(dlg.showModal)dlg.showModal();else dlg.setAttribute('open','')}
function openItem(i){
  var p=C.pmap[i.party],c=C.cmap[i.cls]||{};
  var h='<h2>'+esc(p.name)+'</h2><p><span class="tag" style="'+(i.cls==='raised'?'border:2px solid '+c.color:'background:'+c.color+';color:#fff')+'">'+esc(c.label||i.cls)+'</span>'+(i.unanswered?'<span class="tag nr">no reply on record</span>':'')+'<b>'+fmt(i.date)+'</b> · '+esc(i.ch)+'</p>';
  h+='<p class="ttl">'+esc(i.title)+'</p>';if(i.summary)h+='<p>'+esc(i.summary)+'</p>';if(i.note)h+='<p class="small">'+esc(i.note)+'</p>';
  if(i.comments!=null)h+='<p class="small">Public comments on the post: '+esc(i.comments)+'</p>';
  var tl=i.thread&&C.tmap[i.thread];if(tl&&tl.length>1){h+='<h3>This thread ('+tl.length+')</h3><ol class="tl">';tl.forEach(function(x){var cc=C.cmap[x.cls]||{};h+='<li'+(x===i?' class="cur"':'')+'><i class="d'+(x.cls==='raised'?' o':'')+'" style="'+(x.cls==='raised'?'border-color:'+cc.color:'background:'+cc.color)+'"></i>'+fmt(x.date)+' · '+esc(cc.label||x.cls)+'</li>'});h+='</ol>'}
  h+='<div class="links">';if(i.src)h+='<a href="'+esc(i.src)+'" target="_blank" rel="noopener">Source</a>';if(i.wb)h+='<a href="'+esc(i.wb)+'" target="_blank" rel="noopener">Wayback copy</a>';if(i.site)h+='<a href="'+esc(i.site)+'" target="_blank" rel="noopener">Thread view</a>';h+='</div>';
  h+='<p class="small">Reply types are sorted by the words in each reply; the source is the record.</p>';
  show(h,'i='+encodeURIComponent(i.id));
}
function openChange(c){
  var p=D.pmap[c.page],i=D.imap[c.inst];
  var h='<h2>'+esc(i.name)+'</h2><p class="url">'+esc(p.url)+'</p><p><span class="tag '+c.type+'">'+c.type+'</span>'+(c.farm?'<span class="tag farm">farm / family</span>':'')+'<b>'+(c.yearly?'during '+c.date.slice(0,4):fmt(c.date))+'</b></p><p>'+esc(c.summary)+'</p>';
  if(c.why)h+='<p class="why"><b>'+(c.rel==='KEEP-AMBIGUOUS'?'Why kept':'Kept')+':</b> '+esc(c.why)+'</p>';
  if(c.keywords&&c.keywords.length)h+='<p class="small">Words in the changed text: '+esc(c.keywords.join(', '))+'</p>';
  if(c.before){h+='<h3>Before'+(c.d1?' · '+fmt(c.d1):'')+'</h3><blockquote class="rem">'+esc(c.before)+'</blockquote>'}
  if(c.after){h+='<h3>After · '+fmt(c.date)+'</h3><blockquote class="add">'+esc(c.after)+'</blockquote>'}
  h+='<div class="links">';if(c.before_url)h+='<a href="'+esc(c.before_url)+'" target="_blank" rel="noopener">Archived before</a>';if(c.after_url&&c.after_url!==p.url)h+='<a href="'+esc(c.after_url)+'" target="_blank" rel="noopener">Archived after</a>';h+='<a href="'+esc(p.url)+'" target="_blank" rel="noopener">Live page</a></div>';
  if(p.wayback)h+='<p class="small">Our wayback copy: <a href="'+esc(p.wayback)+'" target="_blank" rel="noopener">'+esc(p.wayback)+'</a></p>';
  h+='';show(h,'c='+c.id);
}
dlg.addEventListener('close',function(){history.replaceState(null,'',location.pathname+(mode==='changes'?'#changes':''))});
dlg.addEventListener('click',function(e){if(e.target===dlg)dlg.close()});
function info(){
  var h='<h2>About Watchtower</h2>';
  if(mode==='contacts'){h+='<p>'+esc(C.method)+'</p><p class="small">Hollow gold: raised. Filled: a reply, coloured by type. Dashed ring: no reply in the thread within 28 days. Wide faint ring: before 2025. Tap a dot for the thread and the source.</p><h3>By year</h3><table><tr><th>Year</th><th>Items</th></tr>';
    Object.keys(C.years).sort().forEach(function(y){h+='<tr><td>'+y+'</td><td>'+C.years[y]+'</td></tr>'});h+='</table><h3>Bodies and channels ('+C.parties.length+')</h3><table><tr><th>Body</th><th>First</th><th>Items</th></tr>';
    C.parties.forEach(function(p){h+='<tr><td>'+esc(p.name)+'</td><td>'+fmt(p.first)+'</td><td>'+p.n+'</td></tr>'});h+='</table><p class="small">Data: <a href="data/contacts.json">contacts.json</a>.</p>';}
  else{h+='<p>Every institution web link found in the case emails received, plus institution pages that mention Llandough, Great House Farm or Tŷ Mawr, compared against the Internet Archive and the live page.</p><p class="small">'+esc(D.method)+'</p><p class="small">Red: removed or no longer served. Green: added. Blue: changed. From 2016 to mid-2025 the archive index is read once per page per year: a faded dot means that year\'s archived copies differ; tap it for the copies.</p><p class="small">Data: <a href="data/changes.json">changes.json</a>. Re-checked daily at midday.</p>'}
  h+='';show(h);
}
document.getElementById('info').addEventListener('click',info);
sel.addEventListener('change',function(){draw()});
[].forEach.call(document.querySelectorAll('.seg button'),function(b){b.addEventListener('click',function(){setMode(b.getAttribute('data-m'))})});
var rt;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){if(D)draw()},150)});
load();
})();
