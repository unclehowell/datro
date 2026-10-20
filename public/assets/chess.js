/* chess.bucklerfamily.estate — one giant zoomable chessboard of the Great House Farm / Tŷ Mawr record.
   Custom canvas renderer: colours from afar; closer in, each square shows its own date, title and short paragraph inside the square;
   tap a square (Read more) for a modal with all its text and Visit website links to the exact source passage. v2, 20 Oct 2026.
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
var view={s:0.1,x:0,y:0},minS=0.01,maxS=3.6;
var MODE="chess",LS=null;   // MODE chess|sudoku; LS = sudoku layout
var AR={idx:null,sh:{},pend:{},wait:{}};
var opt={show:"both",tb:true,tw:true,q:"",hits:null,hitList:[],hitIx:-1,sel:-1};
var wrapCache=new Map(),dirty=true,anim=null;

function $(id){return document.getElementById(id)}
function fontStr(w,sz){return w+" "+sz+"px Barlow, Helvetica Neue, Arial, sans-serif"}

/* ---------- layout (chessboard or sudoku board) ---------- */
function L(){return B}
function posR(i){return B.sq[i].r}
function posC(i){return B.sq[i].c}
function padH(){return 0}
/* ---------- sizing ---------- */
function resize(){
  dpr=Math.min(window.devicePixelRatio||1,2);
  y0=top.getBoundingClientRect().height; var fh=foot.getBoundingClientRect().height;
  W=window.innerWidth; var ph=padH(); H=Math.max(100,window.innerHeight-y0-fh-ph);
  cv.style.top=y0+"px"; cv.style.height=H+"px"; cv.style.bottom="auto";
  maxS=Math.min(W,H)*0.96/S; cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr); cv.style.width=W+"px";
  document.querySelector(".zoom").style.bottom=(fh+ph+10)+"px"; var pd=$("pad"); if(pd)pd.style.bottom=fh+"px"; document.documentElement.style.setProperty("--bcb",(fh+ph+8)+"px"); document.documentElement.style.setProperty("--y0",y0+"px"); document.documentElement.style.setProperty("--fh",fh+"px");
  dirty=true;
}
function boardW(){return L().cols*S} function boardH(){return L().rows*S}
function fit(animate){
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
  if(MODE==="sudoku")return;
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
    if(px>=5){ ctx.fillStyle=KIND[q.k].m; var m=S*(px<30?0.34:px>=118?0.07:0.16); ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+m,y); ctx.lineTo(x,y+m); ctx.closePath(); ctx.fill() }
    if(q.th&&px>=12){ ctx.strokeStyle=dark?"rgba(214,178,94,.85)":"rgba(150,110,20,.9)"; ctx.lineWidth=Math.max(1.2/s,1.6); ctx.setLineDash([5,4]); ctx.strokeRect(x+3,y+3,S-6,S-6); ctx.setLineDash([]) }
    if(px>=40) drawText(q,x,y,dark,px,i);
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
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function q2(v){return Math.round(v*2)/2}
function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
/* Each square shows its OWN text, clipped to the square: date, title, then (closer in) its short paragraph and a Read more tab. */
function drawText(q,x,y,dark,px,i){
  var on=KIND[q.k].c==="b"?opt.tb:opt.tw; if(!on)return;
  var s=view.s, sx=view.x+x*s, sy=view.y+y*s, w=px;
  if(sx>W||sy>H||sx+w<0||sy+w<0)return;
  ctx.save(); ctx.setTransform(dpr,0,0,dpr,0,0); ctx.beginPath(); ctx.rect(sx,sy,w,w); ctx.clip();
  var pad=Math.round(clamp(w*0.065,4,16)), iw=Math.floor(w-pad*2);
  var col=dark?KIND[q.k].t:"#111", sub=dark?"rgba(255,255,255,.66)":"rgba(0,0,0,.6)";
  var tsz=q2(clamp(w*0.1,8.5,17)), dsz=q2(clamp(w*0.068,7.5,12)), bsz=q2(clamp(w*0.064,10,15.5));
  var full=w>=118, ty=sy+pad+(w>=60?Math.max(0,w*0.03):0);
  ctx.textBaseline="top";
  if(q.d&&w>=58){ ctx.font=fontStr(500,dsz); ctx.fillStyle=sub; ctx.fillText(wrap(String(q.d).toUpperCase(),iw,dsz,500,1)[0],sx+pad+(w<90?0:w*0.06),ty); ty+=dsz*1.4 }
  var footH=full?bsz*2.1:0;
  var tl=full?(w<200?3:2):Math.max(1,Math.floor((sy+w-pad-ty)/(tsz*1.16)));
  var tw=dark&&q.k==="L"?500:600; ctx.font=fontStr(tw,tsz); ctx.fillStyle=col;
  var tlines=wrap(q.t,iw,tsz,tw,tl);
  for(var j=0;j<tlines.length;j++){ ctx.fillText(tlines[j],sx+pad,ty); ty+=tsz*1.16 }
  if(full){
    ty+=bsz*0.35; var bodyCol=dark?(q.k==="L"?"#b5b5b5":q.k==="A"?"#ffd2cb":q.k==="K"?"#e4dcff":"#f0f0f0"):"#222";
    var thH=q.th?bsz*1.25:0;
    var maxL=Math.floor((sy+w-pad-footH-thH-ty)/(bsz*1.3));
    if(maxL>0){ ctx.font=fontStr(400,bsz); ctx.fillStyle=bodyCol; var bl=wrap(q.x,iw,bsz,400,maxL); for(var k=0;k<bl.length;k++){ ctx.fillText(bl[k],sx+pad,ty); ty+=bsz*1.3 } }
    if(q.th){ ctx.font=fontStr(600,q2(bsz*0.82)); ctx.fillStyle=dark?"#e6c983":"#7a5a10"; ctx.fillText(wrap("Theory · our case, prospective. Not a finding of any court.",iw,q2(bsz*0.82),600,1)[0],sx+pad,sy+w-pad-footH-thH+bsz*0.15) }
    // Read more tab
    var fh=bsz*1.75, fs=q2(bsz*0.9); ctx.font=fontStr(600,fs); var lab="Read more ›", lw=ctx.measureText(lab).width+fs*1.4;
    var fx=sx+pad, fy=sy+w-pad-fh;
    rr(fx,fy,lw,fh,fh/2); ctx.fillStyle=dark?"rgba(34,211,238,.16)":"rgba(14,116,144,.12)"; ctx.fill(); ctx.strokeStyle=dark?"#67e8f9":"#0e7490"; ctx.lineWidth=1; ctx.stroke();
    ctx.fillStyle=dark?"#a5f3fc":"#0e5f75"; ctx.textBaseline="middle"; ctx.fillText(lab,fx+fs*0.7,fy+fh/2+0.5); ctx.textBaseline="top";
    if(w>=170&&AR.idx&&AR.idx.cnt&&AR.idx.cnt[i]){ ctx.font=fontStr(500,q2(bsz*0.78)); ctx.fillStyle=sub; ctx.textAlign="right";
      ctx.fillText(AR.idx.cnt[i]+" extracts",sx+w-pad,fy+fh/2-bsz*0.39); ctx.textAlign="left" }
  }
  ctx.restore();
}
function drawRanks(px){
  ctx.textBaseline="middle"; var lastBottom=-1e9;
  B.eras.forEach(function(e){
    var ya=view.y+e.r0*px, yb=view.y+e.r1*px; if(yb<0||ya>H)return; var hgt=yb-ya;
    var yc=Math.max(ya+12,Math.min(yb-12,Math.max(16,ya+12)));
    var right=(px>=110&&ya>16);
    if(right) yc=Math.max(ya,10);
    if(yc-10<lastBottom+2) yc=lastBottom+12;          // a short band above: slide this label down inside its own band
    if(yc>yb-3&&!right) return;                                // no room left inside the band at this zoom
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
  if(MODE==="sudoku")return;
  if(e.key==="+"||e.key==="=")zoomAt(W/2,H/2,1.4); else if(e.key==="-")zoomAt(W/2,H/2,1/1.4); else if(e.key==="0"||e.key==="f")fit(true);
  else if(e.key==="Escape")closePanel(); else if(e.key==="ArrowRight"&&opt.sel>=0)step(1); else if(e.key==="ArrowLeft"&&opt.sel>=0)step(-1) });
function cellAt(px,py){ var c=Math.floor((px-view.x)/(S*view.s)),r=Math.floor((py-view.y)/(S*view.s)); if(r<0||c<0||r>=B.rows||c>=B.cols)return -1; return grid[r][c] }
function tap(px,py){ if(MODE==="sudoku")return; var i=cellAt(px,py); if(i<0){closePanel();return} var q=B.sq[i]; if(!visible(q))return;
  var spx=S*view.s; if(spx<40){ // far out: zoom towards the tapped square first
    var ns=Math.min(maxS,Math.max(view.s*3.2,120/S)); var k=ns/view.s; go({s:ns,x:px-(px-view.x)*k,y:py-(py-view.y)*k},true); return }
  openPanel(i) }

/* ---------- panel ---------- */
var panel=$("panel");
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function visitURL(u,h){ return u?(String(u).split("#")[0]+(h||"")):"" }
function openPanel(i){ var q=B.sq[i],k=KIND[q.k]; opt.sel=i; dirty=true;
  $("p-pill").className="pill "+k.c; $("p-pill").textContent=k.c==="b"?"Black square":"White square";
  $("p-kind").textContent=k.n; $("p-title").textContent=q.t; $("p-date").textContent=q.d||"Undated";
  $("p-text").textContent=q.x; $("p-theory").style.display=q.th?"block":"none";
  $("p-era").textContent=B.eras[q.e].label+" · "+B.eras[q.e].years+" · square "+fileName(q.c)+(q.r+1);
  var src=(q.src||[]).filter(function(s){return /^https?:/.test(s[1]||"")}), pv=$("p-visit");
  if(src.length){ pv.href=visitURL(src[0][1],q.a); pv.style.display=""; pv.title=src[0][0] } else pv.style.display="none";
  $("p-srcs").innerHTML=(q.src||[]).map(function(s){return /^https?:/.test(s[1]||"")?'<li><a href="'+esc(s[1])+'" target="_blank" rel="noopener">'+esc(s[0])+'</a></li>':'<li>'+esc(s[0])+'</li>'}).join("")||"<li>—</li>";
  var pa=$("p-arch"); if(pa){ pa.innerHTML='<div class="srcs-h">Full content of this square</div><p class="note">Loading…</p>';
    arChunks(i,function(ch){ if(opt.sel!==i)return; pa.innerHTML='<div class="srcs-h">Full content of this square · '+ch.length+' extract'+(ch.length===1?'':'s')+' from the archive edition and the public sites</div>'+ch.map(function(c){
      var sg=AR.idx.segs[c[0]]||[], u=sg[1]?visitURL(sg[1],c[4]):"";
      return '<div class="ach"><div class="kindtag">'+esc(segLabel(c))+'</div>'+(c[2]?'<div class="theory">Our case, prospective. Not a finding of any court.</div>':'')+'<p>'+esc(c[3]).replace(/\n/g,"<br>")+'</p>'+
        (u?'<a class="btn visit sm" href="'+esc(u)+'" target="_blank" rel="noopener">'+(c[4]&&c[4].indexOf(":~:text=")>=0?"Visit website at this passage ↗":"Visit website ↗")+'</a>':'')+'</div>' }).join("") }) }
  panel.classList.add("open"); $("panel-bd").classList.add("open"); panel.querySelector(".sheet-b").scrollTop=0; history.replaceState(null,"","#s="+q.id);
}
function closePanel(){ panel.classList.remove("open"); $("panel-bd").classList.remove("open"); opt.sel=-1; dirty=true; if(location.hash)history.replaceState(null,"",location.pathname+location.search) }
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
$("tb").onchange=function(){opt.tb=this.checked;dirty=true}; $("tw").onchange=function(){opt.tw=this.checked;dirty=true};
$("fit").onclick=function(){ if(MODE==="sudoku"){ if(window.GHFSudoku)GHFSudoku.fit(); } else fit(true)}; $("zin").onclick=function(){ if(MODE==="sudoku"){if(window.GHFSudoku)GHFSudoku.zoom(1.25);return} zoomAt(W/2,H/2,1.6)}; $("zout").onclick=function(){ if(MODE==="sudoku"){if(window.GHFSudoku)GHFSudoku.zoom(0.8);return} zoomAt(W/2,H/2,1/1.6)};
$("panel-bd").onclick=closePanel;
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
var toastT=null; function toast(t){ var el=$("toast"); el.textContent=t; el.classList.add("on"); clearTimeout(toastT); toastT=setTimeout(function(){el.classList.remove("on")},1800) }
window.GHFtoast=toast;
function setMode(m){ if(m===MODE)return; MODE=m; document.body.classList.toggle("su",m==="sudoku");
  document.querySelectorAll("[data-mode]").forEach(function(x){x.setAttribute("aria-pressed",x.getAttribute("data-mode")===m?"true":"false")});
  try{localStorage.setItem("ghf-chess-mode",m)}catch(e){}
  var qs=location.search.replace(/[?&]mode=sudoku/,""); history.replaceState(null,"",location.pathname+(m==="sudoku"?(qs?qs+"&":"?")+"mode=sudoku":qs));
  closePanel(); resize();
  if(m==="sudoku"){ if(window.GHFSudoku)GHFSudoku.open(B) } else { if(window.GHFSudoku)GHFSudoku.close(); fit(false) }
  dirty=true }
function startView(){ // a readable first view: titles legible, whole board one tap away (Fit board)
  var fs=Math.min((W-12)/boardW(),(H-12)/boardH()); minS=fs*0.6;
  var px=clamp(Math.min(W,H)/2.5,120,190), s=Math.min(maxS,px/S);
  view={s:s,x:10,y:20}; clampView(); dirty=true }
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
  B=j; build(); resize(); startView(); $("loading").remove(); arLoadIndex();
  var wantSu=/[?&#]mode=sudoku/.test(location.search+location.hash); try{ if(!/#s=/.test(location.hash)&&localStorage.getItem("ghf-chess-mode")==="sudoku")wantSu=true }catch(e){}
  if(wantSu)setMode("sudoku");
  var m=/#s=([\w-]+)/.exec(location.hash); if(m){ var i=B.sq.findIndex(function(q){return q.id===m[1]}); if(i>=0){openPanel(i); setTimeout(function(){flyToSquare(i)},250)} }
  setTimeout(hideHint,4500);
}).catch(function(e){ $("loading").textContent="Could not load the board. Please reload." });
window.addEventListener("resize",function(){ var had=B&&view.s; resize(); if(B&&!had)fit(false) });
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){wrapCache.clear();dirty=true});
requestAnimationFrame(loop);
window.ChessBoard={fit:function(){fit(false)},zoomTo:function(id,px,open){var i=B.sq.findIndex(function(q){return q.id===id});if(i<0)return false;anim=null;var s=Math.min(maxS,(px||Math.min(W,H)*0.78)/S);view={s:s,x:W/2-(B.sq[i].c+.5)*S*s,y:H/2-(B.sq[i].r+.5)*S*s};dirty=true;if(open)openPanel(i);return true},
  ids:function(){return B.sq.map(function(q){return q.id})},view:function(){return view},
  mode:setMode,
  arch:function(i,cb){return arChunks(i,cb)}, panel:openPanel,
  setView:function(s,x,y){anim=null;view={s:s,x:x,y:y};dirty=true}, pos:function(i){return [posR(i),posC(i)]}};
})();
