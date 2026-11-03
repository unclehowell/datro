// Archive index: search by URL, captures per URL, latest links. — Sion's Tab agent
const $=s=>document.querySelector(s);const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=t=>t?t.replace('T',' ').replace(/:\d\dZ$/,' UTC'):'';
const bare=u=>u.replace(/^https?:\/\//i,'').replace(/^www\./i,'').replace(/\/+$/,'').toLowerCase();
let ITEMS=[];
function row(i){const n=i.c.length;const fail=/^capture failed|^not captured|^oversize/.test(i.s);
 const last=n?i.c[n-1]:null;
 const caps=i.c.slice().reverse().map(c=>`<li><a href="${esc(c[1])}">${esc(fmt(c[0]))}</a>${c[2]==='internet-archive'?' <span class="tag ia">Internet Archive copy</span>':''} <code>sha256 ${esc(c[3])}…</code></li>`).join('');
 return `<details><summary><span class="u">${esc(i.u)}</span><span class="n">${n} capture${n==1?'':'s'}${last?' · '+esc(fmt(last[0]).slice(0,10)):''}</span>${fail?`<span class="tag fail">${esc(i.s.split(';')[0])}</span>`:''}</summary>
 <ul class="caps">${caps||'<li>No capture yet.</li>'}</ul>
 <div style="font-size:13px;color:#6e6e73">${last?`<a href="/latest/${esc(i.k)}/">latest</a> · `:''}<a href="${esc(i.u)}" rel="nofollow noopener">live page</a>${i.o?` · <a href="${esc(i.o)}">Internet Archive copy (file over 25 MB)</a>`:''}${i.lc?` · last checked ${esc(fmt(i.lc))}: ${esc(i.lr)}`:''}${i.s?` · status: ${esc(i.s)}`:''}</div></details>`;}
function render(){const q=bare($('#q').value.trim());const list=q?ITEMS.filter(i=>bare(i.u).includes(q)||(i.c.length&&i.c[i.c.length-1][4].toLowerCase().includes(q))):ITEMS;
 const ok=list.filter(i=>i.c.length),bad=list.filter(i=>!i.c.length);
 $('#list').innerHTML=ok.map(row).join('')||'<p>No captures match.</p>';
 $('#other').innerHTML=bad.length?`<h2>Not captured yet (${bad.length})</h2>`+bad.map(row).join(''):'';
 const u=new URL(location);if(q)u.searchParams.set('q',$('#q').value.trim());else u.searchParams.delete('q');history.replaceState(null,'',u);}
fetch('/index.json?v='+Date.now()).then(r=>r.json()).then(d=>{ITEMS=d.items;
 const caps=ITEMS.reduce((a,i)=>a+i.c.length,0),pages=ITEMS.filter(i=>i.c.length).length,ia=ITEMS.reduce((a,i)=>a+i.c.filter(c=>c[2]==='internet-archive').length,0);
 $('#stats').textContent=`${pages} pages · ${caps} captures (${ia} Internet Archive copies) · index built ${fmt(d.built)}`;
 const q=new URL(location).searchParams.get('q');if(q)$('#q').value=q;render();});
$('#q').addEventListener('input',render);
