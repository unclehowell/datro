// Builds the one big 16x16 case sudoku: a solution grid, then givens removed under a difficulty curve by evidence grade.
// Column stacks = evidence grades: 0 Corroborated record, 1 Documented, 2 Inference, 3 Theory (not yet proven to a legal standard).
// Every removal keeps (a) exactly one solution and (b) a solve by human logic (no guessing).
// Usage: node gen.js <seed> > puzzle.json   — Sion's Tab agent
"use strict";
const C=require("./core.js");
let seed=+(process.argv[2]||1988);
function rnd(){ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff }
function shuffle(a){ for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]} return a }
// base pattern solution, then symmetry-preserving shuffles
const n=4,N=16; const sol=new Array(256);
const bands=shuffle([0,1,2,3]), rows=[].concat(...bands.map(b=>shuffle([0,1,2,3]).map(r=>b*4+r)));
const stacks=shuffle([0,1,2,3]), cols=[].concat(...stacks.map(b=>shuffle([0,1,2,3]).map(c=>b*4+c)));
const syms=shuffle([...Array(16).keys()].map(x=>x+1));
for(let r=0;r<16;r++)for(let c=0;c<16;c++){ const R=rows[r],Cc=cols[c]; sol[r*16+c]=syms[(n*(R%n)+Math.floor(R/n)+Cc)%N]; }
const TARGET=(process.argv[3]||"11,8,5,2").split(",").map(Number); // givens per box, by grade stack
const g=sol.slice();
const boxOf=i=>C.BOX[i], stackOf=i=>C.COL[i]>>2;
function boxCount(bx){ return C.UNITS[32+bx].filter(j=>g[j]).length }
for(const st of [3,2,1,0]){
  for(let pass=0;pass<3;pass++){
    const cells=shuffle([...Array(256).keys()].filter(i=>stackOf(i)===st&&g[i]));
    for(const i of cells){ const bx=boxOf(i); if(boxCount(bx)<=TARGET[st]) continue;
      const v=g[i]; g[i]=0;
      const u=C.countSolutions(g,2); let ok=u.count===1;
      if(ok){ const gr=C.grade(g); ok=gr.solved; }
      if(!ok) g[i]=v;
    }
  }
}
// solve waves: each wave places every cell that is a single at the wave's start (eliminations when stuck)
function waves(g0){ const g=g0.slice(); const wave=new Array(256).fill(0); let w=0;
  while(g.some(x=>!x)){ w++; const gr=C.grade(g); // grade from here; take the cells reachable by singles without eliminations
    const firsts=[]; for(const s of gr.steps){ if(s.tech<=2) firsts.push(s); else break; }
    const take=firsts.length?firsts:gr.steps.slice(0,1);
    // only cells that were singles at the wave start: recompute naked/hidden singles on g
    const cand=new Array(256).fill(0);
    for(let i=0;i<256;i++) if(!g[i]){ let m=0xffff; for(const j of C.PEERS[i]) if(g[j]) m&=~(1<<(g[j]-1)); cand[i]=m; }
    const now=new Map();
    for(let i=0;i<256;i++) if(!g[i]&&(cand[i]&(cand[i]-1))===0&&cand[i]) now.set(i,gr.grid[i]);
    for(let u=0;u<48;u++) for(let v=1;v<=16;v++){ const b=1<<(v-1); let k=0,wh=-1,pl=false; for(const j of C.UNITS[u]){ if(g[j]===v){pl=true;break} if(!g[j]&&(cand[j]&b)){k++;wh=j} } if(!pl&&k===1) now.set(wh,v); }
    if(!now.size) now.set(take[0].cell,take[0].v);
    for(const [i,v] of now){ g[i]=v; wave[i]=w; }
    if(w>400) break;
  }
  return {wave, n:w};
}
const gr=C.grade(g), wv=waves(g), uq=C.countSolutions(g,2);
const per=[0,1,2,3].map(st=>{ const cs=[...Array(256).keys()].filter(i=>stackOf(i)===st);
  const giv=cs.filter(i=>g[i]).length, empty=cs.filter(i=>!g[i]);
  const mw=empty.length?empty.reduce((a,i)=>a+wv.wave[i],0)/empty.length:0;
  const tech=Math.max(0,...gr.steps.filter(s=>stackOf(s.cell)===st).map(s=>s.tech));
  return {stack:st,givens:giv,meanWave:+mw.toFixed(2),maxWave:Math.max(0,...empty.map(i=>wv.wave[i])),maxTech:tech}; });
const techCount={}; for(const s of gr.steps) techCount[s.tech]=(techCount[s.tech]||0)+1;
console.log(JSON.stringify({seed:+(process.argv[2]||1988),givens:g.filter(x=>x).length,unique:uq.count===1,logicSolved:gr.solved,maxTech:gr.maxTech,techCount,waves:wv.n,perStack:per,
  puzzle:g.map(x=>x?x.toString(17):"0").join(""), solution:sol.map(x=>x.toString(17)).join("")}));
