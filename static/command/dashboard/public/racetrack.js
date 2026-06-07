// ── ROAD ANIMATION ──
(function() {
function initRoad() {
    var canvas = document.getElementById('track-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var offset = 0;
    var steering = 0;
    var animId = null;

    function resize() {
        canvas.width = canvas.clientWidth || window.innerWidth;
        canvas.height = canvas.clientHeight || window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    window.trackSetSteering = function(v) { steering = v; };

    function draw() {
        var W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        var vx = W / 2 + steering * W * 0.15;
        var vy = H * 0.32;
        var bottomW = W * 0.55;
        var topW = W * 0.04;

        // Grass
        ctx.fillStyle = '#0d1a0d';
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(vx - topW/2, vy); ctx.lineTo(vx - bottomW/2 + steering*W*0.08, H); ctx.lineTo(0, H);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(W, 0); ctx.lineTo(vx + topW/2, vy); ctx.lineTo(vx + bottomW/2 + steering*W*0.08, H); ctx.lineTo(W, H);
        ctx.closePath(); ctx.fill();

        // Road surface gradient
        var grad = ctx.createLinearGradient(0, vy, 0, H);
        grad.addColorStop(0, '#2a2a2a');
        grad.addColorStop(0.4, '#1e1e1e');
        grad.addColorStop(1, '#181818');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(vx - topW/2, vy);
        ctx.lineTo(vx + topW/2, vy);
        ctx.lineTo(vx + bottomW/2 + steering*W*0.08, H);
        ctx.lineTo(vx - bottomW/2 + steering*W*0.08, H);
        ctx.closePath(); ctx.fill();

        // Shoulder lines
        ctx.strokeStyle = '#c89a4e';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#c89a4e';
        ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.moveTo(vx - topW/2, vy); ctx.lineTo(vx - bottomW/2 + steering*W*0.08, H); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(vx + topW/2, vy); ctx.lineTo(vx + bottomW/2 + steering*W*0.08, H); ctx.stroke();
        ctx.shadowBlur = 0;

        // Road edge amber glow
        ctx.strokeStyle = 'rgba(200,154,78,0.15)';
        ctx.lineWidth = 12;
        ctx.beginPath(); ctx.moveTo(vx - topW/2, vy); ctx.lineTo(vx - bottomW/2 + steering*W*0.08, H); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(vx + topW/2, vy); ctx.lineTo(vx + bottomW/2 + steering*W*0.08, H); ctx.stroke();

        // Center dashes
        var speed = 1.5 + (window._config && window._config.gear ? window._config.gear : 3) * 0.4;
        offset += speed;
        var dashLen = 25;
        var gapLen = 30;
        var totalLen = dashLen + gapLen;
        offset %= totalLen;

        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = 'rgba(255,255,255,0.2)';
        ctx.shadowBlur = 4;

        for (var t = -totalLen + offset; t < H + totalLen; t += totalLen) {
            var roadFrac = Math.min(1, t / H);
            var w = topW + (bottomW - topW) * roadFrac;
            var cx = vx + steering * W * 0.08 * roadFrac;
            var y = vy + (H - vy) * roadFrac;
            var nextFrac = Math.min(1, (t + dashLen) / H);
            var nextCx = vx + steering * W * 0.08 * nextFrac;
            var nextY = vy + (H - vy) * nextFrac;
            ctx.beginPath();
            ctx.moveTo(cx, y);
            ctx.lineTo(nextCx, nextY);
            ctx.stroke();
        }
        ctx.shadowBlur = 0;

        animId = requestAnimationFrame(draw);
    }
    draw();
}

if (typeof window !== 'undefined') {
    window.trackInit = initRoad;
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            if (document.getElementById('track-canvas')) initRoad();
        });
    } else {
        if (document.getElementById('track-canvas')) initRoad();
    }
}
})();
