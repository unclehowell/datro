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
