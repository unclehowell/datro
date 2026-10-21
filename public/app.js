/* Cedwyn Estate directory — search, cards, profiles. v1.0.0 · Sion's Tab agent */
(function(){
var D=null,MEM=[],cat='',shown=24,last=[];
var $=function(s){return document.querySelector(s)};
var STOP={who:1,in:1,can:1,cedwyn:1,estate:1,me:1,my:1,a:1,an:1,the:1,help:1,with:1,i:1,need:1,to:1,for:1,near:1,someone:1,somebody:1,anyone:1,is:1,there:1,do:1,does:1,of:1,and:1,or:1,our:1,us:1,we:1,please:1,get:1,find:1,local:1,around:1,here:1,area:1,on:1,at:1,be:1,good:1,best:1,where:1,what:1,which:1,will:1,could:1,would:1,some:1};
var SYN=[
 [/car\b|cars|mechanic|mot\b|garage|servicing|tyre|tire|exhaust|van|motorbike|motorcycle|bike|vehicle|brakes|clutch/,['motors'],['car repair','car dealer','tyres','motor','motorcycles','exhaust','vehicle','garage','car parts']],
 [/pint|beer|ale|lager|pub\b|drinks?\b/,['food'],['pub','bar','inn','legion','social club','club']],
 [/eat|food|lunch|dinner|breakfast|takeaway|coffee|cafe|café|pint|drink|beer|pub|restaurant|cater|party|burger|chips|cake|bake/,['food'],['restaurant','cafe','café','takeaway','pub','food','caterer','catering','coffee','bakery','bar']],
 [/build|builder|extension|roof|electric|plumb|scaffold|fence|fencing|glaz|window|sign|landscap|garden design|gardener|lawn|install|fire|clean/,['trades'],['construction','builder','roof','electrical','plumbing','scaffold','fenc','glaz','sign','garden','landscap','installation','fire','clean']],
 [/kid|child|children|nursery|school|teach|tutor|learn|lesson|course|train|skills|education|class/,['education'],['school','nursery','childcare','training','academy','education','pre-school']],
 [/sport|football|soccer|gym|fit|exercise|athlet|run|golf|box|swim|play|match|stadium|pitch|team|event/,['sport'],['sport','football','gym','fitness','stadium','golf','arena','athletic','pitch','boxing']],
 [/histor|heritage|old|listed|ancient|monument|medieval|roman|cross|bridge|camp|hillfort/,['heritage'],['listed','scheduled','monument','heritage','history','bridge','cross']],
 [/pray|worship|church|chapel|wedding|christening|funeral|faith/,['faith'],['church','worship','baptist','parish']],
 [/doctor|gp\b|health|hospital|dentist|dental|care|glasses|eye|optician|physio|nurse|medical|carer|mobility/,['health'],['hospital','medical','dental','health','optician','care','clinic','mobility']],
 [/shop|buy|gift|clothes|toy|game|bet|casino|present|card/,['retail'],['shop','store','retail','gift','clothes','toys','games']],
 [/furniture|tile|bathroom|paint|decorat|kitchen|bed|sofa|diy|door|garden centre|pool|spa|hot tub|flower|interior/,['home'],['furniture','tiles','bathroom','paint','decorat','diy','door','garden','pool','interior']],
 [/storage|store my|wholesale|cash and carry|bulk|pack|remov|move house|moving|recycl|warehouse|distribut|engineer|coating|energy/,['industry'],['wholesale','storage','removal','packing','cash','carry','industrial','recycling','engineering','energy']],
 [/software|website|web|it\b|computer|account|mortgage|financ|recruit|consult|events|wedding|music|record|studio|travel|security|design|photo/,['services'],['software','computer','consult','financ','mortgage','recruit','events','music','travel','security','design']],
 [/rent|property|let|letting|flat|house|landlord/,['property'],['property','real estate','letting','management']],
 [/council|archive|record office|records|government|bin|planning/,['public'],['council','archives','public']],
 [/walk|wood|forest|farm|countryside|nature|field/,['countryside'],['farm','wood','woodland']],
 [/charity|volunteer|community|hall|club|society|group|legion/,['community'],['charity','community','club','hall','legion']]
];
function norm(s){return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
function hay(e){if(!e._h){e._h=norm([e.name,(e.labels||[]).join(' '),e.description||'',e.type,e.category,e.area||'',e.heritage||'',e.address||''].join(' '));e._n=norm(e.name)}return e._h}
function search(q){
  var all=D.entities.concat(MEM),qn=norm(q).replace(/[^a-z0-9 ]/g,' ');
  var area=/leckwith/.test(qn)?'Leckwith':/llandough/.test(qn)?'Llandough':/michaelston/.test(qn)?'Michaelston-le-Pit':'';
  var toks=qn.split(/\s+/).filter(function(t){return t&&!STOP[t]&&t!=='llandough'&&t!=='leckwith'});
  var cats={},kws=[];
  SYN.forEach(function(s){if(s[0].test(qn)){s[1].forEach(function(c){cats[c]=1});kws=kws.concat(s[2])}});
  var out=[];
  all.forEach(function(e){
    if(cat&&e.category!==cat)return;
    var h=hay(e),sc=0;
    toks.forEach(function(t){if(t.length<2)return;var st=t.length>4?t.slice(0,t.length-1):t;if(e._n.indexOf(st)>=0)sc+=6;else if(h.indexOf(st)>=0)sc+=3});
    kws.forEach(function(k){if(h.indexOf(k)>=0)sc+=2});
    if(cats[e.category])sc+=3;
    if(!toks.length&&!kws.length)sc=1;
    if(area){if(e.area===area)sc+=1;else sc=0}
    if(e.member)sc+=0.5;
    if(sc>0)out.push([sc,e]);
  });
  out.sort(function(a,b){return b[0]-a[0]||a[1].name.localeCompare(b[1].name)});
  if(out.length&&(toks.length||kws.length)){var top=out[0][0],cut=Math.max(3,top*0.45);out=out.filter(function(x){return x[0]>=cut})}
  return out.map(function(x){return x[1]});
}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function card(e){
  var t=[];if(e.area)t.push(e.area);if(e.food_rating)t.push('Food hygiene '+e.food_rating);if(e.heritage)t.push(e.heritage);if(e.website)t.push('<span class="tag w">Website</span>');if(e.member)t.push('Member');
  var sub=(e.labels&&e.labels.length?e.labels.slice(0,2).join(' · '):(D.types[e.type]||''));
  return '<li><button class="card" type="button" data-id="'+esc(e.id)+'"><h2>'+esc(e.name)+'</h2><p>'+esc(sub)+'</p><div class="tags">'+t.map(function(x){return x.indexOf('<span')===0?x:'<span class="tag">'+esc(x)+'</span>'}).join('')+'</div></button></li>';
}
function render(list,q){
  last=list;var r=$('#res');
  var lab=cat?(D.categories.filter(function(c){return c[0]===cat})[0]||['',''])[1]:'';
  $('#meta').textContent=(q||cat)?(list.length+(list.length===1?' result':' results')+(lab?' in '+lab:'')):(D.count+' businesses, venues, schools, churches, clubs and heritage sites · updated '+D.generated);
  r.innerHTML=list.slice(0,shown).map(card).join('')+(list.length>shown?'<li><button class="more" type="button" id="more">Show more</button></li>':'');
}
function facts(e){
  var rows=[];function r(k,v){if(v)rows.push('<dt>'+k+'</dt><dd>'+v+'</dd>')}
  r('What',esc((e.labels||[]).slice(0,3).join('; ')));r('Type',esc(D.types[e.type]||e.type));r('Area',esc(e.area));
  r('Address',esc([e.address,e.postcode].filter(Boolean).join(', ')));
  if(e.website)r('Website','<a href="'+esc(e.website)+'" rel="noopener">'+esc(e.website.replace(/^https?:\/\/(www\.)?/,'').replace(/\/$/,''))+'</a>');
  if(e.email)r('Email','<a href="mailto:'+esc(e.email)+'">'+esc(e.email)+'</a>');
  if(e.phone)r('Phone','<a href="tel:'+esc(e.phone.replace(/[^0-9+]/g,''))+'">'+esc(e.phone)+'</a>');
  r('Opening hours',esc(e.hours));
  if(e.food_rating)r('Food hygiene rating',esc(e.food_rating+(e.food_rating_date?' (inspected '+e.food_rating_date+')':'')));
  if(e.company_no)r('Company number','<a href="https://find-and-update.company-information.service.gov.uk/company/'+esc(e.company_no)+'" rel="noopener">'+esc(e.company_no)+'</a>');
  if(e.charity_no)r('Charity number',esc(e.charity_no));
  r('Heritage',esc(e.heritage));r('Period',esc(e.period));r('Offers',esc(e.offer));
  if(e.lat)r('Map','<a href="https://www.openstreetmap.org/?mlat='+e.lat+'&mlon='+e.lon+'#map=18/'+e.lat+'/'+e.lon+'" rel="noopener">Open map</a>');
  return '<dl class="facts">'+rows.join('')+'</dl>';
}
function open(id){
  var e=D.entities.concat(MEM).filter(function(x){return x.id===id})[0];if(!e)return;
  var src=(e.sources||[]).map(function(u){return '<li><a href="'+esc(u)+'" rel="noopener">'+esc(u.replace(/^https?:\/\/(www\.)?/,'').slice(0,70))+'</a></li>'}).join('');
  var desc=(e.description||'').replace(' Our case, prospective. Not a finding of any court.','');
  $('#dlgc').innerHTML='<button class="ib x" type="button" id="dx" aria-label="Close">×</button><p class="kicker">'+esc(D.types[e.type]||(e.member?'Member':''))+(e.area?' · '+esc(e.area):'')+'</p><h1>'+esc(e.name)+'</h1>'+(desc?'<p class="lede">'+esc(desc)+'</p>':'')+facts(e)+
   (src?'<details class="src"><summary>Sources · last checked '+esc(e.last_checked||'')+'</summary><ul>'+src+'</ul></details>':'')+
   '<p class="own"><a class="btn" href="'+(e.member?'join/':'p/'+esc(e.id)+'/')+'">'+(e.member?'Update your profile':'Open full page')+'</a> <a href="join/?for='+esc(e.id)+'">Is this yours?</a></p>'+(e['case']?'<p class="small">Our case, prospective. Not a finding of any court.</p>':'');
  var d=$('#dlg');if(d.showModal&&!d.open)d.showModal();$('#dx').onclick=function(){d.close()};
  if(location.hash!=='#/p/'+id)history.replaceState(null,'','#/p/'+id);
}
function run(){var q=$('#q').value.trim();shown=24;render(search(q),q);}
var EX=['fix my car','cater a party','teach my kids','show me local history'];
function init(){
  $('#ex').innerHTML=EX.map(function(x){return '<button type="button">'+esc(x)+'</button>'}).join('');
  $('#ex').onclick=function(ev){var b=ev.target.closest('button');if(!b)return;$('#q').value=b.textContent;run()};
  $('#f').onsubmit=function(ev){ev.preventDefault();run();$('#q').blur()};
  $('#q').oninput=function(){clearTimeout(window._t);window._t=setTimeout(run,180)};
  $('#res').onclick=function(ev){var m=ev.target.closest('#more');if(m){shown+=24;render(last,$('#q').value);return}var c=ev.target.closest('.card');if(c)open(c.getAttribute('data-id'))};
  var side=$('#side'),mb=$('#menu');
  function sideOpen(o){side.hidden=!o;mb.setAttribute('aria-expanded',o?'true':'false')}
  mb.onclick=function(){sideOpen(side.hidden)};$('#close').onclick=function(){sideOpen(false)};
  side.onclick=function(ev){var b=ev.target.closest('button[data-cat]');if(!b)return;cat=b.getAttribute('data-cat');[].forEach.call(side.querySelectorAll('button[data-cat]'),function(x){x.classList.toggle('on',x===b)});sideOpen(false);run()};
  document.addEventListener('keydown',function(ev){if(ev.key==='Escape')sideOpen(false)});
  $('#dlg').addEventListener('close',function(){if(/^#\/p\//.test(location.hash))history.replaceState(null,'',location.pathname+location.search)});
  $('#dlg').addEventListener('click',function(ev){if(ev.target===$('#dlg'))$('#dlg').close()});
  var qs=new URLSearchParams(location.search);if(qs.get('q'))$('#q').value=qs.get('q');if(qs.get('cat'))cat=qs.get('cat');
  run();
  var m=/^#\/p\/(.+)$/.exec(location.hash);if(m)open(decodeURIComponent(m[1]));
}
fetch('data/entities.json').then(function(r){return r.json()}).then(function(d){D=d;init();
  fetch('/api/members').then(function(r){return r.ok?r.json():{members:[]}}).then(function(m){MEM=(m.members||[]).map(function(x){x.member=true;x.type=x.type||'member';return x});if(MEM.length)run()}).catch(function(){});
});
})();
