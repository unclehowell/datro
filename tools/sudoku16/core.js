// 16x16 sudoku core: exact solver (counts solutions) and a human-style logic grader.
// Used by gen.js (build) and verify.js (shipped uniqueness test). — Sion's Tab agent
"use strict";
const N=16,B=4,ALL=(1<<N)-1;
const ROW=[],COL=[],BOX=[],UNITS=[],PEERS=[];
for(let i=0;i<256;i++){const r=i>>4,c=i&15;ROW.push(r);COL.push(c);BOX.push(((r>>2)<<2)+(c>>2));}
for(let u=0;u<16;u++){UNITS.push([...Array(16).keys()].map(k=>u*16+k));}
for(let u=0;u<16;u++){UNITS.push([...Array(16).keys()].map(k=>k*16+u));}
for(let u=0;u<16;u++){const br=(u>>2)*4,bc=(u&3)*4,a=[];for(let r=0;r<4;r++)for(let c=0;c<4;c++)a.push((br+r)*16+bc+c);UNITS.push(a);}
const CELLUNITS=[...Array(256)].map((_,i)=>[ROW[i],16+COL[i],32+BOX[i]]);
for(let i=0;i<256;i++){const s=new Set();for(const u of CELLUNITS[i])for(const j of UNITS[u])if(j!==i)s.add(j);PEERS.push([...s]);}
const pc=x=>{let n=0;while(x){x&=x-1;n++;}return n};
const bit=v=>1<<(v-1), val=m=>{let v=1;while(!(m&1)){m>>=1;v++;}return v};

// grid: array of 256 ints, 0 = empty, 1..16 = symbol
function candidates(g){const cand=new Array(256).fill(0);
  for(let i=0;i<256;i++){ if(g[i]){cand[i]=bit(g[i]);continue}
    let m=ALL; for(const j of PEERS[i]) if(g[j]) m&=~bit(g[j]); cand[i]=m; }
  return cand;}
function countSolutions(g0,limit){ limit=limit||2; let count=0, sol=null;
  const g=g0.slice();
  // validity of givens
  for(let i=0;i<256;i++) if(g[i]) for(const j of PEERS[i]) if(g[j]===g[i]) return {count:0,solution:null};
  function rec(g){ if(count>=limit) return;
    // propagate singles
    const cand=candidates(g); let changed=true;
    while(changed){ changed=false;
      for(let i=0;i<256;i++){ if(g[i]) continue; const m=cand[i]; if(!m) return; if(pc(m)===1){ const v=val(m); g[i]=v; cand[i]=m; for(const j of PEERS[i]){ if(!g[j]){cand[j]&=~m; if(!cand[j])return;} else if(g[j]===v) return; } changed=true; } }
      for(let u=0;u<48;u++){ for(let v=1;v<=16;v++){ const b=bit(v); let where=-1,n=0,placed=false;
          for(const j of UNITS[u]){ if(g[j]===v){placed=true;break} if(!g[j]&&(cand[j]&b)){n++;where=j} }
          if(placed) continue; if(n===0) return; if(n===1){ g[where]=v; cand[where]=b; for(const k of PEERS[where]){ if(!g[k]){cand[k]&=~b; if(!cand[k])return;} else if(g[k]===v) return; } changed=true; } } }
    }
    let best=-1,bn=99; for(let i=0;i<256;i++) if(!g[i]){ const n=pc(cand[i]); if(n<bn){bn=n;best=i} }
    if(best<0){ count++; if(!sol) sol=g.slice(); return }
    let m=cand[best]; while(m){ const b=m&-m; m^=b; const h=g.slice(); h[best]=val(b); rec(h); if(count>=limit) return; }
  }
  rec(g); return {count, solution:sol};
}
// Logic grader: returns {solved, order:[cell,...], steps:[{cell,v,tech}], maxTech}
// tech levels: 1 naked single, 2 hidden single, 3 locked candidates, 4 naked/hidden pair, 5 naked triple
function grade(g0){ const g=g0.slice(); const cand=candidates(g); const steps=[]; let maxTech=0;
  function place(i,v,tech){ g[i]=v; cand[i]=bit(v); for(const j of PEERS[i]) if(!g[j]) cand[j]&=~bit(v); steps.push({cell:i,v,tech}); if(tech>maxTech)maxTech=tech; }
  let curTech=0;
  for(let guard=0;guard<100000;guard++){
    if(g.every(x=>x)) break;
    let progress=false;
    // naked singles (one at a time, in reading order: the first available)
    for(let i=0;i<256;i++) if(!g[i]&&pc(cand[i])===1){ place(i,val(cand[i]),Math.max(1,curTech)); progress=true; break; }
    if(progress){curTech=0;continue}
    for(let u=0;u<48&&!progress;u++) for(let v=1;v<=16&&!progress;v++){ const b=bit(v); let n=0,w=-1,pl=false;
      for(const j of UNITS[u]){ if(g[j]===v){pl=true;break} if(!g[j]&&(cand[j]&b)){n++;w=j} }
      if(!pl&&n===1){ place(w,v,Math.max(2,curTech)); progress=true; } }
    if(progress){curTech=0;continue}
    // eliminations
    let elim=false;
    // locked candidates: box-line
    for(let bx=32;bx<48;bx++) for(let v=1;v<=16;v++){ const b=bit(v); const cs=UNITS[bx].filter(j=>!g[j]&&(cand[j]&b)); if(cs.length<2)continue;
      const rs=new Set(cs.map(j=>ROW[j])), cl=new Set(cs.map(j=>COL[j]));
      if(rs.size===1){ const r=ROW[cs[0]]; for(const j of UNITS[r]) if(BOX[j]!==bx-32&&!g[j]&&(cand[j]&b)){cand[j]&=~b;elim=true} }
      if(cl.size===1){ const c=COL[cs[0]]; for(const j of UNITS[16+c]) if(BOX[j]!==bx-32&&!g[j]&&(cand[j]&b)){cand[j]&=~b;elim=true} } }
    for(let u=0;u<32;u++) for(let v=1;v<=16;v++){ const b=bit(v); const cs=UNITS[u].filter(j=>!g[j]&&(cand[j]&b)); if(cs.length<2)continue;
      const bs=new Set(cs.map(j=>BOX[j])); if(bs.size===1){ const bx=BOX[cs[0]]; for(const j of UNITS[32+bx]) if(!UNITS[u].includes(j)&&!g[j]&&(cand[j]&b)){cand[j]&=~b;elim=true} } }
    if(elim){curTech=Math.max(curTech,3);continue}
    // naked pairs & hidden pairs
    for(let u=0;u<48;u++){ const em=UNITS[u].filter(j=>!g[j]);
      for(let a=0;a<em.length;a++){ if(pc(cand[em[a]])!==2)continue; for(let c=a+1;c<em.length;c++){ if(cand[em[c]]!==cand[em[a]])continue; const m=cand[em[a]];
        for(const j of em) if(j!==em[a]&&j!==em[c]&&(cand[j]&m)){cand[j]&=~m;elim=true} } }
      // hidden pairs
      const pos={}; for(let v=1;v<=16;v++){ const b=bit(v); const cs=em.filter(j=>cand[j]&b); if(cs.length===2) pos[v]=cs; }
      const vs=Object.keys(pos); for(let a=0;a<vs.length;a++) for(let c=a+1;c<vs.length;c++){ const A=pos[vs[a]],C=pos[vs[c]]; if(A[0]===C[0]&&A[1]===C[1]){ const m=bit(+vs[a])|bit(+vs[c]); for(const j of A) if(cand[j]&~m){cand[j]&=m;elim=true} } }
    }
    if(elim){curTech=Math.max(curTech,4);continue}
    // naked triples
    for(let u=0;u<48&&!elim;u++){ const em=UNITS[u].filter(j=>!g[j]&&pc(cand[j])<=3);
      for(let a=0;a<em.length&&!elim;a++)for(let c=a+1;c<em.length&&!elim;c++)for(let d=c+1;d<em.length&&!elim;d++){ const m=cand[em[a]]|cand[em[c]]|cand[em[d]]; if(pc(m)!==3)continue;
        for(const j of UNITS[u]) if(!g[j]&&j!==em[a]&&j!==em[c]&&j!==em[d]&&(cand[j]&m)){cand[j]&=~m;elim=true} } }
    if(elim){curTech=Math.max(curTech,5);continue}
    break;
  }
  return {solved:g.every(x=>x), grid:g, steps, maxTech};
}
module.exports={N,ROW,COL,BOX,UNITS,PEERS,countSolutions,grade};
