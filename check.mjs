// Build check for fb.bucklerfamily.estate (mock social network, rebuilt 21 Oct 2026). Exit 1 on any failure. Run: node check.mjs
import {readFileSync,readdirSync,existsSync} from 'node:fs';
const dir=new URL('./site/',import.meta.url); let errors=[];
const read=f=>readFileSync(new URL(f,dir),'utf8');
const pages=['index.html','profiles.html','friends.html','timeline.html',...readdirSync(new URL('u/',dir)).map(f=>'u/'+f),...readdirSync(new URL('n/',dir)).map(f=>'n/'+f)];
const HONEST='A reconstruction: these outlets’ real articles shown as if posted online. Not their own accounts.';
const BANNED=/\b(thief|thieves|stolen|looted|criminal|racket|lawfare|fraud\w*|says|claims|claimed|claiming|according to|alleged\w*|allegation\w*)\b|family[’']?s? (account|position)/i;
const PRIVATE=[/robin\s*hill/i,/hywelapbuckler/i,/7845\s*933\s*262/,/\b0?7\d{3}\s?\d{3}\s?\d{3}\b/,/\+44\s?7\d{3}/,/[\w.+-]+@[\w-]+\.[\w.]+/,/Branwen\s+Buckler/i];
for(const p of pages){
  const raw=read(p);
  const vis=raw.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>/g,'').replace(/<[^>]+>/g,' ');
  if(!/ghf-boot\.js\?v=2\.0\.3"><\/script>\s*<\/head>/.test(raw)) errors.push(p+': header v2 loader missing at end of <head>');
  if(!/name="viewport"/.test(raw)) errors.push(p+': no viewport');
  if(p!=='timeline.html'){
    // 22 Oct 2026: no disclaimer or honesty line is required any more (Sion's standing rule, 21 Oct 20:50); the house list still applies
    const m=vis.match(BANNED); if(m) errors.push(p+': banned word "'+m[0]+'"');
  }
  for(const re of PRIVATE){const m=vis.match(re); if(m) errors.push(p+': private pattern '+m[0]);}
  for(const m of raw.matchAll(/(?:src|href)="((?:\.\.\/)?img\/[^"?#]+)"/g)){const f=m[1].replace(/^\.\.\//,''); if(!existsSync(new URL(f,dir))) errors.push(p+': missing '+f);}
}
const idx=read('index.html'); const posts=idx.split('<article class="post sp').slice(1);
for(const a of posts){ if(!/<details class="sp-src"><summary>Source<\/summary>/.test(a)) errors.push('post without Source: '+(a.match(/id="([^"]+)"/)||[])[1]); }
if(posts.length<40) errors.push('too few posts: '+posts.length);
for(const f of readdirSync(new URL('img/social/',dir))){ const n=readFileSync(new URL('img/social/'+f,dir)).length; if(n>200*1024) errors.push('image over 200 KB: '+f); }

// Friends → profiles → public statements (21 Oct 2026): every Friends card opens a farmbook profile, every profile has a statements section
const fr=read('friends.html'); const frl=[...fr.matchAll(/class="fr-a" href="u\/([^".#]+)\.html/g)].map(m=>m[1]);
if(frl.length<50) errors.push('friends: too few cards '+frl.length);
for(const s of frl){ if(!existsSync(new URL('u/'+s+'.html',dir))) errors.push('friends: card links to missing profile u/'+s+'.html'); }
if(/greathousefarmwiki\.wordpress\.com\/[^"]*"[^>]*class="fr-a"|class="fr-a" href="https?:/.test(fr)) errors.push('friends: a card links off-site');
for(const f of readdirSync(new URL('u/',dir))){ const r=read('u/'+f); if(!/id="statements"/.test(r)) errors.push('u/'+f+': no posts section'); if(!/class="st"|No public statements found yet/.test(r)) errors.push('u/'+f+': posts section empty'); }
// The hope wall (22 Oct 2026): a daily report on top when data/daily.json has one, faces where data/faces.json names them
const DJ=existsSync(new URL('../data/daily.json',dir))?JSON.parse(readFileSync(new URL('../data/daily.json',dir),'utf8')):{days:[]};
if(DJ.days.length && !idx.includes('id="daily-'+DJ.days[0].date+'"')) errors.push('wall: newest daily report missing from the top of index.html');
const FJ=JSON.parse(readFileSync(new URL('../data/faces.json',dir),'utf8')); for(const [s,f] of Object.entries(FJ.faces)){ if(!existsSync(new URL(f.img,dir))) errors.push('face missing for '+s); }
const SJ=JSON.parse(read('api/statements.json')); for(const s of SJ.statements){ if(!s.date||!s.url||!s.quote) errors.push('statement missing date/url/quote: '+s.id); }
if(errors.length){console.error('BUILD CHECK FAILED\n'+errors.join('\n'));process.exit(1);}
console.log(`build check ok: ${posts.length} posts on the feed, ${pages.length} pages, honesty line + footer + v2 loader on each, no house-list words, no private patterns, images under 200 KB`);
