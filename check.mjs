// Build check for fb.bucklerfamily.estate. Fails (exit 1) if any post image is out of period,
// or if the output carries private contact details. Run: node check.mjs
import {readFileSync,readdirSync} from 'node:fs';
const dir=new URL('./site/',import.meta.url);
const TOL=2; let errors=[];
const idx=readFileSync(new URL('index.html',dir),'utf8');
const posts=idx.split('<article class="post"').slice(1);
let nImg=0;
for(const p of posts){
  const id=(p.match(/id="([^"]+)"/)||[])[1];
  const y0=+p.match(/data-y0="(\d+)"/)[1], y1=+p.match(/data-y1="(\d+)"/)[1];
  for(const m of p.matchAll(/<figure data-y0="(\d+)" data-y1="(\d+)"/g)){
    nImg++; const a=+m[1], b=+m[2];
    if(b<y0-TOL||a>y1+TOL) errors.push(`image dated ${a}-${b} on post ${id} (${y0}-${y1})`);
  }
  if(!/<p class="psrc">Source: /.test(p)) errors.push(`post ${id} has no source line`);
}
// 20 Oct 2026: the word "Facebook" is allowed (the Preserved-from-Facebook page, asked for by the family) and the sales@ takedown address is allowed.
const banned=[/robin\s*hill/i,/hywelapbuckler/i,/7845\s*933\s*262/,/\b0?7\d{3}\s?\d{3}\s?\d{3}\b/,/\+44\s?7\d{3}/,/\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b/,/[\w.+-]+@[\w-]+\.[\w.]+/,/family[’']?s? (account|testimony)/i];
for(const f of readdirSync(dir).filter(f=>/\.(html|js|css)$/.test(f))){
  const t=readFileSync(new URL(f,dir),'utf8').replace(/<svg[\s\S]*?<\/svg>/g,'').replace(/sales@bucklerfamily\.estate/g,'');
  for(const re of banned){const m=t.match(re); if(m) errors.push(`${f}: banned pattern ${re} -> "${m[0]}"`);}
}
if(posts.length<50) errors.push('too few posts: '+posts.length);
if(errors.length){console.error('BUILD CHECK FAILED\n'+errors.join('\n'));process.exit(1);}
console.log(`build check ok: ${posts.length} posts, ${nImg} post images in period (±${TOL} y), no private contact patterns`);
