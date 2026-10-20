/* chess.bucklerfamily.estate — one giant zoomable chessboard of the Great House Farm / Tŷ Mawr record.
   Custom canvas renderer with level of detail: colours from afar, titles closer, full text and sources up close.
   Data: /data/board.json (built by tools/build.py from data/items.json). No dependencies. */
(function(){
"use strict";
var S=100;                         // world size of one square
var KIND={A:{n:"Action against Williams/Buckler ownership",m:"#e5484d",t:"#ff9b8f",c:"b"},
          L:{n:"Legal framing (legalese)",m:"#9b9b9b",t:"#a8a8a8",c:"b"},
          C:{n:"Omission, withholding or possible concealment",m:"#ffffff",t:"#ffffff",c:"b"},
          K:{n:"Record that cuts against the case",m:"#a78bfa",t:"#c4b5fd",c:"b"},
          E:{n:"Evidence: ownership, occupation, reopening",m:"#2563eb",t:"#111111",c:"w"},
          H:{n:"Heritage and lineage",m:"#b8860b",t:"#111111",c:"w"},
          T:{n:"Trees, woodland and the land",m:"#2e7d32",t:"#111111",c:"w"}};
var cv=document.getElementById("board"),ctx=cv.getContext("2d");
var top=document.querySelector(".top"),foot=document.querySelector(".foot");
var B=null,grid=null,dpr=1,W=0,H=0,y0=0;
var view={s:0.1,x:0,y:0},minS=0.01,maxS=34;
var MODE="chess",LS=null;   // MODE chess|sudoku; LS = sudoku layout
var SU=null,AR={idx:null,sh:{},pend:{},wait:{}};
var opt={show:"both",tb:true,tw:true,q:"",hits:null,hitList:[],hitIx:-1,sel:-1};
var wrapCache=new Map(),dirty=true,anim=null;

function $(id){return document.getElementById(id)}
function fontStr(w,sz){return w+" "+sz+"px Barlow, Helvetica Neue, Arial, sans-serif"}

/* ---------- layout (chessboard or sudoku board) ---------- */
function L(){return MODE==="sudoku"&&LS?LS:B}
function posR(i){return MODE==="sudoku"&&LS?LS.pr[i]:B.sq[i].r}
function posC(i){return MODE==="sudoku"&&LS?LS.pc[i]:B.sq[i].c}
function padH(){var p=$("pad");return MODE==="sudoku"&&p?p.getBoundingClientRect().height:0}
/* ---------- sizing ---------- */
function resize(){
  dpr=Math.min(window.devicePixelRatio||1,2);
  y0=top.getBoundingClientRect().height; var fh=foot.getBoundingClientRect().height;
  W=window.innerWidth; var ph=padH(); H=Math.max(100,window.innerHeight-y0-fh-ph);
  cv.style.top=y0+"px"; cv.style.height=H+"px"; cv.style.bottom="auto";
  cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr); cv.style.width=W+"px";
  document.querySelector(".zoom").style.bottom=(fh+ph+10)+"px"; var pd=$("pad"); if(pd)pd.style.bottom=fh+"px"; document.documentElement.style.setProperty("--bcb",(fh+ph+8)+"px");
  dirty=true;
}
function boardW(){return L().cols*S} function boardH(){return L().rows*S}
function fit(animate){
  if(MODE==="sudoku"&&LS&&SU){ minS=Math.min((W-16)/boardW(),(H-16)/boardH())*0.6; blockFit(SU.cur,animate); return }
  var pad=Math.min(W,H)<500?6:24, lm=0;
  var s=Math.min((W-pad*2-lm)/boardW(),(H-pad*2)/boardH());
  var t={s:s,x:(W-boardW()*s)/2+lm/2,y:Math.max(pad,(H-boardH()*s)/2)};
  minS=s*0.6; go(t,animate);
}
function go(t,animate){
  if(!animate){view=t;dirty=true;return}
  var f={s:view.s,x:view.x,y:view.y},t0=performance.now(),d=420;
  anim=function(now){var k=Math.min(1,(now-t0)/d);k=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
    // zoom in log space for a natural feel
    var ls=Math.log(f.s)+(Math.log(t.s)-Math.log(f.s))*k; view.s=Math.exp(ls);
    view.x=f.x+(t.x-f.x)*k; view.y=f.y+(t.y-f.y)*k; dirty=true; if(k>=1)anim=null};
}
function zoomAt(px,py,factor){
  var ns=Math.max(minS,Math.min(maxS,view.s*factor)); var k=ns/view.s;
  view.x=px-(px-view.x)*k; view.y=py-(py-view.y)*k; view.s=ns; clampView(); dirty=true;
}
function clampView(){
  var bw=boardW()*view.s,bh=boardH()*view.s,m=Math.min(W,H)*0.5;
  view.x=Math.min(W-m*0.2,Math.max(-bw+m*0.2,view.x));
  view.y=Math.min(H-m*0.2,Math.max(-bh+m*0.2,view.y));
}
function flyToSquare(i,zoomPx){
  var px=zoomPx||Math.min(W,H)*0.78; var s=Math.min(maxS,px/S);
  go({s:s,x:W/2-(posC(i)+.5)*S*s,y:H/2-(posR(i)+.5)*S*s},true);
}

/* ---------- text layout (world units) ---------- */
function wrap(text,maxW,sz,weight,maxLines){
  var key=text+"|"+maxW+"|"+sz+"|"+weight+"|"+maxLines; var hit=wrapCache.get(key); if(hit)return hit;
  ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.font=fontStr(weight,sz*4);
  var words=String(text).split(/\s+/),lines=[],line="",lim=maxW*4;
  for(var i=0;i<words.length;i++){var w=words[i],tl=line?line+" "+w:w;
    if(ctx.measureText(tl).width<=lim){line=tl}else{ if(line)lines.push(line); line=w;
      while(ctx.measureText(line).width>lim&&line.length>4){ // hard-break very long tokens
        var cut=line.length-1; while(cut>1&&ctx.measureText(line.slice(0,cut)).width>lim)cut--; lines.push(line.slice(0,cut)); line=line.slice(cut);} }
    if(lines.length>=maxLines)break}
  if(line&&lines.length<maxLines)lines.push(line);
  var truncated=lines.length>=maxLines&&(lines.join(" ").length<String(text).length-2);
  if(truncated){var L=lines[maxLines-1]; while(L.length>1&&ctx.measureText(L+"…").width>lim)L=L.slice(0,-1); lines[maxLines-1]=L.replace(/[\s,;:]+$/,"")+"…"}
  ctx.restore(); if(wrapCache.size>6000)wrapCache.clear(); wrapCache.set(key,lines); return lines;
}

/* ---------- drawing ---------- */
function visible(q){ if(opt.show==="both")return true; return (opt.show==="black")===(q.k&&KIND[q.k].c==="b") }
function draw(){
  dirty=false;
  ctx.setTransform(dpr,0,0,dpr,0,0); ctx.fillStyle="#000"; ctx.fillRect(0,0,W,H);
  if(!B)return;
  if(MODE==="sudoku"&&LS&&SU){drawSudoku();return}
  var s=view.s,px=S*s;
  var c0=Math.max(0,Math.floor(-view.x/px)),c1=Math.min(B.cols-1,Math.floor((W-view.x)/px));
  var r0=Math.max(0,Math.floor(-view.y/px)),r1=Math.min(B.rows-1,Math.floor((H-view.y)/px));
  ctx.setTransform(dpr*s,0,0,dpr*s,dpr*view.x,dpr*view.y);
  // board frame
  ctx.fillStyle="#3a3a3a"; var fr=Math.max(2/s,4); ctx.fillRect(-fr,-fr,boardW()+2*fr,boardH()+2*fr);
  var onlyB=opt.show==="black",onlyW=opt.show==="white";
  var emptyB=onlyW?"#121212":"#161616",emptyW=onlyB?"#262626":"#5f5d58",fillB="#000",fillW="#f5f3ee";
  var hideB=onlyW?"#121212":null,hideW=onlyB?"#262626":null;
  var dim=!!opt.hits, ov=Math.max(0.6/s,0.4);
  // pass 1: cells
  for(var r=r0;r<=r1;r++){ var row=grid[r]; for(var c=c0;c<=c1;c++){
    var dark=((r+c)&1)===1, i=row[c], x=c*S,y=r*S;
    if(i<0){ ctx.fillStyle=dark?emptyB:emptyW; ctx.fillRect(x,y,S+ov,S+ov); continue }
    var q=B.sq[i], show=visible(q);
    if(!show){ ctx.fillStyle=dark?hideB:hideW; ctx.fillRect(x,y,S+ov,S+ov); continue }
    ctx.fillStyle=dark?fillB:fillW; ctx.fillRect(x,y,S+ov,S+ov);
    if(px>=5){ ctx.fillStyle=KIND[q.k].m; var m=S*(px<30?0.34:0.16); ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+m,y); ctx.lineTo(x,y+m); ctx.closePath(); ctx.fill() }
    if(q.th&&px>=12){ ctx.strokeStyle=dark?"rgba(214,178,94,.85)":"rgba(150,110,20,.9)"; ctx.lineWidth=Math.max(1.2/s,1.6); ctx.setLineDash([5,4]); ctx.strokeRect(x+3,y+3,S-6,S-6); ctx.setLineDash([]) }
    if(px>=46) drawText(q,x,y,dark,px,i);
    if(dim&&!opt.hits.has(i)){ ctx.fillStyle=dark?"rgba(0,0,0,.72)":"rgba(0,0,0,.62)"; ctx.fillRect(x,y,S+ov,S+ov) }
  }}
  // search hits & selection outlines
  if(opt.hits){ ctx.strokeStyle="#ffd400"; ctx.lineWidth=Math.max(2/s,3); opt.hits.forEach(function(i){var q=B.sq[i]; if(q.r>=r0&&q.r<=r1&&q.c>=c0&&q.c<=c1) ctx.strokeRect(q.c*S+1.5,q.r*S+1.5,S-3,S-3)}) }
  if(opt.sel>=0){ var q=B.sq[opt.sel]; ctx.strokeStyle="#22d3ee"; ctx.lineWidth=Math.max(3/s,5); ctx.strokeRect(q.c*S+2,q.r*S+2,S-4,S-4) }
  // era separators across the board
  ctx.strokeStyle="rgba(214,178,94,.9)"; ctx.lineWidth=Math.max(1.5/s,2);
  B.eras.forEach(function(e){ if(e.r0>0&&e.r0>=r0-1&&e.r0<=r1+1){ ctx.beginPath(); ctx.moveTo(-fr,e.r0*S); ctx.lineTo(boardW()+fr,e.r0*S); ctx.stroke() } });
  // screen-space labels: ranks (eras) sticky on the left, files sticky on top
  ctx.setTransform(dpr,0,0,dpr,0,0);
  drawRanks(px); drawFiles(px);
}
function drawText(q,x,y,dark,px,i){
  var on=KIND[q.k].c==="b"?opt.tb:opt.tw; if(!on)return;
  if(px>=640&&i!=null&&AR.idx){ if(drawPage(q,x,y,dark,px,i))return }
  var s=view.s, X=function(wx){return view.x+wx*s}, Y=function(wy){return view.y+wy*s};
  ctx.save(); ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.beginPath(); ctx.rect(X(x),Y(y),S*s,S*s); ctx.clip();
  var col=dark?KIND[q.k].t:"#111", sub=dark?"rgba(255,255,255,.62)":"rgba(0,0,0,.58)", pad=7, w=S-pad*2;
  var deep=px>=230, mid=px>=110;
  var ty=y+pad;
  ctx.textBaseline="top"; ctx.fillStyle=sub;
  var dsz=deep?4.4:(mid?6.2:8.5);
  if(q.d){ ctx.font=fontStr(500,dsz*s); ctx.fillText(String(q.d).toUpperCase(),X(x+pad+(px<60?0:9)),Y(y+pad-0.5)); ty=y+pad+dsz*1.35 }
  var tsz=deep?6.4:(mid?9:11.5), tl=deep?3:5, tw=dark&&q.k==="L"?400:600;
  ctx.fillStyle=col; ctx.font=fontStr(tw,tsz*s);
  var lines=wrap(q.t,w,tsz,tw,tl);
  for(var j=0;j<lines.length;j++){ ctx.fillText(lines[j],X(x+pad),Y(ty)); ty+=tsz*1.18 }
  if(deep){
    ty+=1.5; var bsz=4.15; ctx.font=fontStr(400,bsz*s); ctx.fillStyle=dark?(q.k==="L"?"#a3a3a3":q.k==="A"?"#ffc4bc":q.k==="K"?"#ddd6fe":"#f2f2f2"):"#1f1f1f";
    var fh=(q.th?2:1)*bsz*1.25+2, maxL=Math.max(1,Math.floor((y+S-pad-fh-ty)/(bsz*1.28)));
    var bl=wrap(q.x,w,bsz,400,maxL); for(var k=0;k<bl.length;k++){ ctx.fillText(bl[k],X(x+pad),Y(ty)); ty+=bsz*1.28 }
    var fy=y+S-pad-bsz*1.1; ctx.font=fontStr(500,3.5*s); ctx.fillStyle=sub;
    var src=q.src&&q.src[0]?("Source: "+q.src[0][0]):""; if(src) ctx.fillText(wrap(src,w,3.5,500,1)[0],X(x+pad),Y(fy));
    if(q.th){ ctx.fillStyle=dark?"#e6c983":"#7a5a10"; ctx.font=fontStr(600,3.4*s); ctx.fillText("Our case, prospective. Not a finding of any court.",X(x+pad),Y(fy-4.6)) }
    if(i!=null&&AR.idx&&AR.idx.cnt[i]){ ctx.font=fontStr(600,3.3*s); ctx.fillStyle=dark?"#67e8f9":"#0e7490"; ctx.textAlign="right";
      ctx.fillText("+ "+Math.round(AR.idx.chars[i]/5.8).toLocaleString()+" words of archive · zoom in",X(x+S-pad),Y(y+pad-0.5)); ctx.textAlign="left" }
  }
  ctx.restore();
}
function drawRanks(px){
  ctx.textBaseline="middle"; var lastBottom=-1e9;
  B.eras.forEach(function(e){
    var ya=view.y+e.r0*px, yb=view.y+e.r1*px; if(yb<0||ya>H)return; var hgt=yb-ya;
    var yc=Math.max(ya+12,Math.min(yb-12,Math.max(16,ya+12)));
    var right=(px>=110&&ya>16);
    if(right) yc=ya+11;
    if(yc-10<lastBottom+2) yc=lastBottom+12;          // a short band above: slide this label down inside its own band
    if(yc>yb-3) return;                                // no room left inside the band at this zoom
    var label=e.label+(hgt>40?"  ·  "+e.years:"");
    ctx.font=fontStr(600,hgt>40?12:10.5); var tw=ctx.measureText(label).width+14;
    var xL=Math.max(4,view.x+4); if(xL+tw>W-54)xL=Math.max(4,W-54-tw);
    if(right){ xL=Math.min(W-54,view.x+boardW()*view.s)-tw-4 }
    ctx.fillStyle="rgba(0,0,0,.78)"; ctx.fillRect(xL,yc-10,tw,20); ctx.strokeStyle="rgba(214,178,94,.9)"; ctx.lineWidth=1; ctx.strokeRect(xL+.5,yc-9.5,tw-1,19);
    ctx.fillStyle="#f1d9a0"; ctx.fillText(label,xL+7,yc+.5); lastBottom=yc+10;
  });
}
function fileName(c){var s="";c++;while(c>0){var m=(c-1)%26;s=String.fromCharCode(97+m)+s;c=Math.floor((c-1)/26)}return s}
function drawFiles(px){
  if(px<16)return; ctx.font=fontStr(600,10); ctx.textBaseline="top"; ctx.textAlign="center";
  var by=Math.max(2,view.y-14); if(view.y>16)by=view.y-14; else by=2;
  for(var c=0;c<B.cols;c++){ var xc=view.x+(c+.5)*px; if(xc<-20||xc>W+20)continue;
    ctx.fillStyle="rgba(0,0,0,.6)"; ctx.fillRect(xc-9,by-1,18,13); ctx.fillStyle="#cfcfcf"; ctx.fillText(fileName(c),xc,by) }
  ctx.textAlign="left";
}
function loop(now){ if(anim)anim(now); if(dirty)draw(); requestAnimationFrame(loop) }

/* ---------- input ---------- */
var ptrs=new Map(),drag=null,pinch=null,downAt=null;
cv.addEventListener("pointerdown",function(e){ cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY-y0}); anim=null;
  if(ptrs.size===1){drag={x:e.clientX,y:e.clientY,vx:view.x,vy:view.y}; downAt={x:e.clientX,y:e.clientY,t:performance.now()}}
  if(ptrs.size===2){var a=[...ptrs.values()]; pinch={d:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),s:view.s,cx:(a[0].x+a[1].x)/2,cy:(a[0].y+a[1].y)/2,vx:view.x,vy:view.y}; drag=null; downAt=null}
  hideHint();
});
cv.addEventListener("pointermove",function(e){ if(!ptrs.has(e.pointerId))return; ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY-y0});
  if(pinch&&ptrs.size>=2){var a=[...ptrs.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),cx=(a[0].x+a[1].x)/2,cy=(a[0].y+a[1].y)/2;
    var ns=Math.max(minS,Math.min(maxS,pinch.s*d/Math.max(1,pinch.d))),k=ns/pinch.s;
    view.s=ns; view.x=cx-(pinch.cx-pinch.vx)*k; view.y=cy-(pinch.cy-pinch.vy)*k; clampView(); dirty=true; return}
  if(drag){ view.x=drag.vx+(e.clientX-drag.x); view.y=drag.vy+(e.clientY-drag.y); clampView(); dirty=true; if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>4)cv.classList.add("drag") }
});
function up(e){ var wasTap=downAt&&ptrs.size===1&&Math.hypot(e.clientX-downAt.x,e.clientY-downAt.y)<7&&performance.now()-downAt.t<450;
  ptrs.delete(e.pointerId); cv.classList.remove("drag");
  if(ptrs.size<2)pinch=null;
  if(ptrs.size===1){var a=[...ptrs.values()][0]; drag={x:a.x,y:a.y+y0,vx:view.x,vy:view.y}} else drag=null;
  if(wasTap)tap(e.clientX,e.clientY-y0); downAt=null }
cv.addEventListener("pointerup",up); cv.addEventListener("pointercancel",function(e){ptrs.delete(e.pointerId);pinch=null;drag=null;downAt=null});
cv.addEventListener("wheel",function(e){ e.preventDefault(); anim=null; hideHint();
  var dy=e.deltaMode===1?e.deltaY*16:e.deltaY; var f=Math.exp(-dy*(e.ctrlKey?0.012:0.0018)); zoomAt(e.clientX,e.clientY-y0,f) },{passive:false});
cv.addEventListener("dblclick",function(e){ zoomAt(e.clientX,e.clientY-y0,2.2) });
window.addEventListener("keydown",function(e){ if(e.target.tagName==="INPUT")return;
  if(MODE==="sudoku"&&SU){ var modal=$("modal"); if(/^[1-9]$/.test(e.key)){suPlace(+e.key);return}
    if(SU.sel>=0&&/^Arrow/.test(e.key)){ var k=Math.floor(SU.sel/81),t=SU.sel%81,r=Math.floor(t/9),c=t%9;
      if(e.key==="ArrowUp")r=(r+8)%9; if(e.key==="ArrowDown")r=(r+1)%9; if(e.key==="ArrowLeft")c=(c+8)%9; if(e.key==="ArrowRight")c=(c+1)%9;
      SU.sel=k*81+r*9+c; suPad(); dirty=true; e.preventDefault(); return }
    if(e.key==="Escape"){ if(modal.classList.contains("open")){closeModal();return} } }
  if(e.key==="+"||e.key==="=")zoomAt(W/2,H/2,1.4); else if(e.key==="-")zoomAt(W/2,H/2,1/1.4); else if(e.key==="0"||e.key==="f")fit(true);
  else if(e.key==="Escape")closePanel(); else if(e.key==="ArrowRight"&&opt.sel>=0)step(1); else if(e.key==="ArrowLeft"&&opt.sel>=0)step(-1) });
function cellAt(px,py){ var c=Math.floor((px-view.x)/(S*view.s)),r=Math.floor((py-view.y)/(S*view.s)); if(r<0||c<0||r>=B.rows||c>=B.cols)return -1; return grid[r][c] }
function tap(px,py){ if(MODE==="sudoku"){ if(SU)suTap(px,py); return } var i=cellAt(px,py); if(i<0){closePanel();return} var q=B.sq[i]; if(!visible(q))return;
  var spx=S*view.s; if(spx<40){ // far out: zoom towards the tapped square first
    var ns=Math.min(maxS,Math.max(view.s*3.2,120/S)); var k=ns/view.s; go({s:ns,x:px-(px-view.x)*k,y:py-(py-view.y)*k},true); return }
  openPanel(i) }

/* ---------- panel ---------- */
var panel=$("panel");
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function openPanel(i){ var q=B.sq[i],k=KIND[q.k]; opt.sel=i; dirty=true;
  $("p-pill").className="pill "+k.c; $("p-pill").textContent=k.c==="b"?"Black square":"White square";
  $("p-kind").textContent=k.n; $("p-title").textContent=q.t; $("p-date").textContent=q.d||"Undated";
  $("p-text").textContent=q.x; $("p-theory").style.display=q.th?"block":"none";
  $("p-era").textContent=B.eras[q.e].label+" · "+B.eras[q.e].years+" · square "+fileName(q.c)+(q.r+1);
  $("p-srcs").innerHTML=(q.src||[]).map(function(s){return '<li><a href="'+esc(s[1])+'" target="_blank" rel="noopener">'+esc(s[0])+'</a></li>'}).join("")||"<li>—</li>";
  var pa=$("p-arch"); if(pa){ pa.innerHTML='<div class="srcs-h">Archive text in this square</div><p class="note">Loading…</p>';
    arChunks(i,function(ch){ if(opt.sel!==i)return; pa.innerHTML='<div class="srcs-h">Archive text in this square · '+ch.length+' extracts</div>'+ch.map(function(c){
      var sg=AR.idx.segs[c[0]]||[]; return '<div class="ach"><div class="kindtag">'+(sg[1]?'<a href="'+esc(sg[1])+'" target="_blank" rel="noopener">'+esc(segLabel(c))+'</a>':esc(segLabel(c)))+'</div>'+
        (c[2]?'<div class="theory">Our case, prospective. Not a finding of any court.</div>':'')+'<p>'+esc(c[3]).replace(/\n/g,"<br>")+'</p></div>' }).join("") }) }
  panel.classList.add("open"); history.replaceState(null,"","#s="+q.id);
}
function closePanel(){ panel.classList.remove("open"); opt.sel=-1; dirty=true; if(location.hash)history.replaceState(null,"",location.pathname+location.search) }
function step(d){ // previous/next square of the same colour in time order
  var q=B.sq[opt.sel],list=B.order[KIND[q.k].c],ix=list.indexOf(opt.sel),n=ix+d;
  while(n>=0&&n<list.length&&!visible(B.sq[list[n]]))n+=d;
  if(n<0||n>=list.length)return; openPanel(list[n]); flyToSquare(list[n],Math.min(W,H)*0.5) }
$("p-close").onclick=closePanel; $("p-prev").onclick=function(){step(-1)}; $("p-next").onclick=function(){step(1)};
$("p-zoom").onclick=function(){ if(opt.sel>=0)flyToSquare(opt.sel) };
$("p-copy").onclick=function(){ var u=location.origin+location.pathname+"#s="+B.sq[opt.sel].id; if(navigator.clipboard)navigator.clipboard.writeText(u); this.textContent="Copied"; var b=this; setTimeout(function(){b.textContent="Copy link"},1500) };

/* ---------- toolbar ---------- */
document.querySelectorAll("[data-show]").forEach(function(b){ b.onclick=function(){ opt.show=b.getAttribute("data-show");
  document.querySelectorAll("[data-show]").forEach(function(x){x.setAttribute("aria-pressed",x===b?"true":"false")}); dirty=true; runSearch() } });
document.querySelectorAll("[data-mode]").forEach(function(b){ b.onclick=function(){ setMode(b.getAttribute("data-mode")) } });
document.querySelectorAll("#pad [data-d]").forEach(function(b){ b.onclick=function(){ suPlace(+b.getAttribute("data-d")) } });
$("pz-prev").onclick=function(){suGo(-1)}; $("pz-next").onclick=function(){suGo(1)};
$("pz-hint").onclick=suRevealCell; $("pz-all").onclick=suRevealAll; $("pz-story").onclick=function(){openStory(SU.cur)}; $("pz-reset").onclick=suReset;
$("m-close").onclick=closeModal; $("st-close").onclick=function(){$("story").classList.remove("open")};
$("modal").addEventListener("click",function(e){ if(e.target===$("modal"))closeModal() });
$("tb").onchange=function(){opt.tb=this.checked;dirty=true}; $("tw").onchange=function(){opt.tw=this.checked;dirty=true};
$("fit").onclick=function(){ if(MODE==="sudoku"&&LS){ var s=Math.min((W-16)/boardW(),(H-16)/boardH()); minS=Math.min(minS,s*0.6); go({s:s,x:(W-boardW()*s)/2,y:Math.max(8,(H-boardH()*s)/2)},true) } else fit(true)}; $("zin").onclick=function(){zoomAt(W/2,H/2,1.6)}; $("zout").onclick=function(){zoomAt(W/2,H/2,1/1.6)};
$("legend-btn").onclick=function(){$("legend").classList.add("open")}; $("l-close").onclick=function(){$("legend").classList.remove("open")};
var sTimer=null; $("q").addEventListener("input",function(){clearTimeout(sTimer); sTimer=setTimeout(runSearch,180)});
$("q").addEventListener("keydown",function(e){ if(e.key==="Enter"){e.preventDefault(); nextHit()} });
$("qnext").onclick=nextHit;
$("qtoggle").onclick=function(){var r=$("searchrow");r.classList.toggle("open");resize();if(r.classList.contains("open"))$("q").focus()};
function runSearch(){ var v=$("q").value.trim().toLowerCase(); opt.q=v;
  if(v.length<2){opt.hits=null;opt.hitList=[];$("qc").textContent="";dirty=true;return}
  var terms=v.split(/\s+/),hits=new Set(),list=[];
  for(var i=0;i<B.sq.length;i++){var q=B.sq[i]; if(!visible(q))continue; var h=q._h||(q._h=(q.t+" "+q.x+" "+(q.d||"")+" "+(q.src||[]).map(function(s){return s[0]}).join(" ")+" "+q.id).toLowerCase());
    if(terms.every(function(t){return h.indexOf(t)>=0})){hits.add(i);list.push(i)}}
  list.sort(function(a,b){return B.sq[a].r-B.sq[b].r||B.sq[a].c-B.sq[b].c});
  opt.hits=hits; opt.hitList=list; opt.hitIx=-1; $("qc").textContent=list.length+" found"; dirty=true }
function nextHit(){ if(!opt.hitList.length){runSearch(); if(!opt.hitList.length)return}
  opt.hitIx=(opt.hitIx+1)%opt.hitList.length; var i=opt.hitList[opt.hitIx]; flyToSquare(i); openPanel(i); $("qc").textContent=(opt.hitIx+1)+" / "+opt.hitList.length }

var hintEl=$("hint"); function hideHint(){ if(hintEl){hintEl.style.opacity=0; setTimeout(function(){if(hintEl)hintEl.remove(); hintEl=null},700)} }


/* ---------- archive text: the free archive edition + public GHF sites, distributed into the squares ---------- */
function pad2(n){return (n<10?"0":"")+n}
function arLoadIndex(){ return fetch("/data/archive/index.json",{cache:"no-cache"}).then(function(r){return r.json()}).then(function(j){AR.idx=j;dirty=true}).catch(function(){}) }
function gunzipText(buf){ var u=new Uint8Array(buf);
  if(u[0]===0x1f&&u[1]===0x8b){ if(!window.DecompressionStream)return Promise.reject(new Error("no gzip"));
    return new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream("gzip"))).text() }
  return Promise.resolve(new TextDecoder().decode(u)) }
function arShard(i,cb){ if(!AR.idx){ if(cb)arLoadIndex().then(function(){arShard(i,cb)}); return null }
  var sh=Math.floor(i/AR.idx.shard);
  if(AR.sh[sh]){ if(cb)cb(AR.sh[sh]); return AR.sh[sh] }
  if(cb)(AR.wait[sh]=AR.wait[sh]||[]).push(cb);
  if(!AR.pend[sh]){ AR.pend[sh]=1;
    fetch("/data/archive/a-"+pad2(sh)+".json.gz").then(function(r){if(!r.ok)throw new Error(r.status);return r.arrayBuffer()}).then(gunzipText).then(function(t){
      AR.sh[sh]=JSON.parse(t).sq; dirty=true; var w=AR.wait[sh]||[]; AR.wait[sh]=[]; w.forEach(function(f){try{f(AR.sh[sh])}catch(e){}}) })
    .catch(function(){ setTimeout(function(){AR.pend[sh]=0},4000) }) }
  return null }
function arChunks(i,cb){ var sh=arShard(i,cb?function(d){cb(d[B.sq[i].id]||[])}:null); return sh?(sh[B.sq[i].id]||[]):null }
function segLabel(c){ var sg=AR.idx.segs[c[0]]||["",null,null,0]; return (sg[2]?"Legal Wiki archive edition, p. "+sg[2]+" · ":"Public site · ")+sg[0] }
/* page layout: header + the square's archive text set in newspaper columns, auto-fitted to the square */
var wordW=new Map(),pageCache=new Map(),EMF=100;
function ww(word,wt){ var k=wt+"|"+word, v=wordW.get(k); if(v!=null)return v;
  ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.font=fontStr(wt,EMF); v=ctx.measureText(word).width/EMF; ctx.restore();
  if(wordW.size>200000)wordW.clear(); wordW.set(k,v); return v }
function blocksFor(chunks){ var out=[];
  chunks.forEach(function(c,n){ out.push({k:1,t:segLabel(c)}); if(c[2])out.push({k:2,t:"Theory · Our case, prospective. Not a finding of any court."});
    String(c[3]).split("\n").forEach(function(p){ if(p.trim())out.push({k:0,t:p.trim()}) }); out.push({k:3}) });
  return out }
function wrapEm(text,maxEm,wt){ var words=text.split(/\s+/),lines=[],line="",lw=0,sp=ww(" ",wt);
  for(var i=0;i<words.length;i++){ var w=words[i]; if(!w)continue; var wd=ww(w,wt);
    if(!line){line=w;lw=wd} else if(lw+sp+wd<=maxEm){line+=" "+w;lw+=sp+wd} else {lines.push(line);line=w;lw=wd}
    while(lw>maxEm&&line.length>6){ var cut=Math.max(4,Math.floor(line.length*maxEm/lw)); lines.push(line.slice(0,cut)); line=line.slice(cut); lw=ww(line,wt) } }
  if(line)lines.push(line); return lines }
function flow(blocks,f,ncol,colW,colH){ // returns lines with col & y, or null if it overflows
  var lh=f*1.3, out=[], col=0, y=0;
  for(var b=0;b<blocks.length;b++){ var bl=blocks[b];
    if(bl.k===3){ y+=lh*0.45; continue }
    var fs=bl.k?f*0.82:f, wt=bl.k?600:400, ls=wrapEm(bl.t,colW/fs,wt), l2=fs*1.3;
    for(var j=0;j<ls.length;j++){ if(y+l2>colH){ col++; y=0; if(col>=ncol)return null }
      out.push({t:ls[j],k:bl.k,c:col,y:y,f:fs}); y+=l2 } }
  return out }
function pageLayout(i,chunks){ var hit=pageCache.get(i); if(hit)return hit;
  var q=B.sq[i], pad=5, w=S-pad*2, hdr=pad+3.2*1.35+4.6*1.15*2+2.6*1.3*3+3, colH=S-pad-4.2-hdr, gap=2.2, blocks=blocksFor(chunks), best=null;
  for(var n=1;n<=6;n++){ var colW=(w-gap*(n-1))/n, lo=0.25, hi=3.2, ok=null;
    for(var it=0;it<15;it++){ var mid=(lo+hi)/2, r=flow(blocks,mid,n,colW,colH); if(r){ok={f:mid,lines:r};lo=mid}else hi=mid }
    if(ok&&colW/(0.5*ok.f)>=30&&(!best||ok.f>best.f)) best={f:ok.f,lines:ok.lines,n:n,colW:colW} }
  if(!best){ var colW=(w-gap*5)/6, r=flow(blocks,0.25,6,colW,1e9); best={f:0.25,lines:r,n:6,colW:colW} }
  best.hdr=hdr; best.gap=gap; best.pad=pad;
  var title=wrap(q.t,w,4.6,600,2), summ=wrap(q.x,w,2.6,400,3); best.title=title; best.summ=summ;
  pageCache.set(i,best); if(pageCache.size>60)pageCache.delete(pageCache.keys().next().value); return best }
function drawPage(q,x,y,dark,px,i){
  var ch=arChunks(i); if(!ch)return false; if(!ch.length)return false;
  var P=pageLayout(i,ch), s=view.s, X=function(wx){return view.x+wx*s}, Y=function(wy){return view.y+wy*s};
  ctx.save(); ctx.setTransform(dpr,0,0,dpr,0,0); ctx.beginPath(); ctx.rect(X(x),Y(y),S*s,S*s); ctx.clip(); ctx.textBaseline="top";
  var ink=dark?"#ececec":"#141414", sub=dark?"rgba(255,255,255,.6)":"rgba(0,0,0,.58)", gold=dark?"#e6c983":"#7a5a10", pad=P.pad, ty=y+pad;
  ctx.fillStyle=sub; ctx.font=fontStr(500,3.2*s); ctx.fillText(((q.d||"Undated")+" · "+(KIND[q.k].c==="b"?"black square":"white square")+" · "+ch.length+" archive extracts").toUpperCase(),X(x+pad),Y(ty)); ty+=3.2*1.35;
  ctx.fillStyle=dark?KIND[q.k].t:"#111"; ctx.font=fontStr(600,4.6*s); P.title.forEach(function(l){ctx.fillText(l,X(x+pad),Y(ty));ty+=4.6*1.15});
  ctx.fillStyle=sub; ctx.font=fontStr(400,2.6*s); P.summ.forEach(function(l){ctx.fillText(l,X(x+pad),Y(ty));ty+=2.6*1.3});
  var yb=y+P.hdr; ctx.strokeStyle=dark?"rgba(255,255,255,.25)":"rgba(0,0,0,.25)"; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(X(x+pad),Y(yb-1.2)); ctx.lineTo(X(x+S-pad),Y(yb-1.2)); ctx.stroke();
  var lastK=-1,lastF=0;
  for(var j=0;j<P.lines.length;j++){ var ln=P.lines[j], lx=x+pad+ln.c*(P.colW+P.gap), ly=yb+ln.y, sy=Y(ly);
    if(sy>H+20||sy+ln.f*s*1.4<-20||X(lx)>W||X(lx+P.colW)<0)continue;
    if(ln.k!==lastK||ln.f!==lastF){ ctx.font=fontStr(ln.k?600:400,ln.f*s); ctx.fillStyle=ln.k===1?sub:ln.k===2?gold:ink; lastK=ln.k; lastF=ln.f }
    ctx.fillText(ln.t,X(lx),sy) }
  ctx.fillStyle=sub; ctx.font=fontStr(500,2.4*s);
  ctx.fillText(q.th?"Our case, prospective. Not a finding of any court. · Text distributed from the free archive edition and the public GHF sites":"Text distributed from the free archive edition (v0.1.0) and the public GHF sites · tap for the full text",X(x+pad),Y(y+S-pad-2.6));
  ctx.restore(); return true }

/* ---------- sudoku board: the same 808 squares, in time order, poured into ten 9×9 sudoku grids ---------- */
var SKEY="ghf-sudoku-v1";
function suLoad(j){
  SU={P:j.puzzles.map(function(p){ var ids=[].concat.apply([],p.x), idx=ids.map(function(id){return B.sq.findIndex(function(q){return q.id===id})});
      var cum=[0]; p.x.forEach(function(g){cum.push(cum[cum.length-1]+g.length)});
      return {n:p.n,title:p.title,g:p.g.split("").map(Number),s:p.s.split("").map(Number),x:p.x,rec:idx,cum:cum,blanks:p.g.split("").filter(function(c){return c==="0"}).length} }),
    cur:0,sel:-1,e:{},flash:null,err:0};
  try{ var st=JSON.parse(localStorage.getItem(SKEY)||"{}"); if(st.e)SU.e=st.e; if(st.cur>=0&&st.cur<SU.P.length)SU.cur=st.cur }catch(e){}
  SU.P.forEach(function(p,k){ var e=SU.e[k]; if(!e||e.length!==81)SU.e[k]="0".repeat(81);
    // keep only correct entries in blank cells
    var a=SU.e[k].split("").map(Number); for(var c=0;c<81;c++){ if(p.g[c]||a[c]!==p.s[c])a[c]=0 } SU.e[k]=a.join("") });
  suLayout(); suPad() }
function suSave(){ try{localStorage.setItem(SKEY,JSON.stringify({cur:SU.cur,e:SU.e}))}catch(e){} }
function suSolved(k){ var a=SU.e[k],n=0; for(var c=0;c<81;c++)if(a.charCodeAt(c)!==48)n++; return n }
function suLit(k){ var p=SU.P[k]; return p.cum[Math.min(p.x.length,suSolved(k))] }
function suDigit(k,c){ var p=SU.P[k]; return p.g[c]||(SU.e[k].charCodeAt(c)-48) }
function suLayout(){
  var BC=(W>H*1.15)?5:2, BR=Math.ceil(SU.P.length/BC);
  LS={cols:BC*10-1,rows:BR*10,BC:BC,pr:new Int32Array(B.sq.length).fill(-1),pc:new Int32Array(B.sq.length).fill(-1),cell:new Int32Array(B.sq.length).fill(-1)};
  SU.P.forEach(function(p,k){ var br=Math.floor(k/BC),bc=k%BC;
    p.rec.forEach(function(i,t){ if(i<0)return; LS.pr[i]=br*10+1+Math.floor(t/9); LS.pc[i]=bc*10+t%9; LS.cell[i]=k*81+t }) });
}
function suAt(r,c){ if(!LS||r<0||c<0||r>=LS.rows||c>=LS.cols)return null; var br=Math.floor(r/10),bc=Math.floor(c/10),rr=r%10-1,cc=c%10;
  if(cc>8)return null; var k=br*LS.BC+bc; if(k>=SU.P.length)return null; if(rr<0)return {k:k,label:true}; return {k:k,t:rr*9+cc} }
function blockFit(k,animate){ var br=Math.floor(k/LS.BC),bc=k%LS.BC, pad=Math.min(W,H)<500?8:24;
  var s=Math.min((W-pad*2)/(9*S),(H-pad*2)/(10*S)); s=Math.min(maxS,s);
  go({s:s,x:W/2-(bc*10+4.5)*S*s,y:H/2-(br*10+5)*S*s},animate) }
function drawSudoku(){
  var s=view.s,px=S*s;
  var c0=Math.max(0,Math.floor(-view.x/px)),c1=Math.min(LS.cols-1,Math.floor((W-view.x)/px));
  var r0=Math.max(0,Math.floor(-view.y/px)),r1=Math.min(LS.rows-1,Math.floor((H-view.y)/px));
  ctx.setTransform(dpr*s,0,0,dpr*s,dpr*view.x,dpr*view.y);
  var ov=Math.max(0.6/s,0.4), now=performance.now();
  var sk=SU.sel>=0?Math.floor(SU.sel/81):-1, st=SU.sel>=0?SU.sel%81:-1;
  for(var r=r0;r<=r1;r++)for(var c=c0;c<=c1;c++){ var a=suAt(r,c); if(!a||a.label)continue;
    var p=SU.P[a.k], i=p.rec[a.t], q=i>=0?B.sq[i]:null, x=c*S, y=r*S, lit=a.t<suLit(a.k);
    var dark=q?KIND[q.k].c==="b":true, show=q&&visible(q);
    if(!q){ ctx.fillStyle="#0c0c0c"; ctx.fillRect(x,y,S+ov,S+ov) }
    else if(!show){ ctx.fillStyle=dark?"#0f0f0f":"#262626"; ctx.fillRect(x,y,S+ov,S+ov) }
    else if(lit){ ctx.fillStyle=dark?"#000":"#f5f3ee"; ctx.fillRect(x,y,S+ov,S+ov);
      if(px>=5){ ctx.fillStyle=KIND[q.k].m; var m=S*(px<30?0.34:0.16); ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+m,y); ctx.lineTo(x,y+m); ctx.closePath(); ctx.fill() }
      if(q.th&&px>=12){ ctx.strokeStyle=dark?"rgba(214,178,94,.85)":"rgba(150,110,20,.9)"; ctx.lineWidth=Math.max(1.2/s,1.6); ctx.setLineDash([5,4]); ctx.strokeRect(x+3,y+3,S-6,S-6); ctx.setLineDash([]) } }
    else { ctx.fillStyle=dark?"#151515":"#3d3b36"; ctx.fillRect(x,y,S+ov,S+ov) }
    if(a.k===sk&&(Math.floor(a.t/9)===Math.floor(st/9)||a.t%9===st%9||(Math.floor(a.t/27)===Math.floor(st/27)&&Math.floor(a.t%9/3)===Math.floor(st%9/3)))){ ctx.fillStyle="rgba(34,211,238,.13)"; ctx.fillRect(x,y,S,S) }
    if(SU.flash&&SU.flash.k===a.k&&SU.flash.t===a.t){ if(now<SU.flash.until){ctx.fillStyle="rgba(229,72,77,.55)";ctx.fillRect(x,y,S,S);dirty=true}else SU.flash=null }
    var d=suDigit(a.k,a.t), given=!!p.g[a.t], textOn=lit&&show&&px>=46&&(KIND[q.k].c==="b"?opt.tb:opt.tw);
    if(textOn) drawText(q,x,y,dark,px,i);
    if(d){ var light=lit&&show&&!dark, col=given?(light?"#8a6a12":"#d6b25e"):(light?"#0e7490":"#22d3ee");
      ctx.fillStyle=col; ctx.textBaseline="middle"; ctx.textAlign="center";
      if(textOn){ ctx.font=fontStr(700,16); ctx.fillText(d,x+S-11,y+S-11) } else { ctx.font=fontStr(given?700:500,62); ctx.fillText(d,x+S/2,y+S/2+3) }
      ctx.textAlign="left"; ctx.textBaseline="alphabetic" } }
  // grid lines, frames and labels per block
  for(var k=0;k<SU.P.length;k++){ var br=Math.floor(k/LS.BC),bc=k%LS.BC, bx=bc*10*S, by=(br*10+1)*S;
    if(bx>(W-view.x)/s||bx+9*S<-view.x/s||by>(H-view.y)/s||by+9*S<(-view.y/s)-S)continue;
    for(var g=1;g<9;g++){ var thick=g%3===0; ctx.strokeStyle=thick?"rgba(214,178,94,.95)":"rgba(140,140,140,.55)"; ctx.lineWidth=thick?Math.max(2.2/s,3.2):Math.max(0.8/s,0.9);
      ctx.beginPath(); ctx.moveTo(bx+g*S,by); ctx.lineTo(bx+g*S,by+9*S); ctx.moveTo(bx,by+g*S); ctx.lineTo(bx+9*S,by+g*S); ctx.stroke() }
    ctx.strokeStyle=k===SU.cur?"#22d3ee":"rgba(214,178,94,.95)"; ctx.lineWidth=Math.max(3/s,4.5); ctx.strokeRect(bx,by,9*S,9*S);
    if(sk===k){ var sx=bx+(st%9)*S, sy=by+Math.floor(st/9)*S; ctx.strokeStyle="#22d3ee"; ctx.lineWidth=Math.max(3/s,5); ctx.strokeRect(sx+2,sy+2,S-4,S-4) }
    // label in the row above the block (screen-sized text)
    ctx.save(); ctx.setTransform(dpr,0,0,dpr,0,0); var lx=view.x+bx*s, ly=view.y+(by-S*0.5)*s, done=suSolved(k), P=SU.P[k];
    var fs=Math.max(9,Math.min(15,S*s*0.36)); ctx.font=fontStr(600,fs); ctx.textBaseline="middle";
    var lab="PUZZLE "+P.n+" · "+done+"/"+P.blanks+(done===P.blanks?" · SOLVED":"")+"  —  "+P.title;
    var maxw=9*S*s; while(lab.length>12&&ctx.measureText(lab).width>maxw)lab=lab.slice(0,-2);
    if(S*s>=8){ ctx.fillStyle=done===P.blanks?"#86efac":"#f1d9a0"; ctx.fillText(lab,lx,ly) }
    ctx.restore() }
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
function suTap(px,py){ var c=Math.floor((px-view.x)/(S*view.s)),r=Math.floor((py-view.y)/(S*view.s)), a=suAt(r,c);
  if(!a){ SU.sel=-1; suPad(); dirty=true; return }
  if(a.k!==SU.cur){ SU.cur=a.k; suSave() }
  if(a.label||S*view.s<26){ SU.sel=-1; blockFit(a.k,true); suPad(); dirty=true; return }
  var p=SU.P[a.k], i=p.rec[a.t];
  if(!suDigit(a.k,a.t)){ SU.sel=a.k*81+a.t; suPad(); dirty=true; return }
  SU.sel=a.k*81+a.t; suPad(); dirty=true;
  if(i>=0&&a.t<suLit(a.k)) openPanel(i) }
function suPlace(d){ if(SU.sel<0){ toast("Tap an empty cell first"); return }
  var k=Math.floor(SU.sel/81),t=SU.sel%81,p=SU.P[k]; if(suDigit(k,t))return;
  if(p.s[t]!==d){ SU.flash={k:k,t:t,until:performance.now()+650}; SU.err++; dirty=true; if(navigator.vibrate)try{navigator.vibrate(60)}catch(e){}; toast(d+" doesn't fit there — try again"); return }
  var a=SU.e[k].split(""); a[t]=String(d); SU.e[k]=a.join(""); suSave();
  var n=suSolved(k); dirty=true;
  // move selection to the next empty cell in the same row/box for quick play
  SU.sel=-1; suPad(); showExtract(k,n-1,n===p.blanks) }
function suRevealCell(){ var k=SU.sel>=0?Math.floor(SU.sel/81):SU.cur,p=SU.P[k],t=SU.sel>=0?SU.sel%81:-1;
  if(t<0||suDigit(k,t)){ t=-1; for(var c=0;c<81;c++)if(!suDigit(k,c)){t=c;break} }
  if(t<0){ toast("This puzzle is already complete"); return }
  SU.cur=k; SU.sel=k*81+t; suPlace(p.s[t]) }
function suRevealAll(){ var k=SU.cur,p=SU.P[k];
  if(suSolved(k)===p.blanks){ openStory(k); return }
  if(!confirm("Reveal every number in puzzle "+p.n+"? The whole chapter of the story opens in the Story list."))return;
  SU.e[k]=p.s.map(function(v,c){return p.g[c]?0:v}).join(""); suSave(); SU.sel=-1; dirty=true; suPad(); openStory(k) }
function suReset(){ var k=SU.cur,p=SU.P[k]; if(!confirm("Clear your numbers in puzzle "+p.n+"?"))return; SU.e[k]="0".repeat(81); SU.sel=-1; suSave(); suPad(); dirty=true }
function suGo(d){ SU.cur=(SU.cur+d+SU.P.length)%SU.P.length; SU.sel=-1; suSave(); suPad(); blockFit(SU.cur,true) }
function suPad(){ if(!SU)return; var k=SU.cur,p=SU.P[k],n=suSolved(k);
  $("pz-t").textContent="Puzzle "+p.n+"/"+SU.P.length+" · "+n+"/"+p.blanks; $("pz-s").textContent=p.title;
  var sel=SU.sel>=0&&Math.floor(SU.sel/81)===k?SU.sel%81:-1;
  document.querySelectorAll("#pad [data-d]").forEach(function(b){ var d=+b.getAttribute("data-d"), used=0;
    for(var c=0;c<81;c++)if(suDigit(k,c)===d)used++; b.classList.toggle("done",used>=9); b.disabled=used>=9 });
  $("pad").classList.toggle("armed",sel>=0) }
/* floating modal: the next extract of the story */
var modal=$("modal");
function recHTML(i){ var q=B.sq[i],k=KIND[q.k];
  return '<div class="ex"><div class="ex-h"><span class="pill '+k.c+'">'+(k.c==="b"?"Black square":"White square")+'</span> <span class="kindtag">'+esc(q.d||"Undated")+'</span></div>'+
    '<div class="ex-t">'+esc(q.t)+'</div>'+(q.th?'<div class="theory">Our case, prospective. Not a finding of any court.</div>':'')+
    '<div class="ex-x">'+esc(q.x)+'</div>'+((q.src&&q.src[0])?'<div class="ex-s">Source: <a href="'+esc(q.src[0][1])+'" target="_blank" rel="noopener">'+esc(q.src[0][0])+'</a></div>':'')+
    '<div class="ex-a" data-arch="'+i+'"><span class="kindtag">From the archive text in this square…</span></div>'+
    '<div class="navrow"><button class="btn" data-read="'+i+'">Read the square</button><button class="btn" data-board="'+i+'">Show on chessboard</button></div></div>' }
function fillArch(el){ var i=+el.getAttribute("data-arch");
  arChunks(i,function(ch){ if(!ch.length){el.innerHTML="";return}
    var c=ch.slice().sort(function(a,b){ var la=String(a[3]).split("\n"), lb=String(b[3]).split("\n"); return String(b[3]).length/lb.length-String(a[3]).length/la.length })[0], t=String(c[3]); if(t.length>520)t=t.slice(0,t.lastIndexOf(" ",500))+"…";
    el.innerHTML='<div class="kindtag">From the archive · '+esc(segLabel(c))+'</div>'+(c[2]?'<div class="theory">Our case, prospective. Not a finding of any court.</div>':'')+'<p>'+esc(t).replace(/\n/g,"<br>")+'</p><div class="kindtag">'+ch.length+' extracts in this square</div>' }) }
function showExtract(k,g,complete){ var p=SU.P[k], ids=p.x[g]||[], recs=ids.map(function(id){return B.sq.findIndex(function(q){return q.id===id})}).filter(function(i){return i>=0});
  var vis=recs.filter(function(i){return visible(B.sq[i])});
  $("m-h").textContent="Puzzle "+p.n+" · extract "+(g+1)+" of "+p.blanks;
  $("m-b").innerHTML=(complete?'<div class="won">Puzzle '+p.n+' complete. Chapter “'+esc(p.title)+'” is fully open.</div>':'')+
    (vis.length?vis.map(recHTML).join(""):'<p class="note">This extract is a '+(opt.show==="black"?"white":"black")+' square, hidden by the '+(opt.show==="black"?"Black":"White")+' only filter.</p>');
  $("m-next").textContent=complete&&k<SU.P.length-1?"Next puzzle ›":"Continue";
  $("m-next").onclick=function(){ closeModal(); if(complete&&k<SU.P.length-1)suGo(1) };
  modal.querySelectorAll("[data-arch]").forEach(fillArch);
  modal.querySelectorAll("[data-read]").forEach(function(b){b.onclick=function(){closeModal();openPanel(+b.getAttribute("data-read"))}});
  modal.querySelectorAll("[data-board]").forEach(function(b){b.onclick=function(){var i=+b.getAttribute("data-board");closeModal();setMode("chess");setTimeout(function(){flyToSquare(i);openPanel(i)},60)}});
  modal.classList.add("open"); $("m-b").scrollTop=0; dirty=true }
function closeModal(){ modal.classList.remove("open") }
function openStory(k){ var p=SU.P[k], n=suSolved(k);
  $("st-h").textContent="Puzzle "+p.n+" · "+p.title+" · "+n+" of "+p.blanks+" extracts open";
  var html=""; for(var g=0;g<n;g++){ var ids=p.x[g]; var first=B.sq.find(function(q){return q.id===ids[0]});
    html+='<li><button class="lnk" data-g="'+g+'"><b>'+(g+1)+'.</b> '+esc((first.d||"Undated")+" — "+first.t)+(ids.length>1?' <span class="kindtag">+'+(ids.length-1)+' more</span>':'')+'</button></li>' }
  $("st-l").innerHTML=html||'<li class="note">Nothing open yet. Each correct number opens the next extract.</li>';
  $("st-l").querySelectorAll("[data-g]").forEach(function(b){b.onclick=function(){$("story").classList.remove("open");showExtract(k,+b.getAttribute("data-g"),false)}});
  $("story").classList.add("open") }
var toastT=null; function toast(t){ var el=$("toast"); el.textContent=t; el.classList.add("on"); clearTimeout(toastT); toastT=setTimeout(function(){el.classList.remove("on")},1600) }
function setMode(m){ if(m===MODE)return; MODE=m; document.body.classList.toggle("su",m==="sudoku");
  document.querySelectorAll("[data-mode]").forEach(function(x){x.setAttribute("aria-pressed",x.getAttribute("data-mode")===m?"true":"false")});
  try{localStorage.setItem("ghf-chess-mode",m)}catch(e){}
  if(m==="sudoku"&&!SU){ fetch("/data/sudoku.json",{cache:"no-cache"}).then(function(r){return r.json()}).then(function(j){ suLoad(j); resize(); blockFit(SU.cur,false); dirty=true }); resize(); return }
  closeModal(); resize(); if(m==="sudoku"){ suLayout(); suPad(); resize(); blockFit(SU.cur,false) } else fit(false); dirty=true }

/* ---------- load ---------- */
function build(){
  grid=[]; for(var r=0;r<B.rows;r++){grid.push(new Int32Array(B.cols).fill(-1))}
  B.order={b:[],w:[]};
  B.sq.forEach(function(q,i){ grid[q.r][q.c]=i; B.order[KIND[q.k].c].push(i) });
  B.order.b.sort(function(a,b){return B.sq[a].r-B.sq[b].r||B.sq[a].c-B.sq[b].c}); B.order.w.sort(function(a,b){return B.sq[a].r-B.sq[b].r||B.sq[a].c-B.sq[b].c});
  // legend counts
  var cnt={}; B.sq.forEach(function(q){cnt[q.k]=(cnt[q.k]||0)+1});
  Object.keys(KIND).forEach(function(k){var el=document.querySelector('[data-n="'+k+'"]'); if(el)el.textContent=cnt[k]||0});
  var nb=B.order.b.length,nw=B.order.w.length; $("cnt").textContent=nb+" black · "+nw+" white";
  $("nb").textContent=nb; $("nw").textContent=nw; $("built").textContent=B.built;
}
fetch("/data/board.json",{cache:"no-cache"}).then(function(r){return r.json()}).then(function(j){
  B=j; build(); resize(); fit(false); $("loading").remove(); arLoadIndex();
  var wantSu=/[?&#]mode=sudoku/.test(location.search+location.hash); try{ if(!/#s=/.test(location.hash)&&localStorage.getItem("ghf-chess-mode")==="sudoku")wantSu=true }catch(e){}
  if(wantSu)setMode("sudoku");
  var m=/#s=([\w-]+)/.exec(location.hash); if(m){ var i=B.sq.findIndex(function(q){return q.id===m[1]}); if(i>=0){openPanel(i); setTimeout(function(){flyToSquare(i)},250)} }
  setTimeout(hideHint,4500);
}).catch(function(e){ $("loading").textContent="Could not load the board. Please reload." });
window.addEventListener("resize",function(){ var had=B&&view.s; resize(); if(B&&!had)fit(false);
  if(MODE==="sudoku"&&SU&&LS){ var bc=(W>H*1.15)?5:2; if(bc!==LS.BC){ suLayout(); blockFit(SU.cur,false) } } });
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){wrapCache.clear();dirty=true});
requestAnimationFrame(loop);
window.ChessBoard={fit:function(){fit(false)},zoomTo:function(id,px,open){var i=B.sq.findIndex(function(q){return q.id===id});if(i<0)return false;anim=null;var s=Math.min(maxS,(px||Math.min(W,H)*0.78)/S);view={s:s,x:W/2-(B.sq[i].c+.5)*S*s,y:H/2-(B.sq[i].r+.5)*S*s};dirty=true;if(open)openPanel(i);return true},
  ids:function(){return B.sq.map(function(q){return q.id})},view:function(){return view},
  mode:setMode, su:function(){return SU}, place:suPlace, select:function(k,t){SU.cur=k;SU.sel=k*81+t;suPad();dirty=true}, block:function(k){blockFit(k,false)},
  arch:function(i,cb){return arChunks(i,cb)}, panel:openPanel};
})();
