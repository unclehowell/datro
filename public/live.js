/* Watchtower live record checks: data/live.json (daily live read of each record) + watch uptime.json (every 5 min). */
(function(){
var box=document.getElementById('live-body'); if(!box) return;
function e(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function t(s){return s?s.slice(0,16).replace('T',' ')+' UTC':'';}
var uk=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',timeZoneName:'short'});
function b(s){if(!s)return '';var u='';try{u=uk.format(new Date(s));}catch(x){}return e(t(s))+'<br><small>'+e(u)+'</small>';}
var css=document.createElement('style');css.textContent='#live table{border-collapse:collapse;width:100%;font-size:13px}#live td,#live th{padding:4px 6px;border-top:1px solid rgba(128,128,128,.25);text-align:left;vertical-align:top}#live th{font-weight:600;opacity:.75}#live .dn td{color:#ff6b6b}#live small{opacity:.7}#live details{margin:8px 0}#live blockquote{margin:4px 0 4px 8px;padding-left:8px;border-left:3px solid rgba(128,128,128,.4);font-size:13px}#live .bef{border-color:#c0392b}#live .aft{border-color:#27ae60}';document.head.appendChild(css);
Promise.all([fetch('data/live.json?v='+Date.now()).then(function(r){return r.json();}).catch(function(){return null;}),
 fetch('https://watch.bucklerfamily.estate/uptime.json').then(function(r){return r.json();}).catch(function(){return null;})]).then(function(a){
 var L=a[0],U=a[1],h='';
 if(U&&U.checks){h+='<details open><summary>Up or down now</summary><table><tbody>'+U.checks.map(function(c){return '<tr class="'+(c.up===false?'dn':'')+'"><td>'+(c.up==null?'○':c.up?'● up':'✕ down')+'</td><td><a href="'+e(c.url)+'" rel="noopener">'+e(c.name)+'</a></td><td>'+e(c.status||'')+'</td><td>since '+b(c.since)+'</td></tr>';}).join('')+'</tbody></table><p><small>Checked every '+e(U.every_minutes)+' min · <a href="https://watch.bucklerfamily.estate/uptime">outage history</a></small></p></details>';}
 else h+='<p><a href="https://watch.bucklerfamily.estate/uptime">Up or down now</a></p>';
 if(L&&L.records){
  h+='<details><summary>Records ('+L.records.length+') · last read '+e(t(L.checked))+'</summary><table><thead><tr><th>Record</th><th>State</th><th>Baseline</th><th>Archived copy</th><th>Last change</th></tr></thead><tbody>'+L.records.map(function(r){return '<tr class="'+(r.state==='up'?'':'dn')+'"><td><a href="'+e(r.url)+'" rel="noopener">'+e(r.name)+'</a></td><td>'+e(r.state)+(r.status?' ('+e(r.status)+')':'')+'</td><td>'+e(r.baseline_source||'pending')+'</td><td>'+(r.archive?'<a href="'+e(r.archive.capture)+'" rel="noopener">'+e(t(r.archive.captured).slice(0,10))+'</a>'+(r.archive.source==='internet-archive'?' <small>(Internet Archive copy)</small>':'')+(r.state!=='up'?'<br><small>live page unreachable: showing archived capture</small>':''):'<small>none yet</small>')+'</td><td>'+(r.last_change?b(r.last_change):'none seen')+'</td></tr>';}).join('')+'</tbody></table><p><small>Backup source: <a href="https://internetarchive.bucklerfamily.estate/">internetarchive.bucklerfamily.estate</a>, dated snapshots of the cited pages, re-checked every 5 days.</small></p></details>';
  var C=L.changes||[];
  h+='<details><summary>Change log ('+C.length+')</summary>'+(C.length?C.map(function(c){return '<details><summary>'+e(t(c.at))+' · '+e(c.name)+' · content changed (+'+e(c.added)+' / −'+e(c.removed)+')</summary><p><small>First seen '+b(c.at)+' · compared with '+e(c.compared_with)+'</small></p>'+(c.before||[]).map(function(x){return '<blockquote class="bef">'+e(x)+'</blockquote>';}).join('')+(c.after||[]).map(function(x){return '<blockquote class="aft">'+e(x)+'</blockquote>';}).join('')+'<p><a href="'+e(c.url)+'" rel="noopener">Open the record</a></p></details>';}).join(''):'<p>No content change seen yet.</p>')+'</details>';
 }
 box.innerHTML=h;
});
})();

/* Watchtower: farm pages in the archive (data/farm.json). Each new capture compared with the previous capture of the same page. */
(function(){
var box=document.getElementById('farm-body'); if(!box) return;
var IA='https://internetarchive.bucklerfamily.estate';
function e(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function d(s){if(!s)return '—';try{return new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(s));}catch(x){return e(s.slice(0,16).replace('T',' '));}}
function kind(k){return k==='live'?'captured live':k==='internet-archive'?'Internet Archive copy':e(k);}
var css=document.createElement('style');css.textContent='#farm-body details{margin:6px 0}#farm-body summary{cursor:pointer}#farm-body .fp{padding-left:8px;border-left:2px solid rgba(128,128,128,.25)}#farm-body small{opacity:.7}#farm-body .rm,#farm-body .ad{margin:2px 0;padding:2px 6px;font-size:13px;white-space:pre-wrap;word-break:break-word}#farm-body .rm{background:rgba(255,80,80,.12)}#farm-body .ad{background:rgba(80,200,120,.14)}#farm-body .un{color:#e0a030}#farm-body .ch{color:#4fc27a;font-weight:600}';document.head.appendChild(css);
function diff(c){
 var h='<p><small>Before: <a href="'+IA+e(c.before.path)+'" rel="noopener">'+d(c.before.ts)+'</a> ('+kind(c.before.kind)+') · After: <a href="'+IA+e(c.after.path)+'" rel="noopener">'+d(c.after.ts)+'</a> ('+kind(c.after.kind)+') · <a href="'+e(c.u)+'" rel="noopener">page now</a></small></p>';
 if(c.across_sources) h+='<p><small>The two copies were made in different ways, so part of the difference is page layout rather than wording.</small></p>';
 h+='<details><summary>Removed ('+c.n_removed+')</summary>'+(c.removed||[]).map(function(x){return '<div class="rm">− '+e(x)+'</div>';}).join('')+(c.n_removed>(c.removed||[]).length?'<p><small>first '+c.removed.length+' shown; both copies are linked above</small></p>':'')+'</details>';
 h+='<details><summary>Added ('+c.n_added+')</summary>'+(c.added||[]).map(function(x){return '<div class="ad">+ '+e(x)+'</div>';}).join('')+(c.n_added>(c.added||[]).length?'<p><small>first '+c.added.length+' shown; both copies are linked above</small></p>':'')+'</details>';
 return h;
}
fetch('data/farm.json?v='+Date.now()).then(function(r){return r.json();}).then(function(F){
 if(!F||!F.pages) return;
 var C=F.changes||[],byK={};C.forEach(function(c){(byK[c.k]=byK[c.k]||[]).push(c);});
 var n=F.counts||{},h='<details><summary>Farm pages in the archive ('+F.pages.length+') · '+(n.changes||0)+' changed · last compared '+d(F.checked)+'</summary>';
 h+='<p><small>Every page in <a href="'+IA+'/" rel="noopener">the archive</a> about Great House Farm, Tŷ Mawr or Llandough. Each new capture is compared with the previous capture of the same page, line by line, spacing ignored.</small></p>';
 h+='<details><summary>Changes ('+C.length+')</summary>'+(C.length?C.map(function(c){return '<details class="fp"><summary>'+d(c.at)+' · '+e(c.title||c.u)+' · −'+c.n_removed+' / +'+c.n_added+'</summary>'+diff(c)+'</details>';}).join(''):'<p><small>None yet.</small></p>')+'</details>';
 var H={};F.pages.forEach(function(p){(H[p.host]=H[p.host]||[]).push(p);});
 h+='<details><summary>All pages by site</summary>'+Object.keys(H).sort(function(a,b){return H[b].length-H[a].length||a.localeCompare(b);}).map(function(host){
  var ps=H[host],un=ps.filter(function(p){return p.status.indexOf('unreachable')===0;}).length,ch=ps.filter(function(p){return p.n_changes>0;}).length;
  return '<details><summary>'+e(host)+' ('+ps.length+')'+(ch?' · <span class="ch">'+ch+' changed</span>':'')+(un?' · <span class="un">'+un+' unreachable</span>':'')+'</summary>'+ps.map(function(p){
   var cs=byK[p.k]||[],st=p.status.indexOf('unreachable')===0?'<span class="un">'+e(p.status)+'</span>':p.n_changes?'<span class="ch">'+e(p.status)+'</span>':e(p.status);
   return '<details class="fp"><summary>'+e(p.title||p.u)+'</summary><p><small>'+st+' · last checked '+d(p.last_checked)+' · last changed '+(p.last_changed?d(p.last_changed):'no change recorded')+'</small></p><p><small><a href="'+e(p.u)+'" rel="noopener">page</a>'+(p.latest?' · <a href="'+IA+e(p.latest.path)+'" rel="noopener">latest archived copy</a> ('+d(p.latest.ts)+', '+kind(p.latest.kind)+')':' · not yet archived')+' · '+p.n_caps+' cop'+(p.n_caps===1?'y':'ies')+'</small></p>'+cs.map(function(c){return '<details><summary>Before / after · '+d(c.at)+' · −'+c.n_removed+' / +'+c.n_added+'</summary>'+diff(c)+'</details>';}).join('')+'</details>';
  }).join('')+'</details>';
 }).join('')+'</details></details>';
 box.innerHTML=h;
}).catch(function(){});
})();
