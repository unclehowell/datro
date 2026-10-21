/* Cedwyn Estate directory — join / update / remove form. Sion's Tab agent */
(function(){
var f=document.getElementById('jf'),msg=document.getElementById('msg'),t0=Date.now();
var qs=new URLSearchParams(location.search),p=qs.get('for');
function kind(){return (f.querySelector('input[name=kind]:checked')||{}).value}
function sync(){var k=kind();[].forEach.call(f.querySelectorAll('.biz'),function(x){x.hidden=(k==='resident')})}
f.addEventListener('change',sync);sync();
if(p){document.getElementById('profile').value=p;f.querySelector('input[value=business]').checked=true;f.querySelector('input[value=update]').checked=true;sync();
  fetch('../data/entities.json').then(function(r){return r.json()}).then(function(d){var e=d.entities.filter(function(x){return x.id===p})[0];if(!e)return;
    var n=document.getElementById('forp');n.hidden=false;n.textContent='About the profile: '+e.name+'. Tell us what to change, or choose “Remove a profile”.';
    if(['school','church','charity','club','venue','public_body'].indexOf(e.type)>=0)f.querySelector('input[value=organisation]').checked=true;
    f.org.value=e.name;sync()})}
f.addEventListener('submit',function(ev){
  ev.preventDefault();msg.textContent='';
  if(!f.name.value.trim()||!f.email.value.trim()){msg.textContent='Please add your name and email.';return}
  if(!f.consent.checked){msg.textContent='Please tick the privacy box.';return}
  var o={};new FormData(f).forEach(function(v,k){o[k]=v});o.ts=t0;
  var b=f.querySelector('button[type=submit]');b.disabled=true;msg.textContent='Sending…';
  fetch('/api/join',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(o)}).then(function(r){return r.json().then(function(j){return [r.status,j]})}).then(function(x){
    b.disabled=false;
    if(x[1].ok){f.reset();sync();msg.textContent='Thank you. Reference '+x[1].ref+'. We will email you to confirm before anything is shown.'}
    else msg.textContent=x[1].error||'Sorry, that did not send. Please try again.';
  }).catch(function(){b.disabled=false;msg.textContent='Sorry, that did not send. Please try again.'});
});
})();
