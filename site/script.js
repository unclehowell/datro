
document.querySelectorAll('.like').forEach(b=>b.addEventListener('click',()=>{const on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',on);b.textContent=on?'👍 Liked':'👍 Like'}));
document.querySelectorAll('.share').forEach(b=>b.addEventListener('click',async()=>{const url=location.origin+location.pathname+'#'+b.dataset.id;try{if(navigator.share){await navigator.share({title:'Williams / Buckler family',url});}else{await navigator.clipboard.writeText(url);b.textContent='✓ Link copied';setTimeout(()=>b.textContent='↗ Share',1500);}}catch(e){}}));
const fb=document.querySelectorAll('.filters button');fb.forEach(b=>b.addEventListener('click',()=>{fb.forEach(x=>x.setAttribute('aria-pressed',x===b));document.querySelectorAll('.friend').forEach(f=>{f.hidden=!(b.dataset.f==='all'||f.dataset.tag===b.dataset.f)})}));
/* top-bar search: filters the timeline as you type; from other pages it opens the timeline with ?q= — Sion's Tab agent */
(function(){var f=document.querySelector('.fx-search'),i=f&&f.querySelector('input'),ps=document.querySelectorAll('article.post');if(!i||!ps.length)return;
var n=document.createElement('p');n.className='fx-noq';n.hidden=true;var m=document.querySelector('main')||document.body;m.insertBefore(n,m.firstChild);
function go(){var q=i.value.trim().toLowerCase(),k=0;ps.forEach(function(p){var on=!q||p.textContent.toLowerCase().indexOf(q)>-1;p.hidden=!on;if(on)k++;});
n.hidden=!q;n.textContent=q?(k?k+(k===1?' post matches “':' posts match “')+i.value.trim()+'”':'No posts match “'+i.value.trim()+'”'):'';
try{var u=new URL(location.href);if(q)u.searchParams.set('q',i.value.trim());else u.searchParams.delete('q');history.replaceState(null,'',u)}catch(e){}}
f.addEventListener('submit',function(e){e.preventDefault();go();i.blur();});i.addEventListener('input',go);
var q0=new URLSearchParams(location.search).get('q');if(q0){i.value=q0;go();}})();
/* burger menu: close when tapping elsewhere or pressing Escape */
document.addEventListener('click',function(e){document.querySelectorAll('details.fx-menu[open]').forEach(function(d){if(!d.contains(e.target))d.removeAttribute('open')})});document.addEventListener('keydown',function(e){if(e.key==='Escape')document.querySelectorAll('details.fx-menu[open]').forEach(function(d){d.removeAttribute('open')})});
