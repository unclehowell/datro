// ── DRIVER VIEW TRACK ANIMATION ──
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

    function draw() {
        var W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        // --- Main Driver View (Pseudo 3D) ---
        var horizon = H * 0.3;
        
        // Sky
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, W, horizon);
        
        // Ground
        ctx.fillStyle = '#0d1a0d';
        ctx.fillRect(0, horizon, W, H - horizon);

        // Road
        var roadW = W * 0.6;
        var grad = ctx.createLinearGradient(0, horizon, 0, H);
        grad.addColorStop(0, '#2a2a2a');
        grad.addColorStop(1, '#181818');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(W/2 - roadW/2, horizon);
        ctx.lineTo(W/2 + roadW/2, horizon);
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.fill();

        // Road center dashed line
        offset += 2;
        var dashLen = 20;
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 5;
        for (var i = -H + (offset % 40); i < H; i += 40) {
            ctx.beginPath();
            ctx.moveTo(W/2, horizon + i);
            ctx.lineTo(W/2, horizon + i + dashLen);
            ctx.stroke();
        }

        // --- Top Right Mini-map ---
        var miniW = W * 0.25;
        var miniH = H * 0.25;
        var miniX = W - miniW - 10;
        var miniY = 10;
        var miniCx = miniX + miniW/2;
        var miniCy = miniY + miniH/2;
        var miniRadius = Math.min(miniW, miniH) * 0.35;

        // Mini-map background
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(miniX, miniY, miniW, miniH);
        
        // Mini-map track
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(miniCx, miniCy, miniRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Mini-map car position (48h lap)
        var now = new Date();
        var lapTime = 48 * 60 * 60 * 1000;
        var angle = ((now.getTime() % lapTime) / lapTime) * Math.PI * 2 - Math.PI / 2;
        var carX = miniCx + Math.cos(angle) * miniRadius;
        var carY = miniCy + Math.sin(angle) * miniRadius;

        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.arc(carX, carY, 3, 0, Math.PI * 2);
        ctx.fill();

        animId = requestAnimationFrame(draw);
    }
    draw();
}

if (typeof window !== 'undefined') {
    window.trackInit = initTrack;
}
})();
