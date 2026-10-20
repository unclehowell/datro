
const S=JSON.parse(require('fs').readFileSync('/home/user/tab/work/chess/site/public/data/sudoku.json','utf8'));
const B=JSON.parse(require('fs').readFileSync('/home/user/tab/work/chess/site/public/data/board.json','utf8'));
const ids=new Set(B.sq.map(q=>q.id)); let all=[];
function count(g){ let n=0; const a=g.slice(); (function rec(){ let i=a.indexOf(0); if(i<0){n++;return} const r=Math.floor(i/9),c=i%9;
  for(let v=1;v<=9&&n<2;v++){ let ok=true; for(let k=0;k<9;k++){ if(a[r*9+k]===v||a[k*9+c]===v){ok=false;break} }
    const br=r-r%3,bc=c-c%3; for(let x=0;x<3&&ok;x++)for(let y=0;y<3;y++)if(a[(br+x)*9+bc+y]===v)ok=false;
    if(ok){a[i]=v;rec();a[i]=0} } })(); return n }
const out=S.puzzles.map(p=>{ const g=[...p.g].map(Number), s=[...p.s].map(Number);
  let valid=true; for(let k=0;k<9;k++){ const R=new Set(),C=new Set(),X=new Set(); for(let j=0;j<9;j++){R.add(s[k*9+j]);C.add(s[j*9+k]);X.add(s[(Math.floor(k/3)*3+Math.floor(j/3))*9+(k%3)*3+j%3])} if(R.size<9||C.size<9||X.size<9)valid=false }
  const cons=g.every((v,i)=>!v||v===s[i]); const flat=[].concat(...p.x); all.push(...flat);
  return {n:p.n,valid,cons,unique:count(g)===1,givens:g.filter(Boolean).length,blanks:g.filter(v=>!v).length,groups:p.x.length,recs:flat.length,idsok:flat.every(i=>ids.has(i))} });
console.log(JSON.stringify(out)); console.log('total records',all.length,'distinct',new Set(all).size,'board',B.sq.length);
