const BRANCH_NAMES = [
  'althea','archives','bpvsbuckler','carfinancecheque','ccan','ceo','cnei','dash',
  'datro','dcc','financecheque','greathousefarm','gui','hbnb','library','llmwiki',
  'subrepos','ui','wave','wayback','whitepaper'
];

const BRANCH_COLORS = {
  althea:'#ff6b6b',archives:'#c9a96e',bpvsbuckler:'#4ecdc4',carfinancecheque:'#45b7d1',
  ccan:'#96ceb4',ceo:'#ffeead',cnei:'#ff4444',dash:'#d4a574',
  datro:'#00f2ff',dcc:'#ffd93d',financecheque:'#6bcb77',greathousefarm:'#4d96ff',
  gui:'#ff6b6b',hbnb:'#ff922b',library:'#69db7c',llmwiki:'#f783ac',
  subrepos:'#748ffc',ui:'#20c997',wave:'#f06595',wayback:'#a9e34b',
  whitepaper:'#e8590c'
};

(function(){
  let cv,ctx,animId,running,carAngle,speed=1,rereleases=[];
  let cw,ch;
  const BRANCH_N=BRANCH_NAMES.length;
  const LAP_MS=172800000;

  window.trackInit=function(canvas){
    let was=running;
    if(was)trackStop();
    cv=canvas;ctx=cv.getContext('2d');
    cw=cv.width;ch=cv.height;
    if(!was)carAngle=(Date.now()%LAP_MS)/LAP_MS*Math.PI*2;
    trackStart();
  };
  window.trackStart=function(){if(running)return;running=1;tick();};
  window.trackStop=function(){running=0;if(animId){cancelAnimationFrame(animId);animId=null}};
  window.trackRerelease=function(b){rereleases.push({branch:b,life:1});};
  window.trackSetSpeed=function(s){speed=Math.max(0.1,s);};
  window.trackSelectBranch=function(b){
    let i=BRANCH_NAMES.indexOf(b);
    if(i>=0)carAngle=i/BRANCH_N*Math.PI*2;
  };

  function tick(){
    if(!running||!ctx)return;
    carAngle+=16/LAP_MS*Math.PI*2*speed;
    if(carAngle>Math.PI*2)carAngle-=Math.PI*2;
    for(let i=rereleases.length-1;i>=0;i--){
      rereleases[i].life-=16/3000;
      if(rereleases[i].life<=0)rereleases.splice(i,1);
    }
    draw();
    animId=requestAnimationFrame(tick);
  }

  function draw(){
    const w=cw,h=ch;
    ctx.clearRect(0,0,w,h);

    // ── Sky ──
    let g=ctx.createLinearGradient(0,0,0,h*0.42);
    g.addColorStop(0,'#05071a');g.addColorStop(0.5,'#12142a');g.addColorStop(1,'#05071a');
    ctx.fillStyle=g;ctx.fillRect(0,0,w,h*0.42);

    // Stars
    ctx.fillStyle='rgba(255,255,255,0.15)';
    for(let i=0;i<40;i++){
      let sx=(i*137.5+carAngle*200)%w,sy=(i*97.3+carAngle*100)%(h*0.35);
      ctx.fillRect(sx,sy,1,1);
    }

    // ── Track surface (circular oval) ──
    const horizonY=h*0.42;
    const segs=80;

    for(let i=segs;i>=0;i--){
      const t=i/segs;
      const y0=horizonY+((i-1)/segs)*(h-horizonY);
      const y1=horizonY+t*(h-horizonY);
      const sh=y1-y0;

      // Circular track curve: the road bends left/right as we go around the circle
      const curve=Math.sin(carAngle+Math.PI*0.5)*0.35 + Math.sin(carAngle*2+t*2)*0.1;
      const ws=1-t*0.88;
      const rw=100*ws;
      const cx=w/2+curve*(1-t)*140;

      const left=cx-rw;
      const right=cx+rw;

      // Road surface
      const sd=0.25+t*0.45;
      ctx.fillStyle=`rgb(${42*sd|0},${45*sd|0},${52*sd|0})`;
      ctx.fillRect(left,y0,rw*2,sh+1);

      // Grass alongside
      ctx.fillStyle=`rgb(${15+20*sd|0},${60+20*sd|0},${15+10*sd|0})`;
      if(left>0)ctx.fillRect(0,y0,left,sh+1);
      if(right<w)ctx.fillRect(right,y0,w-right,sh+1);

      // Kerb (red/white)
      if(i%8<4){
        ctx.fillStyle='#c22';ctx.fillRect(left-3,y0,3,sh+1);
        ctx.fillStyle='#fff';ctx.fillRect(right,y0,3,sh+1);
      }else{
        ctx.fillStyle='#fff';ctx.fillRect(left-3,y0,3,sh+1);
        ctx.fillStyle='#c22';ctx.fillRect(right,y0,3,sh+1);
      }

      // Lane markings
      if(i%8<4){
        for(let ln=1;ln<3;ln++){
          let lx=cx+(ln-1)*32*ws;
          ctx.fillStyle=ln===1?'rgba(255,255,0,0.6)':'rgba(255,68,68,0.5)';
          ctx.fillRect(lx-Math.max(1,ws*2),y0,Math.max(2,ws*4),sh+1);
        }
      }

      // Branch signs
      if(i%12===0&&i<segs*0.6){
        let bIdx=Math.floor(i/segs*BRANCH_N)%BRANCH_N;
        let bName=BRANCH_NAMES[bIdx];
        let col=BRANCH_COLORS[bName]||'#0ff';
        let ss=ws*28;
        if(ss>4){
          ctx.fillStyle=col;ctx.globalAlpha=0.25+t*0.25;
          ctx.fillRect(left-ss-3,y0-ss*0.15,ss,ss*0.4);
          ctx.fillStyle='#000';ctx.globalAlpha=1;
          ctx.font=`bold ${Math.max(3,ss*0.22)}px monospace`;
          ctx.textAlign='center';ctx.textBaseline='middle';
          ctx.fillText(bName.slice(0,4),left-ss/2-3,y0+ss*0.05);

          ctx.fillStyle=col;ctx.globalAlpha=0.25+t*0.25;
          ctx.fillRect(right+3,y0-ss*0.15,ss,ss*0.4);
          ctx.fillStyle='#000';ctx.globalAlpha=1;
          ctx.fillText(bName.slice(0,4),right+ss/2+3,y0+ss*0.05);
        }
      }
    }

    // ── Track mini-map (top-down oval) ──
    const mmX=w-95,mmY=12,mmW=80,mmH=50;
    ctx.globalAlpha=0.6;

    // Map background
    ctx.fillStyle='rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(mmX+mmW/2,mmY+mmH/2,mmW/2,mmH/2,0,0,Math.PI*2);
    ctx.fill();
    ctx.strokeStyle='rgba(0,242,255,0.2)';ctx.lineWidth=1;
    ctx.stroke();

    // Track oval
    ctx.strokeStyle='rgba(100,100,100,0.4)';ctx.lineWidth=4;
    ctx.beginPath();ctx.ellipse(mmX+mmW/2,mmY+mmH/2,mmW/2-4,mmH/2-4,0,0,Math.PI*2);ctx.stroke();

    // Branch dots on oval
    for(let i=0;i<BRANCH_N;i++){
      let a=i/BRANCH_N*Math.PI*2-Math.PI/2;
      let bx=mmX+mmW/2+(mmW/2-4)*Math.cos(a);
      let by=mmY+mmH/2+(mmH/2-4)*Math.sin(a);
      ctx.fillStyle=BRANCH_COLORS[BRANCH_NAMES[i]]||'#0ff';
      ctx.beginPath();ctx.arc(bx,by,2,0,Math.PI*2);ctx.fill();
    }

    // Car position on oval
    let ca=carAngle-Math.PI/2;
    let carX=mmX+mmW/2+(mmW/2-4)*Math.cos(ca);
    let carY=mmY+mmH/2+(mmH/2-4)*Math.sin(ca);
    ctx.fillStyle='#fff';ctx.shadowColor='#0ff';ctx.shadowBlur=6;
    ctx.beginPath();ctx.arc(carX,carY,3,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;ctx.globalAlpha=1;

    // ── Rerelease flares ──
    ctx.globalAlpha=1;
    rereleases.forEach(r=>{
      let idx=BRANCH_NAMES.indexOf(r.branch);
      let a=idx>=0?idx/BRANCH_N*Math.PI*2:Math.random()*Math.PI*2;
      let col=BRANCH_COLORS[r.branch]||'#ff4444';
      let sc=Math.max(0.2,r.life);

      // Billboard sign popping up on track
      let sy=horizonY+10+(1-sc*0.3)*(h-horizonY-20)*0.45;
      let sw=100*sc,sh=35*sc;
      ctx.shadowColor=col;ctx.shadowBlur=30*sc;
      ctx.fillStyle=col;ctx.globalAlpha=0.9*r.life;
      ctx.fillRect(w/2-sw/2,sy-sh/2,sw,sh);

      ctx.shadowBlur=0;ctx.globalAlpha=1;
      ctx.fillStyle='#000';
      ctx.font=`bold ${Math.max(8,14*sc)}px monospace`;
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText('★ '+r.branch.toUpperCase()+' ★',w/2,sy);
    });

    // ── HUD ──
    ctx.fillStyle='rgba(0,242,255,0.05)';ctx.font='7px monospace';ctx.textAlign='left';ctx.textBaseline='bottom';
    ctx.fillText('LAP '+(Math.floor(carAngle/(Math.PI*2)*10)/10).toFixed(1),8,h-8);
    ctx.textAlign='right';
    ctx.fillText(BRANCH_NAMES[Math.floor(carAngle/(Math.PI*2)*BRANCH_N)%BRANCH_N].toUpperCase(),cw-8,h-8);

    // ── Car bonnet ──
    drawBonnet(w,h);
  }

  function drawBonnet(w,h){
    const bx=w/2,by=h-12;
    ctx.save();
    ctx.shadowColor='rgba(0,242,255,0.06)';ctx.shadowBlur=8;

    // Hood
    ctx.fillStyle='#181a1c';
    ctx.beginPath();
    ctx.moveTo(bx-65,by);
    ctx.quadraticCurveTo(bx-80,by-32,bx-35,by-50);
    ctx.quadraticCurveTo(bx,by-60,bx+35,by-50);
    ctx.quadraticCurveTo(bx+80,by-32,bx+65,by);
    ctx.closePath();ctx.fill();

    ctx.strokeStyle='rgba(0,242,255,0.4)';ctx.lineWidth=0.5;ctx.stroke();

    // Center ridge
    ctx.strokeStyle='rgba(255,255,255,0.05)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(bx,by-4);ctx.lineTo(bx,by-54);ctx.stroke();

    // Headlights
    ctx.shadowColor='#ffc';ctx.shadowBlur=16;
    ctx.fillStyle='rgba(255,255,200,0.6)';
    ctx.beginPath();ctx.ellipse(bx-22,by-38,3,2,-0.2,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(bx+22,by-38,3,2,0.2,0,Math.PI*2);ctx.fill();

    ctx.restore();
  }
})();
