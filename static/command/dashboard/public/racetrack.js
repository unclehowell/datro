// ── Pseudo-3D Racetrack Screensaver ──
// First-person circular track with 3 lanes, 24 branch clock positions

const BRANCH_NAMES = [
  'althea','archives','bpvsbuckler','carfinancecheque','ccan','ceo','cnei','dash',
  'datro','dcc','financecheque','greathousefarm','gui','hbnb','library','llmwiki',
  'subrepos','ui','wave','wayback','whitepaper','hbnb','gui','cnei'
];

const BRANCH_COLORS = {
  althea: '#ff6b6b', archives: '#c9a96e', bpvsbuckler: '#4ecdc4', carfinancecheque: '#45b7d1',
  ccan: '#96ceb4', ceo: '#ffeead', cnei: '#ff4444', dash: '#d4a574',
  datro: '#00f2ff', dcc: '#ffd93d', financecheque: '#6bcb77', greathousefarm: '#4d96ff',
  gui: '#ff6b6b', hbnb: '#ff922b', library: '#69db7c', llmwiki: '#f783ac',
  subrepos: '#748ffc', ui: '#20c997', wave: '#f06595', wayback: '#a9e34b',
  whitepaper: '#e8590c'
};

(function() {
  let trackCanvas, ctx;
  let animId = null;
  let running = false;
  let carAngle = Date.now() / 172800000 * Math.PI * 2;
  let speed = 1;
  let rereleases = [];
  let cw, ch;

  const TWO_DAYS_MS = 172800000;
  const BRANCH_COUNT = 24;

  window.trackInit = function(canvas) {
    trackCanvas = canvas;
    ctx = canvas.getContext('2d');
    cw = canvas.width;
    ch = canvas.height;
    carAngle = (Date.now() % TWO_DAYS_MS) / TWO_DAYS_MS * Math.PI * 2;
    trackStart();
  };

  window.trackStart = function() {
    if (running) return;
    running = true;
    tick();
  };

  window.trackStop = function() {
    running = false;
    if (animId) { cancelAnimationFrame(animId); animId = null; }
  };

  window.trackRerelease = function(branchName) {
    const idx = BRANCH_NAMES.indexOf(branchName);
    const angle = idx >= 0 ? (idx / BRANCH_COUNT) * Math.PI * 2 : Math.random() * Math.PI * 2;
    rereleases.push({ branch: branchName, angle, life: 1, dist: 150 });
  };

  window.trackSetSpeed = function(s) { speed = Math.max(0.1, s); };

  function tick() {
    if (!running || !ctx) return;
    const dt = 16;
    carAngle += (dt / TWO_DAYS_MS) * Math.PI * 2 * speed;
    if (carAngle > Math.PI * 2) carAngle -= Math.PI * 2;

    for (let i = rereleases.length - 1; i >= 0; i--) {
      rereleases[i].life -= dt / 4000;
      rereleases[i].dist -= dt * 0.08;
      if (rereleases[i].life <= 0 || rereleases[i].dist < -20) rereleases.splice(i, 1);
    }

    draw();
    animId = requestAnimationFrame(tick);
  }

  function draw() {
    const w = cw, h = ch;

    // Sky
    const grad = ctx.createLinearGradient(0, 0, 0, h * 0.45);
    grad.addColorStop(0, '#0a0c1a');
    grad.addColorStop(0.5, '#1a1c2a');
    grad.addColorStop(1, '#0a0c1a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Horizon glow
    const hGrad = ctx.createRadialGradient(w/2, h*0.45, 0, w/2, h*0.45, 120);
    hGrad.addColorStop(0, 'rgba(0,242,255,0.04)');
    hGrad.addColorStop(1, 'rgba(0,242,255,0)');
    ctx.fillStyle = hGrad;
    ctx.fillRect(0, h*0.35, w, h*0.15);

    // Grass
    ctx.fillStyle = '#1a4a1a';
    ctx.fillRect(0, h * 0.45, w, h * 0.55);

    // Road segments
    const segs = 100;
    const horizonY = h * 0.45;

    for (let i = segs; i >= 0; i--) {
      const t = i / segs;
      const y1 = horizonY + t * (h - horizonY);
      const y0 = horizonY + ((i - 1) / segs) * (h - horizonY);
      const sh = y1 - y0;

      const curve = Math.sin(carAngle * 2 + t * 3) * 0.25;
      const ws = 1 - t * 0.88;
      const rw = 90 * ws;
      const cx = w / 2 + curve * (1 - t) * 120;

      const left = cx - rw;
      const right = cx + rw;

      // Road color with depth shading
      const shade = 0.3 + t * 0.5;
      ctx.fillStyle = `rgb(${45*shade|0},${48*shade|0},${55*shade|0})`;
      ctx.fillRect(left, y0, rw * 2, sh + 1);

      // Lane markings (dashed)
      if (i % 6 < 3) {
        for (let ln = 1; ln < 3; ln++) {
          const lx = cx + (ln - 1) * 30 * ws;
          const lw = Math.max(1, ws * 3);
          ctx.fillStyle = ln === 1 ? '#ff0' : '#f44';
          ctx.fillRect(lx - lw/2, y0, lw, sh + 1);
        }
      }

      // Road edges
      ctx.fillStyle = '#888';
      ctx.fillRect(left - 1, y0, 2, sh + 1);
      ctx.fillRect(right - 1, y0, 2, sh + 1);

      // Branch signs along edges
      if (i % 10 === 0 && i < segs * 0.65) {
        const bIdx = Math.floor((i / segs) * BRANCH_COUNT) % BRANCH_COUNT;
        const bName = BRANCH_NAMES[bIdx];
        const ss = ws * 30;
        if (ss > 5) {
          // Left sign
          ctx.fillStyle = `rgba(0,242,255,${0.3 + t * 0.3})`;
          ctx.fillRect(left - ss - 4, y0 - ss*0.2, ss, ss*0.5);
          ctx.fillStyle = '#000';
          ctx.font = `bold ${Math.max(4, ss*0.25)}px monospace`;
          ctx.textAlign = 'center';
          ctx.fillText(bName.slice(0,5), left - ss/2 - 4, y0 + ss*0.15);

          // Right sign
          ctx.fillStyle = `rgba(255,170,0,${0.3 + t * 0.3})`;
          ctx.fillRect(right + 4, y0 - ss*0.2, ss, ss*0.5);
          ctx.fillStyle = '#000';
          ctx.fillText(bName.slice(0,5), right + ss/2 + 4, y0 + ss*0.15);
        }
      }
    }

    // Rerelease signs
    rereleases.forEach(r => {
      const sy = horizonY + 10 + (1 - r.dist / 200) * (h - horizonY - 20) * 0.5;
      const sc = Math.max(0.3, r.life);
      const sw = 90 * sc;
      const sh = 35 * sc;
      const sx = w / 2 - sw / 2;
      const color = BRANCH_COLORS[r.branch] || '#ff4444';

      ctx.shadowColor = color;
      ctx.shadowBlur = 25 * sc;
      ctx.fillStyle = `rgba(${parseInt(color.slice(1,3),16)},${parseInt(color.slice(3,5),16)},${parseInt(color.slice(5,7),16)},${0.85 * r.life})`;
      ctx.fillRect(sx, sy - sh/2, sw, sh);

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.max(7, 12 * sc)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★ ' + r.branch.toUpperCase() + ' ★', w / 2, sy);
    });

    // Car bonnet
    drawBonnet(w, h);
  }

  function drawBonnet(w, h) {
    const bx = w / 2, by = h - 15;

    ctx.save();
    ctx.shadowColor = 'rgba(0,242,255,0.08)';
    ctx.shadowBlur = 10;

    // Hood
    ctx.fillStyle = '#1a1c1e';
    ctx.beginPath();
    ctx.moveTo(bx - 70, by);
    ctx.quadraticCurveTo(bx - 85, by - 35, bx - 40, by - 55);
    ctx.quadraticCurveTo(bx, by - 65, bx + 40, by - 55);
    ctx.quadraticCurveTo(bx + 85, by - 35, bx + 70, by);
    ctx.closePath();
    ctx.fill();

    // Hood outline
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Center ridge
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx, by - 5);
    ctx.lineTo(bx, by - 58);
    ctx.stroke();

    // Side vents
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(bx - 50, by - 30, 15, 4);
    ctx.fillRect(bx + 35, by - 30, 15, 4);

    // Headlight glows
    ctx.shadowColor = '#ffc';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ffe';
    ctx.beginPath();
    ctx.ellipse(bx - 25, by - 42, 4, 2.5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(bx + 25, by - 42, 4, 2.5, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Dashboard reflection
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,242,255,0.02)';
    ctx.beginPath();
    ctx.moveTo(bx - 45, by - 48);
    ctx.quadraticCurveTo(bx, by - 62, bx + 45, by - 48);
    ctx.quadraticCurveTo(bx, by - 40, bx - 45, by - 48);
    ctx.fill();

    ctx.restore();
  }
})();
