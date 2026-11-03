// Shipped test: the case sudoku (public/data/sudoku16.json) has exactly one solution, it equals the stored solution,
// the givens agree with it, and a human-logic solve (no guessing) finishes it. Run: node tools/sudoku16/verify.js
"use strict";
const fs=require("fs"),path=require("path"),C=require("./core.js");
const j=JSON.parse(fs.readFileSync(path.join(__dirname,"../../public/data/sudoku16.json"),"utf8"));
const P=[...j.puzzle].map(ch=>parseInt(ch,17)), S=[...j.solution].map(ch=>parseInt(ch,17));
let fail=0; const ok=(c,m)=>{console.log((c?"PASS ":"FAIL ")+m); if(!c)fail++};
ok(P.length===256&&S.length===256,"256 cells");
ok(P.every((v,i)=>!v||v===S[i]),"every given matches the stored solution");
ok(C.UNITS.every(u=>new Set(u.map(i=>S[i])).size===16),"stored solution is a valid 16x16 sudoku (rows, columns, 4x4 boxes)");
const r=C.countSolutions(P,2);
ok(r.count===1,"exactly one solution (exhaustive search stopped at 2; found "+r.count+")");
ok(r.solution&&r.solution.every((v,i)=>v===S[i]),"the unique solution equals the stored solution");
const g=C.grade(P);
ok(g.solved,"solvable by logic alone (singles, locked candidates, pairs) in "+g.steps.length+" placements, hardest technique level "+g.maxTech);
ok(j.cards.length===256&&j.rows.length===16&&j.cols.length===16&&j.syms.length===16,"every cell has a record; 16 eras, 16 kinds, 16 actors");
console.log("givens:",P.filter(Boolean).length);
process.exit(fail?1:0);
