// Build check for farmbook (fb. = site/, before 2005; fb2. = site2/, 2005 onwards). Exit 1 on any failure.
// Run: node check.mjs [site|site2]   — the Pages build command of bucklerfamily-fb (site) and bucklerfamily-fb2 (site2). — Sion's Tab agent
import {readFileSync,readdirSync,existsSync} from 'node:fs';
const D=(process.argv[2]||'site').replace(/\/$/,''); const NOW=D==='site2';
const dir=new URL('./'+D+'/',import.meta.url); let errors=[];
const read=f=>readFileSync(new URL(f,dir),'utf8'); const ls=d=>existsSync(new URL(d,dir))?readdirSync(new URL(d,dir)):[];
const pages=['index.html','profiles.html','friends.html',...(existsSync(new URL('timeline.html',dir))?['timeline.html']:[]),...ls('u/').map(f=>'u/'+f),...ls('n/').map(f=>'n/'+f),...ls('wall/').map(f=>'wall/'+f)];
const BANNED=/\b(thief|thieves|stolen|looted|criminal|racket|lawfare|fraud\w*|says|claims|claimed|claiming|according to|alleged\w*|allegation\w*|hearsay|unverified)\b|family[’']?s? (account|position)/i;
const PRIVATE=[/(?<!Coed Sion )\bHywel\b/,/robin\s*hill/i,/(?<!#)hywelapbuckler/i,/7845\s*933\s*262/,/\b0?7\d{3}\s?\d{3}\s?\d{3}\b/,/\+44\s?7\d{3}/,/[\w.+-]+@[\w-]+\.[\w.]+/,/Branwen\s+Buckler/i,NOW?/(?<!Coed )\bSion\b(?! Buckler\b)/:/(?<!Coed )\bSion\b/,...(NOW?[/\bHywel\b/i]:[])];
let dated=0;
for(const p of pages){
  const raw=read(p);
  const vis=raw.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>/g,'').replace(/<[^>]+>/g,' ');
  if(!/ghf-boot\.js\?v=2\.1\.2"><\/script>\s*<\/head>/.test(raw)) errors.push(p+': shared header loader v2.1.2 missing at end of <head>');
  if(!/name="viewport"/.test(raw)) errors.push(p+': no viewport');
  if(p!=='timeline.html'){ const m=vis.match(BANNED); if(m) errors.push(p+': banned word "'+m[0]+'"'); }
  for(const re of PRIVATE){const m=vis.match(re); if(m) errors.push(p+': private pattern '+m[0]);}
  for(const m of raw.matchAll(/(?:src|href|poster)="((?:\.\.\/)?(?:img|daily)\/[^"?#]+)"/g)){const f=m[1].replace(/^\.\.\//,''); if(!existsSync(new URL(f,dir))) errors.push(p+': missing '+f);}
  // the edition split: fb. shows nothing dated 2005 or later, fb2. nothing before 2005
  if(p!=='timeline.html') for(const m of raw.matchAll(/<time datetime="(\d{4})/g)){ dated++; if((m[1]>='2005')!==NOW || (!NOW && m[1]>'1994')) errors.push(p+': dated '+m[1]+' is outside this edition'); }
}
const idx=read('index.html'); const posts=idx.split('<article class="post sp').slice(1);
for(const a of posts){ if(!/<details class="sp-src"><summary>Source<\/summary>/.test(a)) errors.push('post without Source: '+(a.match(/id="([^"]+)"/)||[])[1]); }
if(posts.length<40) errors.push('too few posts: '+posts.length);
if(!/id="fb-rings-data"/.test(idx)) errors.push('index: no stories rail');
for(const f of ls('img/social/')){ const n=readFileSync(new URL('img/social/'+f,dir)).length; if(n>200*1024) errors.push('image over 200 KB: '+f); }
for(const pg of ['friends.html','profiles.html']){ const fr=read(pg); const frl=[...fr.matchAll(/class="fr-a" href="u\/([^".#]+)\.html/g)].map(m=>m[1]);
  if(frl.length<30) errors.push(pg+': too few contacts '+frl.length);
  for(const s of frl){ if(!existsSync(new URL('u/'+s+'.html',dir))) errors.push(pg+': card links to missing profile u/'+s+'.html'); } }
for(const f of ls('u/')){ const r=read('u/'+f); if(!/id="statements"/.test(r)) errors.push('u/'+f+': no posts section'); if(!/class="st"|No public statements found yet/.test(r)) errors.push('u/'+f+': posts section empty'); }
// fb2 source lock (Sion, 02:18 BST 23 Oct 2026): every item rests on an email. or dartboard. record; the daily highlight-report video is the one marked exception
if(NOW){ const SRC=/^https:\/\/(email|dartboard)\.bucklerfamily\.estate\//; let items=0, exc=0;
  for(const p of pages){ for(const a of read(p).split('<article class="post sp').slice(1)){ items++; const tag=a.slice(0,a.indexOf('>'));
    if(/data-src-exception="highlight-report"/.test(tag)){ exc++; continue; }
    const s=(a.match(/<details class="sp-src">([\s\S]*?)<\/details>/)||[])[1]||''; const links=[...s.matchAll(/href="([^"]+)"/g)].map(m=>m[1]);
    if(!links.length||!links.every(u=>SRC.test(u))) errors.push(p+': item without an email./dartboard. source: '+((a.match(/id="([^"]+)"/)||[])[1])+' '+links.slice(0,2).join(' ')); } }
  for(const f of ['facebook.html','timeline.html','photos.html']) if(existsSync(new URL(f,dir))) errors.push(f+' must not be on fb2 (source lock)');
  for(const p of pages){ if(/href="[^"]*facebook\.html"/.test(read(p))) errors.push(p+': link to the retired Facebook copy'); }
  console.log('source lock: '+items+' items, '+exc+' highlight-report exception(s)'); }
// Story cards (Sion, 03:14 BST 23 Oct 2026): every story card on both editions carries a picture (its first slide's image or video poster); fb2 images may come from wayback.bucklerfamily.estate (Sion's authorisation of wayback media), names and text still only from email./dartboard.
{ const rail=(idx.match(/<div class="rgs"[\s\S]*?<\/div><script type="application\/json" id="fb-rings-data">([\s\S]*?)<\/script>/)||[]);
  const cards=[...(rail[0]||'').matchAll(/<a class="rg sc[^"]*"[\s\S]*?<\/a>/g)].map(m=>m[0]);
  const bare=cards.filter(a=>!/<img class="sc-pv" src="[^"]+"/.test(a));
  let rd=[]; try{ rd=JSON.parse(rail[1]||'[]'); }catch(_){ errors.push('stories: #fb-rings-data unreadable'); }
  const noimg=rd.filter(r=>!(r.slides&&r.slides[0]&&(r.slides[0].img||r.slides[0].poster))).map(r=>r.id);
  if(!cards.length) errors.push('stories: no story cards on the wall');
  if(bare.length) errors.push('stories: '+bare.length+' story card(s) without an image');
  if(noimg.length) errors.push('stories: first slide without an image: '+noimg.join(', '));
  // shorts carry pictures, video and hyperframes only, never a text-only slide (Sion, 17:18 BST 23 Oct 2026)
  for(const r of rd) for(const s of (r.slides||[])) if(!(s.img||s.poster||s.video)) errors.push('stories: text-only slide in '+r.id);
  if(NOW&&/replied: /.test(idx)) errors.push('wall: "replied:" label on a post');
  const IMGHOST=/^(?:https:\/\/(?:wayback|email|dartboard)\.bucklerfamily\.estate\/|(?:\.\.\/)?(?:img|daily)\/)/;
  for(const r of rd) for(const s of (r.slides||[])) for(const u of [s.img,s.poster].filter(Boolean)) if(!IMGHOST.test(u)) errors.push('stories: image not hosted on wayback./the site: '+u);
  if(NOW) for(const p of pages) for(const m of read(p).matchAll(/<img[^>]+src="(https?:\/\/[^"]+)"/g)) if(!/^https:\/\/(?:wayback|email|dartboard)\.bucklerfamily\.estate\//.test(m[1])) errors.push(p+': image from outside wayback./email./dartboard.: '+m[1]);
  console.log('stories: '+cards.length+' cards, '+(cards.length-bare.length)+' with an image'); }
if(NOW){ const HJ=existsSync(new URL('../data/highlights.json',dir))?JSON.parse(readFileSync(new URL('../data/highlights.json',dir),'utf8')):{days:[]};
  if(HJ.days.length && !idx.includes('id="hf-'+HJ.days[0].date+'"')) errors.push('wall: newest highlight report video missing from index.html'); }
const FJ=JSON.parse(readFileSync(new URL('../data/faces.json',import.meta.url.replace(/[^/]*$/,'')+'data/faces.json'),'utf8'));
for(const [s,f] of Object.entries(FJ.faces)){ if(existsSync(new URL('u/'+s+'.html',dir)) && !existsSync(new URL(f.img,dir))) errors.push('face missing for '+s); }
if(errors.length){console.error('BUILD CHECK FAILED ('+D+')\n'+errors.slice(0,60).join('\n'));process.exit(1);}
console.log(`build check ok (${D}): ${posts.length} posts on the wall, ${pages.length} pages, ${dated} dated items all in this edition, loader v2.1.2 last in <head>, no house-list words, no private patterns, images present`);
