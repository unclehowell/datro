const BRANCH_NAMES = [
  'althea','archives','bpvsbuckler','carfinancecheque','ccan','ceo','cnei','dash',
  'datro','dcc','financecheque','greathousefarm','gui','hbnb','library','llmwiki',
  'subrepos','ui','wave','wayback','whitepaper','pirateclaw'
];

const BRANCH_COLORS = {
  althea:'#ff6b6b',archives:'#c9a96e',bpvsbuckler:'#4ecdc4',carfinancecheque:'#45b7d1',
  ccan:'#96ceb4',ceo:'#ffeead',cnei:'#ff4444',dash:'#d4a574',
  datro:'#00f2ff',dcc:'#ffd93d',financecheque:'#6bcb77',greathousefarm:'#4d96ff',
  gui:'#ff6b6b',hbnb:'#ff922b',library:'#69db7c',llmwiki:'#f783ac',
  subrepos:'#748ffc',ui:'#20c997',wave:'#f06595',wayback:'#a9e34b',
  whitepaper:'#e8590c',pirateclaw:'#be4bdb'
};

const A = 0.00729735256;
const A_INV = 137.035999178;

(function(){
  let cv,ctx,animId,running,carAngle,speed=1;
  let cw,ch;
  const BRANCH_N=BRANCH_NAMES.length;
  const SEGS=Math.round(A_INV);
  const TICK_MS=1000/137;
  const LAP_MS=172800000;
  let accumulator=0,lastTimestamp=0;
  let rereleases=[];
  let flywheelState={regular_index:0,cnei_queue:0,lap:0,mode:'AUTO'};
  let wingVisible=0;

  window.trackInit=function(canvas){
    let was=running;
    if(was)trackStop();
    cv=canvas;ctx=cv.getContext('2d');
    cw=cv.width;ch=cv.height;
    lastTimestamp=0;accumulator=0;
    if(!was)carAngle=(Date.now()%LAP_MS)/LAP_MS*Math.PI*2;
    trackStart();
  };
  window.trackStart=function(){if(running)return;running=1;animId=requestAnimationFrame(tick);};
  window.trackStop=function(){running=0;if(animId){cancelAnimationFrame(animId);animId=null}};
  window.trackRerelease=function(b){rereleases.push({branch:b,life:1});};
  window.trackSetSpeed=function(s){speed=Math.max(0.1,s);};
  window.trackSelectBranch=function(b){
    let i=BRANCH_NAMES.indexOf(b);
    if(i>=0)carAngle=i/BRANCH_N*Math.PI*2;
  };
  window.trackWingToggle=function(){wingVisible=wingVisible^0xf;};
  window.trackWingSet=function(mask){wingVisible=mask;};
  window.trackMilestones=function(data){
    flywheelState={...flywheelState,...data};
  };

  function physicsStep(){
    carAngle+=TICK_MS/LAP_MS*Math.PI*2*speed;
    if(carAngle>Math.PI*2)carAngle-=Math.PI*2;
    for(let i=rereleases.length-1;i>=0;i--){
      rereleases[i].life-=TICK_MS/3000;
      if(rereleases[i].life<=0)rereleases.splice(i,1);
    }
  }

  function tick(timestamp){
    if(!running||!ctx)return;
    if(!lastTimestamp)lastTimestamp=timestamp;
    const frameDelta=Math.min(timestamp-lastTimestamp,100);
    lastTimestamp=timestamp;
    accumulator+=frameDelta;
    while(accumulator>=TICK_MS){
      physicsStep();
      accumulator-=TICK_MS;
    }
    draw();
    animId=requestAnimationFrame(tick);
  }

  function getBranchAt(idx){
    return BRANCH_NAMES[Math.floor(idx*BRANCH_N)%BRANCH_N];
  }

  function draw(){
    const w=cw,h=ch;
    ctx.clearRect(0,0,w,h);

    const horizonY=h*0.42;
    const remaining=BRANCH_N-(flywheelState.regular_index%BRANCH_N);
    const cneiIn=5-(flywheelState.regular_index%5);

    for(let i=SEGS;i>=0;i--){
      const t=i/SEGS;
      const y0=horizonY+((i-1)/SEGS)*(h-horizonY);
      const y1=horizonY+t*(h-horizonY);
      const sh=y1-y0;

      const curve=Math.sin(carAngle+Math.PI*0.5+A)*0.35+Math.sin(carAngle*2+t*2)*0.1;
      const ws=1-t*0.88;
      const rw=100*ws;
      const cx=w/2+curve*(1-t)*140;

      const left=cx-rw;
      const right=cx+rw;

      const sd=0.25+t*0.45;
      ctx.fillStyle=`rgb(${42*sd|0},${45*sd|0},${52*sd|0})`;
      ctx.fillRect(left,y0,rw*2,sh+1);

      ctx.fillStyle=`rgb(${15+20*sd|0},${60+20*sd|0},${15+10*sd|0})`;
      if(left>0)ctx.fillRect(0,y0,left,sh+1);
      if(right<w)ctx.fillRect(right,y0,w-right,sh+1);

      if(i%8<4){
        ctx.fillStyle='#c22';ctx.fillRect(left-3,y0,3,sh+1);
        ctx.fillStyle='#fff';ctx.fillRect(right,y0,3,sh+1);
      }else{
        ctx.fillStyle='#fff';ctx.fillRect(left-3,y0,3,sh+1);
        ctx.fillStyle='#c22';ctx.fillRect(right,y0,3,sh+1);
      }

      if(i%8<4){
        for(let ln=1;ln<3;ln++){
          let lx=cx+(ln-1)*32*ws;
          ctx.fillStyle=ln===1?'rgba(255,255,0,0.6)':'rgba(255,68,68,0.5)';
          ctx.fillRect(lx-Math.max(1,ws*2),y0,Math.max(2,ws*4),sh+1);
        }
      }

      // ── Milestone billboards ──
      if(i%Math.round(SEGS/12)===0&&i<SEGS*0.6){
        const milIdx=Math.floor(i/SEGS*BRANCH_N)%BRANCH_N;
        const bName=BRANCH_NAMES[milIdx];
        const col=BRANCH_COLORS[bName]||'#0ff';
        const ss=ws*28;
        if(ss>4){
          const isCnei=flywheelState.cnei_queue>0&&milIdx%5===0;
          const remLabel=isCnei?'CNEI→'+(cneiIn<=0?flywheelState.cnei_queue:cneiIn):remaining+'/24';

          ctx.fillStyle=col;ctx.globalAlpha=0.25+t*0.25;
          ctx.fillRect(left-ss-3,y0-ss*0.3,ss,ss*0.6);
          ctx.fillStyle='#000';ctx.globalAlpha=1;
          ctx.font=`bold ${Math.max(3,ss*0.18)}px monospace`;
          ctx.textAlign='center';ctx.textBaseline='middle';
          ctx.fillText(remLabel,left-ss/2-3,y0+ss*0.05);

          ctx.fillStyle=col;ctx.globalAlpha=0.25+t*0.25;
          ctx.fillRect(right+3,y0-ss*0.3,ss,ss*0.6);
          ctx.fillStyle='#000';ctx.globalAlpha=1;
          ctx.fillText(remLabel,right+ss/2+3,y0+ss*0.05);

          ctx.globalAlpha=1;
          ctx.fillStyle='#000';ctx.font=`bold ${Math.max(3,ss*0.16)}px monospace`;
          ctx.fillText(bName.slice(0,4),left-ss/2-3,y0+ss*0.35);
          ctx.fillText(bName.slice(0,4),right+ss/2+3,y0+ss*0.35);
        }
      }
    }

    // ── Mini-map ──
    const mmX=w-95,mmY=12,mmW=80,mmH=50;
    ctx.globalAlpha=0.6;
    ctx.fillStyle='rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(mmX+mmW/2,mmY+mmH/2,mmW/2,mmH/2,0,0,Math.PI*2);
    ctx.fill();
    ctx.strokeStyle='rgba(0,242,255,0.2)';ctx.lineWidth=1;
    ctx.stroke();

    ctx.strokeStyle='rgba(100,100,100,0.4)';ctx.lineWidth=4;
    ctx.beginPath();ctx.ellipse(mmX+mmW/2,mmY+mmH/2,mmW/2-4,mmH/2-4,0,0,Math.PI*2);ctx.stroke();

    const completedCount=flywheelState.regular_index%BRANCH_N;
    for(let i=0;i<BRANCH_N;i++){
      const a=i/BRANCH_N*Math.PI*2-Math.PI/2+A;
      const bx=mmX+mmW/2+(mmW/2-4)*Math.cos(a);
      const by=mmY+mmH/2+(mmH/2-4)*Math.sin(a);
      ctx.fillStyle=BRANCH_COLORS[BRANCH_NAMES[i]]||'#0ff';
      ctx.globalAlpha=i<completedCount?0.9:0.3;
      ctx.beginPath();ctx.arc(bx,by,2,0,Math.PI*2);ctx.fill();
    }

    let ca=carAngle-Math.PI/2;
    let carX=mmX+mmW/2+(mmW/2-4)*Math.cos(ca);
    let carY=mmY+mmH/2+(mmH/2-4)*Math.sin(ca);
    ctx.globalAlpha=1;
    ctx.fillStyle='#fff';ctx.shadowColor='#0ff';ctx.shadowBlur=6;
    ctx.beginPath();ctx.arc(carX,carY,3,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;

    // ── Lap counter ──
    ctx.fillStyle='rgba(0,242,255,0.3)';ctx.font='6px monospace';ctx.textAlign='left';
    ctx.fillText('LAP '+flywheelState.lap,mmX,mmY+mmH+10);
    ctx.fillText(flywheelState.mode,mmX,mmY+mmH+17);

    // ── Rerelease flares ──
    ctx.globalAlpha=1;
    rereleases.forEach(r=>{
      let idx=BRANCH_NAMES.indexOf(r.branch);
      let col=BRANCH_COLORS[r.branch]||'#ff4444';
      let sc=Math.max(0.2,r.life);

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
    ctx.fillText('LAP '+flywheelState.lap,8,h-8);
    ctx.textAlign='right';
    ctx.fillText(getBranchAt(carAngle/(Math.PI*2)).toUpperCase(),cw-8,h-8);

    drawBonnet(w,h);
  }

  function drawBonnet(w,h){
    const bx=w/2,by=h-12;
    ctx.save();
    ctx.shadowColor='rgba(0,242,255,0.06)';ctx.shadowBlur=8;

    ctx.fillStyle='#181a1c';
    ctx.beginPath();
    ctx.moveTo(bx-65,by);
    ctx.quadraticCurveTo(bx-80,by-32,bx-35,by-50);
    ctx.quadraticCurveTo(bx,by-60,bx+35,by-50);
    ctx.quadraticCurveTo(bx+80,by-32,bx+65,by);
    ctx.closePath();ctx.fill();

    ctx.strokeStyle='rgba(0,242,255,0.4)';ctx.lineWidth=0.5;ctx.stroke();

    ctx.strokeStyle='rgba(255,255,255,0.05)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(bx,by-4);ctx.lineTo(bx,by-54);ctx.stroke();

    ctx.shadowColor='#ffc';ctx.shadowBlur=16;
    ctx.fillStyle='rgba(255,255,200,0.6)';
    ctx.beginPath();ctx.ellipse(bx-22,by-38,3,2,-0.2,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(bx+22,by-38,3,2,0.2,0,Math.PI*2);ctx.fill();

    ctx.restore();
  }

  if(typeof window.trackMilestones==='function'){
    window.trackMilestones({lap:0});
  }
window.trackSetAngle=function(fraction){carAngle=fraction*Math.PI*2;};
window.trackSetAngle=function(fraction){carAngle=fraction*Math.PI*2;};
})();
