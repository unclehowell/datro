/* watchtower.bucklerfamily.estate v1.0.0 — Sion's Tab agent */
(function(){
var D=null,sel=document.getElementById('inst'),chart=document.getElementById('chart'),dlg=document.getElementById('dlg'),body=document.getElementById('dbody');
var types={removed:true,added:true,altered:true},farmOnly=false;
var COL={removed:'#e5484d',added:'#30a46c',altered:'#3e7bfa'};
var NS='http://www.w3.org/2000/svg';
function el(n,a,p){var e=document.createElementNS(NS,n);for(var k in a)e.setAttribute(k,a[k]);if(p)p.appendChild(e);return e}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function dt(s){return new Date(s+'T12:00:00Z')}
var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fmt(s){if(!s)return'';var d=dt(s);return d.getUTCDate()+' '+MON[d.getUTCMonth()]+' '+d.getUTCFullYear()}
function pageById(id){return D.pmap[id]}
function visible(c){return types[c.type]&&(!farmOnly||c.farm||(c.keywords&&c.keywords.length))}
function load(){
  fetch('data/changes.json?n='+Date.now()).then(function(r){return r.json()}).then(function(j){
    D=j;D.pmap={};D.pages.forEach(function(p){D.pmap[p.id]=p});D.imap={};D.institutions.forEach(function(i){D.imap[i.id]=i});
    D.institutions.slice().sort(function(a,b){return a.name.localeCompare(b.name)}).forEach(function(i){
      var o=document.createElement('option');o.value=i.id;o.textContent=i.name+' ('+i.n_changes+')';sel.appendChild(o)});
    var h=(location.hash||'').slice(1);if(h&&D.imap[h])sel.value=h;
    draw();
    var cm=/^c=(\w+)/.exec(h);if(cm){var c=D.changes.filter(function(x){return x.id===cm[1]})[0];if(c)open(c)}
  }).catch(function(){chart.textContent='The data could not be loaded.'});
}
function draw(){
  var inst=sel.value,cs=D.changes.filter(function(c){return(!inst||c.inst===inst)});
  ['removed','added','altered'].forEach(function(t){document.getElementById('n-'+t).textContent=cs.filter(function(c){return c.type===t&&(!farmOnly||c.farm||(c.keywords&&c.keywords.length))}).length});
  cs=cs.filter(visible);
  var rows,rowOf;
  if(!inst){
    var cnt={};cs.forEach(function(c){cnt[c.inst]=(cnt[c.inst]||0)+1});
    rows=Object.keys(cnt).sort(function(a,b){return cnt[b]-cnt[a]||D.imap[a].name.localeCompare(D.imap[b].name)}).map(function(id){return{id:id,label:D.imap[id].short}});
    rowOf=function(c){return c.inst};
  }else{
    var pc={};cs.forEach(function(c){pc[c.page]=(pc[c.page]||0)+1});
    rows=Object.keys(pc).sort(function(a,b){return pc[b]-pc[a]}).map(function(id){return{id:id,label:pageById(id).short}});
    rowOf=function(c){return c.page};
  }
  var W=Math.max(320,chart.clientWidth||360),narrow=W<560,LW=narrow?104:190,R=narrow?26:30,top=8,bot=30;
  var H=top+bot+Math.max(1,rows.length)*R;
  chart.innerHTML='';
  var svg=el('svg',{viewBox:'0 0 '+W+' '+H,width:W,height:H,role:'img'},chart);
  var x0=dt(D.window.from).getTime(),x1=dt(D.window.to).getTime()+864e5*3,X=function(s){return LW+8+(dt(s).getTime()-x0)/(x1-x0)*(W-LW-18)};
  // month ticks
  var d=new Date(x0);d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+1);var step=narrow?3:1,k=0;
  while(d.getTime()<x1){var xx=LW+8+(d.getTime()-x0)/(x1-x0)*(W-LW-18);
    el('line',{x1:xx,x2:xx,y1:top,y2:H-bot,'class':'grid'},svg);
    if(k%step===0){var t=el('text',{x:xx,y:H-bot+14,'text-anchor':'middle','class':'tick'},svg);t.textContent=MON[d.getUTCMonth()]+(d.getUTCMonth()===0||k===0?' '+String(d.getUTCFullYear()).slice(2):'')}
    d.setUTCMonth(d.getUTCMonth()+1);k++}
  if(!rows.length){var e=el('text',{x:W/2,y:top+R/2+4,'text-anchor':'middle','class':'empty'},svg);e.textContent='No changes match this view.';}
  rows.forEach(function(r,i){var y=top+i*R+R/2;
    el('line',{x1:LW,x2:W-6,y1:y,y2:y,'class':'row'},svg);
    var t=el('text',{x:LW-6,y:y+4,'text-anchor':'end','class':'lbl'},svg);t.textContent=r.label;
    var tt=el('title',{},t);tt.textContent=inst?pageById(r.id).url:D.imap[r.id].name;
    var mine=cs.filter(function(c){return rowOf(c)===r.id}).sort(function(a,b){return a.date<b.date?-1:1}),lastx=-99,lane=0;
    mine.forEach(function(c){var cx=X(c.date);if(cx-lastx<9){lane++}else{lane=0}lastx=cx;
      var cy=y+[0,-7,7,-12,12][lane%5];
      var g=el('g',{tabindex:0,role:'button','aria-label':c.type+' '+fmt(c.date)},svg);
      el('circle',{cx:cx,cy:cy,r:narrow?6:6.5,fill:COL[c.type],'class':'dot'},g);
      if(c.farm)el('circle',{cx:cx,cy:cy,r:narrow?9:9.5,'class':'ring'},g);
      el('circle',{cx:cx,cy:cy,r:13,'class':'hit'},g);
      g.addEventListener('click',function(){open(c)});g.addEventListener('keydown',function(ev){if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();open(c)}});
    });
  });
  var np=inst?D.pages.filter(function(p){return p.inst===inst}).length:D.pages.length;
  document.getElementById('meta').textContent=cs.length+' change'+(cs.length===1?'':'s')+' shown · '+np+' pages tracked'+(inst?' for '+D.imap[inst].name:' across '+D.institutions.length+' institutions')+' · '+fmt(D.window.from)+' to '+fmt(D.window.to)+' · checked '+fmt(D.generated.slice(0,10))+'. Gold ring: mentions the farm, Llandough or the family.';
}
function open(c){
  var p=pageById(c.page),i=D.imap[c.inst];
  var h='<h2>'+esc(i.name)+'</h2><p class="url">'+esc(p.title||'')+(p.title?'<br>':'')+esc(p.url)+'</p>';
  h+='<p><span class="tag '+c.type+'">'+c.type+'</span>'+(c.farm?'<span class="tag farm">farm / family</span>':'')+'<b>'+fmt(c.date)+'</b></p>';
  h+='<p>'+esc(c.summary)+'</p>';  if(c.why)h+='<p class="why"><b>'+(c.rel==='KEEP-AMBIGUOUS'?'Why kept':'Kept')+':</b> '+esc(c.why)+(c.rel==='KEEP-AMBIGUOUS'?' <a href="https://nomenclature.bucklerfamily.estate/" target="_blank" rel="noopener">Names in the records</a>':'')+'</p>';
  if(c.keywords&&c.keywords.length)h+='<p class="small">Words in the changed text: '+esc(c.keywords.join(', '))+'</p>';
  if(c.before){h+='<h3>Before'+(c.d1?' · '+fmt(c.d1):'')+'</h3><blockquote class="rem">'+esc(c.before)+'</blockquote>'}
  if(c.after){h+='<h3>After · '+fmt(c.date)+'</h3><blockquote class="add">'+esc(c.after)+'</blockquote>'}
  h+='<div class="links">';
  if(c.before_url)h+='<a href="'+esc(c.before_url)+'" target="_blank" rel="noopener">Archived before</a>';
  if(c.after_url&&c.after_url!==p.url)h+='<a href="'+esc(c.after_url)+'" target="_blank" rel="noopener">Archived after</a>';
  h+='<a href="'+esc(p.url)+'" target="_blank" rel="noopener">Live page</a></div>';
  if(p.first_seen&&p.first_seen.date)h+='<p class="small">Link first seen: '+esc(p.first_seen.label)+' · '+fmt(p.first_seen.date)+(p.first_seen.email_url?' · <a href="'+esc(p.first_seen.email_url)+'" target="_blank" rel="noopener">email</a>':'')+'</p>';
  if(p.wayback)h+='<p class="small">Our wayback copy: <a href="'+esc(p.wayback)+'" target="_blank" rel="noopener">'+esc(p.wayback)+'</a></p>';
  h+='<p class="small">Our case, prospective. Not a finding of any court.</p>';
  body.innerHTML=h;history.replaceState(null,'','#c='+c.id);
  if(dlg.showModal)dlg.showModal();else dlg.setAttribute('open','');
}
dlg.addEventListener('close',function(){history.replaceState(null,'',location.pathname+(sel.value?'#'+sel.value:''))});
dlg.addEventListener('click',function(e){if(e.target===dlg)dlg.close()});
function info(){
  var inst=sel.value,ps=D.pages.filter(function(p){return!inst||p.inst===inst});
  var h='<h2>About Watchtower</h2><p>Every institution web link found in the case emails received, plus institution pages that mention Llandough, Great House Farm or Tŷ Mawr. Each page is compared against the Internet Archive (Wayback Machine) for the last 13 months and against the live page today.</p>';
  h+='<p class="small">'+esc(D.method)+'</p><p class="small">Red: text removed, or the page is no longer served (404 or redirected away). Green: text added. Blue: text changed. A gold ring marks a change whose text mentions the farm, Llandough or the family. "Farm &amp; records" also keeps changes that mention records, retention, FOI or archives.</p>';
  h+='<h3>Pages tracked'+(inst?' · '+esc(D.imap[inst].name):'')+' ('+ps.length+')</h3><table><tr><th>Page</th><th>Archive copies</th><th>Live</th></tr>';
  ps.forEach(function(p){h+='<tr><td><a href="'+esc(p.url)+'" target="_blank" rel="noopener">'+esc(p.short)+'</a><div class="small">'+esc(D.imap[p.inst].short)+(p.kind==='home'?' · homepage (availability only)':'')+'</div></td><td>'+(p.captures||p.baseline?(p.captures+(p.baseline?' + 1 older':'')):'none')+'</td><td>'+esc(p.live_label||'')+'</td></tr>'});
  h+='</table>'+(D.filter?'<p class="small">'+esc(D.filter.rule)+' '+D.filter.excluded_pages+' unrelated pages ('+D.filter.excluded_changes+' changes) were moved out; they are kept on file, not deleted. <a href="'+esc(D.filter.lexicon)+'" target="_blank" rel="noopener">The names in the records</a>.</p>':'')+'<p class="small">Data: <a href="data/changes.json">changes.json</a>. Re-checked daily at midday.</p><p class="small">Our case, prospective. Not a finding of any court.</p>';
  body.innerHTML=h;if(dlg.showModal)dlg.showModal();else dlg.setAttribute('open','');
}
document.getElementById('info').addEventListener('click',info);
sel.addEventListener('change',function(){history.replaceState(null,'',sel.value?'#'+sel.value:location.pathname);draw()});
[].forEach.call(document.querySelectorAll('.chip[data-t]'),function(b){b.addEventListener('click',function(){var t=b.getAttribute('data-t');types[t]=!types[t];b.classList.toggle('on',types[t]);b.setAttribute('aria-pressed',types[t]);draw()})});
var fb=document.getElementById('farm');fb.addEventListener('click',function(){farmOnly=!farmOnly;fb.classList.toggle('on',farmOnly);fb.setAttribute('aria-pressed',farmOnly);draw()});
var rt;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){if(D)draw()},150)});
load();
})();
