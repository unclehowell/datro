/* Q (questions asked) and A (answers received) for qa.bucklerfamily.estate. Data: /correspondence.json, rebuilt from the
   failures ledger, the email manifest and the Q&A base by work/qa-site/build_correspondence.py. */
(function(){
'use strict';
var D=null, root=document.getElementById('corr');
if(!root) return;
var esc=function(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
var M=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fd(d){var m=/^(\d{4})-(\d{2})-(\d{2})/.exec(d||'');return m?(+m[3])+' '+M[+m[2]-1]+' '+m[1]:esc(d||'');}
function su(u){try{var x=new URL(u);return x.protocol==='https:'?x.href:'';}catch(e){return '';}}
function lk(u,t){u=su(u);return u?'<a href="'+esc(u)+'" target="_blank" rel="noopener">'+esc(t)+' ↗</a>':'';}
var HOUSE='<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="#b3261e" d="M12 3 2 11h3v9h5v-6h4v6h5v-9h3z"/></svg>';
var FISH='<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path fill="#b3261e" d="M2 12c3-4 7-6 11-6 3 0 6 2 8 6-2 4-5 6-8 6-4 0-8-2-11-6zm0 0 0 0M2 12l-1-4v8z"/><circle cx="16" cy="11" r="1.2" fill="#fff"/></svg>';
var SL={RED_HOUSE:'red house',RED_FISH:'red fish',ON_TIME:'on time',PENDING:'not yet due'};
function badge(r){
 if(r.status==='RED_HOUSE')return '<span class="cb red">'+HOUSE+'red house · '+(r.days_overdue!=null?r.days_overdue+' wd over':'')+'</span>';
 if(r.status==='RED_FISH')return '<span class="cb red">'+FISH+'red fish'+(r.days_overdue?' · '+r.days_overdue+' wd late':'')+'</span>';
 if(r.status==='ON_TIME')return '<span class="cb ok">on time</span>';
 if(r.status==='PENDING')return '<span class="cb wait">not yet due</span>';
 return '';}
function counts(b,mode){var c=b.counts,h='';
 if(mode==='q'){h='<span class="cn">'+c.questions+' q · '+c.requests+' req</span>';}
 else{h='<span class="cn">'+c.answers+' repl'+(c.answers===1?'y':'ies')+'</span>';}
 if(c.red_house)h+='<span class="cb red">'+HOUSE+c.red_house+'</span>';
 if(c.red_fish)h+='<span class="cb red">'+FISH+c.red_fish+'</span>';
 return h;}
var ANS={};
function nextAsk(b){var t=D.as_of,h='';
 var na=(b.next_ask||[]).filter(function(x){return x.date&&x.date>=t;});
 if(na.length){h+='<p class="nx"><b>Ask next:</b> '+fd(na[0].date)+(na[0].step?' — '+esc(na[0].step):'')+(na[0].to&&na[0].to.length?' → '+esc(na[0].to.join(', ')):'')+(na[0].what?'<br><span class="mu">'+esc(na[0].what)+'</span>':'')+'</p>';
  if(na.length>1)h+='<details class="mini"><summary>'+(na.length-1)+' more planned</summary><ul>'+na.slice(1).map(function(x){return '<li>'+fd(x.date)+' — '+esc(x.what||x.step)+(x.to&&x.to.length?' → '+esc(x.to.join(', ')):'')+'</li>';}).join('')+'</ul></details>';}
 if(b.next_step&&b.next_step.label)h+='<p class="nx"><b>Route step (dartboard):</b> '+esc(b.next_step.label)+(b.next_step.date?' · '+fd(b.next_step.date):'')+(b.next_step.status?' · '+esc(b.next_step.status):'')+'</p>';
 if(!h)h='<p class="nx mu">No planned send date on record.</p>';
 return h;}
function reqHtml(r){
 var em=(r.emailed||[]).map(function(e){return '<li>'+fd(e.date)+' → '+(e.to&&e.to.length?esc(e.to.join(', ')):'<span class="mu">mailbox not on record</span>')+' <span class="mu">('+esc(e.kind)+')</span> '+lk(e.url||e.text,'email')+'</li>';}).join('');
 var qs=(r.questions||[]).map(function(q){var a=(ANS[q.id]||[]).map(function(id){return '<a href="#'+esc(id)+'" class="jump">reply</a>';}).join(' ');
   return '<li id="'+esc(q.id)+'"><span class="qx">'+esc(q.text)+'</span> <span class="st">'+esc(q.status)+'</span>'+(q.asked?' <span class="mu">asked '+fd(q.asked)+'</span>':'')+(a?' · '+a:'')+'</li>';}).join('');
 var due='';
 if(r.due)due='<dt>Due</dt><dd>'+fd(r.due)+(r.due_note?' <span class="mu">('+esc(r.due_note)+')</span>':'')+(r.rule?' · '+(su(r.rule_url)?lk(r.rule_url,r.rule):esc(r.rule)):'')+(r.policy_url?' · '+lk(r.policy_url,'own policy'):'')+'</dd>';
 var st='';
 if(r.status==='RED_HOUSE')st='No reply by the due date; '+r.days_overdue+' working days overdue.';
 else if(r.status==='RED_FISH')st='Reply '+(r.days_overdue?r.days_overdue+' working days after the due date':'by the due date')+(r.questions.some(function(q){return q.status==='unanswered';})?'; questions left unanswered (below).':'.');
 else if(r.status)st=SL[r.status]||r.status;
 else if(r.deadline_record)st=esc(r.deadline_record);
 return '<details class="rq" id="'+esc(r.id)+'"><summary><span class="rt">'+esc(r.title)+'</span><span class="rm">'+badge(r)+(r.ref?esc(r.ref)+' · ':'')+(r.sent?'sent '+fd(r.sent):'')+'</span></summary><div class="rb">'+
  '<dl class="facts">'+(r.regime?'<dt>Regime</dt><dd>'+esc(r.regime)+'</dd>':'')+(r.sent_note?'<dt>Sent</dt><dd>'+esc(r.sent_note)+'</dd>':'')+due+
  (st?'<dt>Status</dt><dd>'+esc(st)+'</dd>':'')+(r.first_reply?'<dt>First reply</dt><dd>'+fd(r.first_reply)+(r.response?' · '+esc(r.response):'')+'</dd>':'')+'</dl>'+
  (em?'<p class="lb">Emailed ('+r.emailed.length+')</p><ul class="em">'+em+'</ul>':'')+
  (qs?'<p class="lb">Questions ('+r.questions.length+')</p><ol class="qs">'+qs+'</ol>':'<p class="mu">Question wording: see the request email.</p>')+
  (r.finding?'<p class="fi">'+esc(r.finding)+'</p>':'')+
  ((r.evidence||[]).length?'<p class="srcs">'+r.evidence.map(function(e){return lk(e.url,e.what.slice(0,60));}).join(' ')+'</p>':'')+
  (r.ev_url?'<p class="srcs">'+lk(r.ev_url,(r.ev||'Evidence page'))+'</p>':'')+
 '</div></details>';}
function ansHtml(a){
 var ql=(a.questions||[]).length?' · answers '+a.questions.length+' question'+(a.questions.length>1?'s':''):'';
 return '<details class="rq" id="'+esc(a.id)+'"><summary><span class="rt">'+esc(a.subject)+'</span><span class="rm"><span class="cb k">'+esc(a.kind)+'</span>'+fd(a.date)+(a.ref?' · '+esc(a.ref):'')+'</span></summary><div class="rb">'+
  '<p>'+esc(a.summary)+'</p>'+
  (a.exemptions&&a.exemptions.length?'<p><b>Exemptions:</b> '+esc(a.exemptions.join(', '))+'</p>':'')+
  (a.redirected_to?'<p><b>Redirected to:</b> '+esc(a.redirected_to)+'</p>':'')+
  '<p class="mu">From: '+esc(a.from)+'</p>'+
  '<p>Request: <a href="#'+esc(a.request)+'" class="jump">'+esc(a.request_title)+'</a>'+ql+'</p>'+
  ((a.questions||[]).length?'<p>'+a.questions.map(function(q,i){return '<a href="#'+esc(q)+'" class="jump">Q'+(i+1)+'</a>';}).join(' ')+'</p>':'')+
  '<p class="srcs">'+lk(a.url||a.text,'reply')+'</p></div></details>';}
function bodyHtml(b,mode){
 return '<details class="bd" data-b="'+esc(b.name)+'" data-m="'+mode+'" id="'+mode+'b-'+esc(b.lane||b.name.replace(/\W+/g,'-').toLowerCase())+'"><summary><span class="bn">'+esc(b.name)+'</span>'+counts(b,mode)+'</summary><div class="bx"></div></details>';}
function fill(det){var bx=det.querySelector('.bx');if(!bx||bx.dataset.done)return;var b=D.bodies.filter(function(x){return x.name===det.dataset.b;})[0];if(!b)return;
 if(det.dataset.m==='q')bx.innerHTML=nextAsk(b)+b.requests.map(reqHtml).join('');
 else bx.innerHTML=b.answers.length?b.answers.map(ansHtml).join(''):'<p class="mu">No replies on record.</p>';
 bx.dataset.done='1';}
function openTo(id){var el=document.getElementById(id);
 if(!el){var host=null;
  D.bodies.forEach(function(b){if(host)return;
   if(b.requests.some(function(r){return r.id===id||r.questions.some(function(q){return q.id===id;});}))host=['q',b];
   else if(b.answers.some(function(a){return a.id===id;}))host=['a',b];});
  if(!host)return;
  var det=root.querySelector('details.bd[data-m="'+host[0]+'"][data-b="'+CSS.escape(host[1].name)+'"]');
  if(!det)return; fill(det); el=document.getElementById(id);}
 if(!el)return;
 var p=el;while(p&&p!==root){if(p.tagName==='DETAILS')p.open=true;p=p.parentElement;}
 if(el.tagName==='DETAILS')el.open=true;
 el.scrollIntoView({block:'start',behavior:'smooth'});
 el.classList.add('flash');setTimeout(function(){el.classList.remove('flash');},1600);}
function render(){var t=D.totals;
 D.bodies.forEach(function(b){b.answers.forEach(function(a){(a.questions||[]).forEach(function(q){(ANS[q]=ANS[q]||[]).push(a.id);});});});
 var qb=D.bodies.filter(function(b){return b.requests.length;}), ab=D.bodies.filter(function(b){return b.answers.length;}).slice().sort(function(x,y){return y.counts.answers-x.counts.answers;});
 root.innerHTML=
 '<details class="sec" id="sec-q"><summary><span class="big">Q</span><span><b>Questions asked</b><span class="cn2">'+t.questions+' questions · '+t.requests+' requests · '+t.emails_sent+' emails · '+qb.length+' bodies'+(t.red_house?' · '+HOUSE+t.red_house:'')+(t.red_fish?' · '+FISH+t.red_fish:'')+'</span></span></summary>'+
 '<p class="mu pad">Who was emailed, when, the legal due date, and when to ask next. Red house: no reply by the due date. Red fish: reply late or questions left unanswered. Working days exclude bank holidays. Square brackets mark an editorial substitution.</p>'+
 qb.map(function(b){return bodyHtml(b,'q');}).join('')+'</details>'+
 '<details class="sec" id="sec-a"><summary><span class="big">A</span><span><b>Answers received</b><span class="cn2">'+t.answers+' replies · '+t.substantive+' beyond acknowledgement · '+ab.length+' bodies</span></span></summary>'+
 '<p class="mu pad">Every reply on record: who replied, when, the reference, and what it said, linked back to the question.</p>'+
 ab.map(function(b){return bodyHtml(b,'a');}).join('')+'</details>'+
 '<p class="mu pad">As of '+fd(D.as_of)+' · <a href="/correspondence.json">correspondence.json</a></p>';
 root.addEventListener('toggle',function(e){var d=e.target;if(d.classList&&d.classList.contains('bd')&&d.open)fill(d);},true);
 root.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a.jump');if(!a)return;e.preventDefault();openTo(a.getAttribute('href').slice(1));});
 if(location.hash&&/^#(q-|a-|k-)/.test(location.hash))openTo(location.hash.slice(1));}
fetch('/correspondence.json').then(function(r){return r.json();}).then(function(d){D=d;render();}).catch(function(){root.innerHTML='<p class="mu pad">The correspondence list did not load. Reload to try again.</p>';});
})();
