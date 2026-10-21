/* chess.bucklerfamily.estate — the case sudoku: ONE 16×16 board for the whole Great House Farm / Tŷ Mawr case.
   Rows = 16 eras of the timeline. Columns = 16 kinds of evidence in four grade bands (Corroborated record → Documented →
   Inference → Theory). Symbols = 16 actors and records. Boxes = an era band × a grade band. The sudoku rule is the lesson:
   each actor appears once in every era, every kind of evidence and every box, so the missing ones are worked out by elimination.
   Exactly one solution (tools/sudoku16/verify.js). Data: /data/sudoku16.json + /data/board.json. */
(function(){
"use strict";
var KEY="ghf-sudoku16-v1", CH="0123456789ABCDEFG";
var GRADE_CLS=["g0","g1","g2","g3"], GRADE_SHORT=["Corroborated","Documented","Inference","Theory"];
var THQ=["fraud","concealment","government involvement","grounds to reopen the case"];
var J=null,B=null,IDX={},P=[],SOL=[],E=[],NOTES=[],UNDO=[],sel=-1,notesMode=false,cardsOn=true,cs=22,built=false,mistakes=0;
var root,gridEl,infoEl,padEl,cells=[];
function $(id){return document.getElementById(id)}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function toast(t){ if(window.GHFtoast)window.GHFtoast(t) }
var R=function(i){return i>>4}, C=function(i){return i&15}, BX=function(i){return ((i>>6)<<2)+((i&15)>>2)}, GR=function(i){return (i&15)>>2};
var PEERS=[]; for(var i=0;i<256;i++){ var s=[]; for(var j=0;j<256;j++) if(j!==i&&(R(j)===R(i)||C(j)===C(i)||BX(j)===BX(i))) s.push(j); PEERS.push(s) }
function val(i){ return P[i]||E[i] }
function correct(i){ return P[i]?true:(E[i]&&E[i]===SOL[i]) }
function save(){ try{ localStorage.setItem(KEY,JSON.stringify({e:E.map(function(v){return CH[v]}).join(""),n:NOTES,c:cardsOn,m:mistakes,u:UNDO.slice(-200)})) }catch(e){} }
function load(){ try{ var o=JSON.parse(localStorage.getItem(KEY)||"null"); if(o&&o.e&&o.e.length===256){ E=o.e.split("").map(function(ch){return CH.indexOf(ch)}); NOTES=o.n||NOTES; if(o.c===false)cardsOn=false; mistakes=o.m||0; UNDO=o.u||[] } }catch(e){} }
function solvedCount(){ var n=0; for(var i=0;i<256;i++) if(!P[i]&&correct(i)) n++; return n }
var BLANKS=0;

function build(){
  root=$("su16"); gridEl=$("su-grid"); infoEl=$("su-info"); padEl=$("su-pad");
  // column header + rows
  var h='<div class="su-corner"></div>';
  for(var c=0;c<16;c++) h+='<div class="su-ch '+GRADE_CLS[c>>2]+'" title="'+esc(J.cols[c]+" · "+J.grades[c>>2])+'">'+(c+1)+'</div>';
  for(var r=0;r<16;r++){ h+='<div class="su-rh" title="'+esc(J.rows[r][0]+" · "+J.rows[r][1])+'">'+esc(J.rows[r][1].replace("before ","<").replace(/–(\d\d)(\d\d)$/,"–$2"))+'</div>';
    for(var c2=0;c2<16;c2++){ var i2=r*16+c2; h+='<button class="su-c '+GRADE_CLS[c2>>2]+(c2%4===0?" bl":"")+(r%4===0?" bt":"")+(P[i2]?" giv":"")+'" data-i="'+i2+'" aria-label="row '+(r+1)+' column '+(c2+1)+'"></button>' } }
  gridEl.innerHTML=h; cells=[].slice.call(gridEl.querySelectorAll(".su-c"));
  gridEl.addEventListener("click",function(e){ var b=e.target.closest(".su-c"); if(!b)return; select(+b.getAttribute("data-i")) });
  // pad
  var p='<div class="su-syms">'; for(var v=1;v<=16;v++) p+='<button class="btn su-s" data-v="'+v+'" title="'+esc(J.syms[v-1][0])+'"><b>'+CH[v]+'</b><small>'+esc(J.syms[v-1][2]||J.syms[v-1][0])+'</small></button>'; p+='</div>';
  p+='<div class="su-acts"><button class="btn" id="su-notes" aria-pressed="false">✎ Notes</button><button class="btn" id="su-erase">Erase</button><button class="btn" id="su-undo">Undo</button><button class="btn" id="su-hint">Hint</button><button class="btn" id="su-reveal">Reveal cell</button><button class="btn" id="su-cards" aria-pressed="true">Cards on</button><button class="btn" id="su-zo" aria-label="Smaller board">−</button><button class="btn" id="su-zi" aria-label="Bigger board">+</button><button class="btn" id="su-reset">Reset</button></div>';
  padEl.innerHTML=p;
  padEl.querySelectorAll(".su-s").forEach(function(b){ b.onclick=function(){ input(+b.getAttribute("data-v")) } });
  $("su-notes").onclick=function(){ notesMode=!notesMode; this.setAttribute("aria-pressed",notesMode); padEl.classList.toggle("notes",notesMode) };
  $("su-erase").onclick=function(){ if(sel<0||P[sel])return; push(); E[sel]=0; NOTES[sel]=0; save(); paint() };
  $("su-undo").onclick=undo; $("su-zi").onclick=function(){zoom(1.25)}; $("su-zo").onclick=function(){zoom(0.8)}; $("su-hint").onclick=hint; $("su-reveal").onclick=reveal;
  $("su-cards").onclick=function(){ cardsOn=!cardsOn; this.setAttribute("aria-pressed",cardsOn); this.textContent=cardsOn?"Cards on":"Cards off"; save() };
  $("su-reset").onclick=function(){ if(!confirm("Clear all your entries and notes on the case sudoku?"))return; E=new Array(256).fill(0); NOTES=new Array(256).fill(0); UNDO=[]; mistakes=0; sel=-1; save(); paint() };
  $("su-cards").setAttribute("aria-pressed",cardsOn); $("su-cards").textContent=cardsOn?"Cards on":"Cards off";
  $("sc-close").onclick=closeCard; $("su-card").addEventListener("click",function(e){ if(e.target===$("su-card"))closeCard() });
  document.addEventListener("keydown",function(e){ if(!document.body.classList.contains("su")||e.target.tagName==="INPUT")return;
    if($("su-card").classList.contains("open")){ if(e.key==="Escape"||e.key==="Enter")closeCard(); return }
    var k=e.key.toUpperCase(), v=CH.indexOf(k); if(v>0&&k.length===1){ input(v); e.preventDefault(); return }
    if((e.key==="Backspace"||e.key==="Delete")&&sel>=0&&!P[sel]){ push(); E[sel]=0; save(); paint(); return }
    if(e.key==="n"||e.key==="N"){ $("su-notes").click(); return }
    if(sel>=0&&/^Arrow/.test(e.key)){ var r=R(sel),c=C(sel); if(e.key==="ArrowUp")r=(r+15)%16; if(e.key==="ArrowDown")r=(r+1)%16; if(e.key==="ArrowLeft")c=(c+15)%16; if(e.key==="ArrowRight")c=(c+1)%16; select(r*16+c); e.preventDefault() } });
  legend(); built=true;
}
function push(){ UNDO.push([sel,E[sel],NOTES[sel]]); if(UNDO.length>400)UNDO.shift() }
function undo(){ var u=UNDO.pop(); if(!u){toast("Nothing to undo");return} E[u[0]]=u[1]; NOTES[u[0]]=u[2]; sel=u[0]; save(); paint() }
function select(i){ sel=i; paint(); if(P[i]||correct(i)&&E[i]) info(i) ; else info(i) }
function cand(i){ var m=0xffff; PEERS[i].forEach(function(j){ var v=P[j]||(correct(j)?E[j]:0); if(v)m&=~(1<<(v-1)) }); return m }
function input(v){ if(sel<0){toast("Tap a cell first");return} if(P[sel]){toast("That cell is a given: its record is fixed");return}
  if(correct(sel)&&E[sel]){toast("Already solved");return}
  push();
  if(notesMode){ NOTES[sel]^=(1<<(v-1)); save(); paint(); return }
  E[sel]=v; NOTES[sel]=0;
  if(v===SOL[sel]){ PEERS[sel].forEach(function(j){ NOTES[j]&=~(1<<(v-1)) }); save(); paint();
    var done=solvedCount()===BLANKS; if(cardsOn||done) openCard(sel,done); else info(sel) }
  else { mistakes++; save(); paint(); toast(CH[v]+" ("+J.syms[v-1][0]+") cannot go there: it clashes with the solution. Try elimination: check its row, column and box.") }
}
function hint(){ // the next logical step, easiest grade band first: a naked single, then a hidden single
  var order=[]; for(var g=0;g<4;g++) for(var i=0;i<256;i++) if(GR(i)===g&&!P[i]&&!correct(i)) order.push(i);
  for(var a=0;a<order.length;a++){ var i2=order[a], m=cand(i2); if(m&&!(m&(m-1))){ select(i2); toast("Hint: only one symbol fits this cell. Check its row, column and box."); return } }
  var units=[]; for(var u=0;u<16;u++){ var rw=[],cl=[],bx=[]; for(var k=0;k<16;k++){ rw.push(u*16+k); cl.push(k*16+u); bx.push(((u>>2)*4+(k>>2))*16+(u&3)*4+(k&3)) } units.push(["row",rw],["column",cl],["box",bx]) }
  units.sort(function(x,y){ return Math.min.apply(null,x[1].map(GR))-Math.min.apply(null,y[1].map(GR)) });
  for(var t=0;t<units.length;t++){ var U=units[t][1]; for(var v=1;v<=16;v++){ var bit=1<<(v-1),placed=false,where=[];
      for(var q=0;q<16;q++){ var j=U[q]; var vv=P[j]||(correct(j)?E[j]:0); if(vv===v){placed=true;break} if(!vv&&(cand(j)&bit))where.push(j) }
      if(!placed&&where.length===1){ select(where[0]); toast("Hint: in this "+units[t][0]+", one symbol has only the highlighted cell left."); return } } }
  if(order.length){ order.sort(function(x,y){ return bits(cand(x))-bits(cand(y)) }); select(order[0]); toast("Hint: try pencil marks here; it has the fewest candidates. Look for two cells sharing the same pair."); }
}
function bits(m){var n=0;while(m){m&=m-1;n++}return n}
function reveal(){ if(sel<0||P[sel]||correct(sel)){ hint(); if(sel<0)return; if(P[sel]||correct(sel))return }
  push(); E[sel]=SOL[sel]; NOTES[sel]=0; PEERS[sel].forEach(function(j){ NOTES[j]&=~(1<<(SOL[sel]-1)) }); save(); paint(); openCard(sel,solvedCount()===BLANKS) }
function paint(){
  var sv=sel>=0?val(sel):0, svOk=sel>=0&&correct(sel)&&sv;
  for(var i=0;i<256;i++){ var b=cells[i], v=val(i), cls="";
    if(sel>=0&&(R(i)===R(sel)||C(i)===C(sel)||BX(i)===BX(sel))) cls+=" rel";
    if(i===sel) cls+=" sel";
    if(svOk&&v===sv&&correct(i)) cls+=" same";
    if(v){ b.textContent=CH[v]; if(!P[i]) cls+=correct(i)?" ok":" bad" }
    else if(NOTES[i]){ var h='<span class="nt">'; for(var k=1;k<=16;k++) h+='<i>'+((NOTES[i]>>(k-1))&1?CH[k]:"")+'</i>'; b.innerHTML=h+'</span>' }
    else b.textContent="";
    b.className="su-c "+GRADE_CLS[GR(i)]+(C(i)%4===0?" bl":"")+(R(i)%4===0?" bt":"")+(P[i]?" giv":"")+cls }
  var n=solvedCount(); $("su-prog").textContent=n+" of "+BLANKS+" solved"+(mistakes?" · "+mistakes+" clash"+(mistakes===1?"":"es"):"");
  var per=[0,0,0,0],tot=[0,0,0,0]; for(var j=0;j<256;j++) if(!P[j]){ tot[GR(j)]++; if(correct(j))per[GR(j)]++ }
  $("su-bands").innerHTML=per.map(function(x,g){ return '<span class="'+GRADE_CLS[g]+'"><b>'+GRADE_SHORT[g]+'</b> '+x+'/'+tot[g]+'</span>' }).join("");
  if(sel>=0) info(sel); else infoEl.innerHTML='<span class="note">Tap a cell. Start in the green Corroborated band on the left: it is the most complete. The board grows harder towards the purple Theory band on the right.</span>';
}
function info(i){ var r=R(i),c=C(i),g=GR(i),v=val(i),ok=correct(i)&&v;
  infoEl.innerHTML='<span class="chip '+GRADE_CLS[g]+'">'+esc(J.grades[g])+'</span> <b>'+esc(J.rows[r][1])+'</b> '+esc(J.rows[r][0])+' · <b>'+esc(J.cols[c])+'</b>'+
    (ok?' · <b>'+CH[v]+'</b> '+esc(J.syms[v-1][0])+' <button class="btn sm" id="su-read">Read record</button>':' · <span class="note">empty: which actor belongs here?</span>');
  var rb=$("su-read"); if(rb) rb.onclick=function(){ openCard(i,false) } }
function cardHTML(i){ var r=R(i),c=C(i),g=GR(i),v=SOL[i], q=B.sq[IDX[J.cards[i]]]; if(!q) return "<p>Record not found.</p>";
  var src=(q.src||[]).filter(function(s){return /^https?:/.test(s[1]||"")}), u=src.length?String(src[0][1]).split("#")[0]+(q.a||""):"";
  var h='<div class="sc-meta"><span class="chip '+GRADE_CLS[g]+'">'+esc(J.grades[g])+'</span></div>'+
    '<div class="sc-cell"><b>'+CH[v]+' · '+esc(J.syms[v-1][0])+'</b> in <b>'+esc(J.rows[r][0])+'</b> ('+esc(J.rows[r][1])+'), seen through <b>'+esc(J.cols[c])+'</b></div>';
  if(g===3) h+='<div class="sc-q">Hypothesis, '+esc(THQ[c-12])+': does this record point that way, and what evidence would prove or disprove it?</div>';
  h+='<div class="kindtag">'+esc(q.d||"Undated")+'</div><div class="ex-t">'+esc(q.t)+'</div><div class="ex-x">'+esc(q.x)+'</div>';
  if(g===3||q.th) h+='';
  if(J.match[i]==="0") h+='<p class="note sc-el">The record placed here holds nothing direct on '+esc(J.syms[v-1][0])+' in this era. The symbol was found by elimination alone, and that gap is where evidence is still missing.</p>';
  h+='<div class="navrow">'+(u?'<a class="btn primary visit" href="'+esc(u)+'" target="_blank" rel="noopener">Visit website ↗</a>':'')+'<button class="btn" id="sc-board">Show on chessboard</button></div>';
  return h }
function openCard(i,done){ var g=GR(i);
  $("sc-h").textContent=(P[i]?"Given · ":"Solved · ")+GRADE_SHORT[g]+" · row "+(R(i)+1)+", column "+(C(i)+1);
  $("sc-b").innerHTML=(done?'<div class="won">The whole case sudoku is solved. Every actor has its place in every era, every kind of evidence and every box.</div>':'')+cardHTML(i);
  var sb=$("sc-board"); if(sb) sb.onclick=function(){ var id=J.cards[i]; closeCard(); if(window.ChessBoard){ ChessBoard.mode("chess"); setTimeout(function(){ ChessBoard.zoomTo(id,null,true) },80) } };
  $("su-card").classList.add("open"); $("sc-b").scrollTop=0 }
function closeCard(){ $("su-card").classList.remove("open") }
function legend(){ var el=$("su-legend"); if(!el)return; var st=J.stats||{};
  var h='<h4 class="kh">The case sudoku: one 16×16 board for the whole case</h4>'+
  '<p class="note">The sudoku rule is the method: each actor appears exactly once in every era, once in every kind of evidence and once in every box. Where the record is complete the answer is read off; where it is not, the missing actor is found by elimination and deduction. Each correct entry opens the record placed in that cell, its evidence grade and a Visit website link to the source.</p>'+
  '<div class="sl"><b>Rows: 16 eras</b><ol>'+J.rows.map(function(r){return '<li>'+esc(r[1])+' · '+esc(r[0])+'</li>'}).join("")+'</ol></div>'+
  '<div class="sl"><b>Columns: 16 kinds of evidence, in four grade bands</b><ol>'+J.cols.map(function(c,k){return '<li><span class="chip '+GRADE_CLS[k>>2]+'">'+GRADE_SHORT[k>>2]+'</span> '+esc(c)+'</li>'}).join("")+'</ol></div>'+
  '<div class="sl"><b>Symbols: 16 actors and records</b><ul class="syml">'+J.syms.map(function(s,k){return '<li><b>'+CH[k+1]+'</b> '+esc(s[0])+' <span class="note">('+esc(s[1])+')</span></li>'}).join("")+'</ul></div>'+
  '<div class="sl"><b>Boxes: an era band × a grade band</b><p class="note">Sixteen 4×4 boxes: four era bands (rows 1–4 before 1938, 5–8 1938–1968, 9–12 1969–1983, 13–16 1984–2026) crossed with the four evidence grades.</p></div>'+
  '<div class="sl"><b>Evidence grades and the difficulty curve</b><ul class="grl">'+
  '<li><span class="chip g0">Corroborated record</span> court judgments, registers and dated events on record, such as the 1969 sale, the 1987 judgment, the eviction of 30 Nov 1988 and the demolition of 6 Dec 1988. Many givens; the easiest moves solve it.</li>'+
  '<li><span class="chip g1">Documented</span> estate papers, letters, maps and press reports. Fewer givens.</li>'+
  '<li><span class="chip g2">Inference</span> timing, gaps, discrepancies and refusals. Sparse; needs locked candidates.</li>'+
  '<li><span class="chip g3">Theory, not yet proven to a legal standard</span> fraud, concealment, government involvement and grounds to reopen, each posed as a question. Almost no givens; the hardest moves.</li></ul></div>'+
  '<p class="note">Checked by a solver: exactly one solution'+(st.givens?', '+st.givens+' givens':'')+', solvable by logic alone with no guessing. A solver working the easy moves first clears the Corroborated band first and the Theory band last.</p>';
  el.innerHTML=h }
function fit(){ var wrap=$("su-wrap"); if(!wrap)return; var W=wrap.clientWidth-6; cs=Math.max(18,Math.min(44,Math.floor((W-36)/16))); setCS() }
function setCS(){ document.documentElement.style.setProperty("--cs",cs+"px") }
function zoom(f){ cs=Math.max(16,Math.min(64,Math.round(cs*f))); setCS() }
function init(cb){ if(J){cb();return}
  fetch("/data/sudoku16.json",{cache:"no-cache"}).then(function(r){return r.json()}).then(function(j){ J=j;
    P=j.puzzle.split("").map(function(ch){return parseInt(ch,17)}); SOL=j.solution.split("").map(function(ch){return parseInt(ch,17)});
    E=new Array(256).fill(0); NOTES=new Array(256).fill(0); load(); E=E.map(function(v,i){return P[i]?0:v});
    BLANKS=P.filter(function(v){return !v}).length; cb() }).catch(function(){ toast("Could not load the sudoku. Please reload.") }) }
window.GHFSudoku={
  open:function(board){ B=board; IDX={}; B.sq.forEach(function(q,i){IDX[q.id]=i});
    init(function(){ if(!built)build(); $("su16").hidden=false; fit(); paint() }) },
  close:function(){ var el=$("su16"); if(el)el.hidden=true; closeCard() },
  fit:fit, zoom:zoom,
  _state:function(){ return {P:P,SOL:SOL,E:E,sel:sel} }, _select:select, _input:input, _card:openCard
};
window.addEventListener("resize",function(){ if(document.body.classList.contains("su"))fit() });
})();
