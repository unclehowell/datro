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
var view={s:0.1,x:0,y:0},minS=0.01,maxS=12;
var opt={show:"both",tb:true,tw:true,q:"",hits:null,hitList:[],hitIx:-1,sel:-1};
var wrapCache=new Map(),dirty=true,anim=null;

function $(id){return document.getElementById(id)}
function fontStr(w,sz){return w+" "+sz+"px Barlow, Helvetica Neue, Arial, sans-serif"}

/* ---------- sizing ---------- */
function resize(){
  dpr=Math.min(window.devicePixelRatio||1,2);
  y0=top.getBoundingClientRect().height; var fh=foot.getBoundingClientRect().height;
  W=window.innerWidth; H=Math.max(100,window.innerHeight-y0-fh);
  cv.style.top=y0+"px"; cv.style.height=H+"px"; cv.style.bottom="auto";
  cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr); cv.style.width=W+"px";
  document.querySelector(".zoom").style.bottom=(fh+10)+"px";
  dirty=true;
}
function boardW(){return B.cols*S} function boardH(){return B.rows*S}
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
  var q=B.sq[i],px=zoomPx||Math.min(W,H)*0.78; var s=Math.min(maxS,px/S);
  go({s:s,x:W/2-(q.c+.5)*S*s,y:H/2-(q.r+.5)*S*s},true);
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
    if(px>=46) drawText(q,x,y,dark,px);
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
function drawText(q,x,y,dark,px){
  var on=KIND[q.k].c==="b"?opt.tb:opt.tw; if(!on)return;
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
  }
  ctx.restore();
}
function drawRanks(px){
  ctx.textBaseline="middle"; var lastBottom=-1e9;
  B.eras.forEach(function(e){
    var ya=view.y+e.r0*px, yb=view.y+e.r1*px; if(yb<0||ya>H)return; var hgt=yb-ya;
    if(Math.max(ya+12,16)-10<lastBottom+2)return;
    var yc=Math.max(ya+12,Math.min(yb-12,Math.max(16,ya+12)));
    if(px>=110&&ya>16) { var right=true }
    var label=e.label+(hgt>40?"  ·  "+e.years:"");
    ctx.font=fontStr(600,hgt>40?12:10.5); var tw=ctx.measureText(label).width+14;
    var xL=Math.max(4,view.x+4); if(xL+tw>W-54)xL=Math.max(4,W-54-tw);
    if(right){ xL=Math.min(W-54,view.x+boardW()*view.s)-tw-4; yc=ya+11 }
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
  if(e.key==="+"||e.key==="=")zoomAt(W/2,H/2,1.4); else if(e.key==="-")zoomAt(W/2,H/2,1/1.4); else if(e.key==="0"||e.key==="f")fit(true);
  else if(e.key==="Escape")closePanel(); else if(e.key==="ArrowRight"&&opt.sel>=0)step(1); else if(e.key==="ArrowLeft"&&opt.sel>=0)step(-1) });
function cellAt(px,py){ var c=Math.floor((px-view.x)/(S*view.s)),r=Math.floor((py-view.y)/(S*view.s)); if(r<0||c<0||r>=B.rows||c>=B.cols)return -1; return grid[r][c] }
function tap(px,py){ var i=cellAt(px,py); if(i<0){closePanel();return} var q=B.sq[i]; if(!visible(q))return;
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
$("tb").onchange=function(){opt.tb=this.checked;dirty=true}; $("tw").onchange=function(){opt.tw=this.checked;dirty=true};
$("fit").onclick=function(){fit(true)}; $("zin").onclick=function(){zoomAt(W/2,H/2,1.6)}; $("zout").onclick=function(){zoomAt(W/2,H/2,1/1.6)};
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
  B=j; build(); resize(); fit(false); $("loading").remove();
  var m=/#s=([\w-]+)/.exec(location.hash); if(m){ var i=B.sq.findIndex(function(q){return q.id===m[1]}); if(i>=0){openPanel(i); setTimeout(function(){flyToSquare(i)},250)} }
  setTimeout(hideHint,4500);
}).catch(function(e){ $("loading").textContent="Could not load the board. Please reload." });
window.addEventListener("resize",function(){ var had=B&&view.s; resize(); if(B&&!had)fit(false) });
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){wrapCache.clear();dirty=true});
requestAnimationFrame(loop);
window.ChessBoard={fit:function(){fit(false)},zoomTo:function(id,px,open){var i=B.sq.findIndex(function(q){return q.id===id});if(i<0)return false;anim=null;var s=Math.min(maxS,(px||Math.min(W,H)*0.78)/S);view={s:s,x:W/2-(B.sq[i].c+.5)*S*s,y:H/2-(B.sq[i].r+.5)*S*s};dirty=true;if(open)openPanel(i);return true},
  ids:function(){return B.sq.map(function(q){return q.id})},view:function(){return view}};
})();
