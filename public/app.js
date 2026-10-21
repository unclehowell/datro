/* nomenclature search · v1.0.0 · Sion's Tab agent */
(function(){
var q=document.getElementById('q'),res=document.getElementById('res'),azl=document.getElementById('azl'),D=null;
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’'“”".,()\[\]]/g,' ').replace(/\s+/g,' ').trim();}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
fetch('/lexicon.json').then(function(r){return r.json();}).then(function(j){D=[];j.concepts.forEach(function(c){
 D.push({c:c,t:c.name,k:norm(c.name),w:3,d:''});
 c.variants.forEach(function(v){D.push({c:c,t:v.term,k:norm(v.term),w:2,d:v.date+' · '+v.source});});
 (c.search_forms||[]).forEach(function(s){D.push({c:c,t:s,k:norm(s),w:1,d:'search form'});});
});var p=new URLSearchParams(location.search).get('q');if(p){q.value=p;run();}});
function run(){var s=norm(q.value);if(!s||!D){res.innerHTML='';azl.hidden=false;return;}
 var words=s.split(' '),best={};
 D.forEach(function(e){var ok=words.every(function(w){return e.k.indexOf(w)>-1;});if(!ok)return;var sc=e.w*10+(e.k===s?50:0)+(e.k.indexOf(s)===0?20:0);
  var b=best[e.c.id];if(!b||sc>b.sc)best[e.c.id]={e:e,sc:sc};});
 var L=Object.keys(best).map(function(k){return best[k];}).sort(function(a,b){return b.sc-a.sc;}).slice(0,25);
 azl.hidden=L.length>0;
 res.innerHTML=L.length?L.map(function(x){var e=x.e,c=e.c;return '<li><a href="/c/'+c.id+'/"><span class="n">'+esc(c.name)+'</span><span class="m">'+(e.t!==c.name?'“'+esc(e.t)+'” · ':'')+esc(e.d||(c.variants.length+' wordings'))+'</span></a></li>';}).join('')
  :'<li class="none">No record wording matches. Try a shorter word.</li>';}
q.addEventListener('input',run);
})();
