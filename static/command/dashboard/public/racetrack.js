// ── ENHANCED DRIVER VIEW TRACK ──
(function() {
function initTrack(canvas) {
    var ctx = canvas.getContext('2d');
    var animId = null;
    var offset = 0;

    function resize() {
        canvas.width = canvas.clientWidth || window.innerWidth;
        canvas.height = canvas.clientHeight || window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // Rerelease branches (24 milestones)
    var branches = ['althea', 'bpvsbuckler', 'bpvsbuckler-redflag', 'bucklervsbp', 'bw_base', 'carfinancecheque', 'ccan', 'ceo', 'cnei', 'command', 'dash', 'datro', 'dcc', 'financecheque', 'gh-pages', 'gui', 'llmwiki', 'pirateclaw', 'rerelease', 'subrepos', 'ui', 'wave', 'wayback', 'whitepaper'];

    function draw() {
        var W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        // --- Driver View ---
        var horizon = H * 0.3;
        ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, W, horizon); // Sky
        ctx.fillStyle = '#0d1a0d'; ctx.fillRect(0, horizon, W, H - horizon); // Ground

        // Road with curve
        var t = Date.now() / 10000;
        var curve = Math.sin(t) * 100;
        
        ctx.fillStyle = '#181818';
        ctx.beginPath();
        ctx.moveTo(W/2 - 200 + curve, horizon);
        ctx.lineTo(W/2 + 200 + curve, horizon);
        ctx.lineTo(W + 500, H);
        ctx.lineTo(-500, H);
        ctx.fill();

        // Long center lines
        offset += 0.5; // Slower speed
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 5;
        for (var i = -H + (offset % 100); i < H; i += 100) {
            ctx.beginPath();
            ctx.moveTo(W/2 + (curve * (i / H)), horizon + i);
            ctx.lineTo(W/2 + (curve * ((i + 50) / H)), horizon + i + 50); // Long lines
            ctx.stroke();
        }

        // Roadside Landmarks (Rerelease schedule)
        var lapTime = 48 * 60 * 60 * 1000;
        var progress = (Date.now() % lapTime) / lapTime;
        for(var i=0; i<branches.length; i++) {
            var mProgress = i / branches.length;
            var relPos = (mProgress - progress + 1) % 1;
            if(relPos < 0.2) { // Landmarks in view
                var lx = W/2 + 300 + (curve * (1 - relPos));
                var ly = horizon + (relPos * H);
                ctx.fillStyle = 'yellow';
                ctx.fillRect(lx, ly, 10, 50);
                ctx.fillStyle = 'white';
                ctx.font = '10px monospace';
                ctx.fillText(branches[i], lx, ly - 5);
            }
        }

        // --- Mini-map ---
        var miniW = W * 0.2, miniX = W - miniW - 10, miniY = 10;
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(miniX, miniY, miniW, miniW);
        ctx.strokeStyle = '#666'; ctx.beginPath(); ctx.arc(miniX + miniW/2, miniY + miniW/2, miniW/3, 0, Math.PI*2); ctx.stroke();
        
        // Car
        var angle = progress * Math.PI * 2 - Math.PI / 2;
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath(); ctx.arc(miniX + miniW/2 + Math.cos(angle)*miniW/3, miniY + miniW/2 + Math.sin(angle)*miniW/3, 3, 0, Math.PI*2); ctx.fill();

        animId = requestAnimationFrame(draw);
    }
    draw();
}

if (typeof window !== 'undefined') {
    window.trackInit = initTrack;
}
})();
