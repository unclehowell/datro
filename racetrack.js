// ── 3D PERSPECTIVE ROAD ──
(function() {
var steering = 0;
var offset = 0;
var animId = null;
var canvas = null;
var ctx = null;
var W = 0, H = 0;

var SEGMENT_COUNT = 100;
var SEGMENT_LENGTH = 8;
var DRAW_DISTANCE = 250;
var FOV = 100;
var CAMERA_HEIGHT = 1200;
var CAMERA_DEPTH = 1 - 0.35;

var branches = ['althea','bpvsbuckler','carfinancecheque','ccan','ceo','cnei','command','dash','datro','dcc','financecheque','gui','llmwiki','pirateclaw','subrepos','ui','wave','wayback','whitepaper'];

var roadWidth = 2800;
var laneCount = 4;
var rumbleWidth = 500;

var colors = {
    sky: '#0d0d2b',
    ground: '#0a0f0a',
    road: '#2a2a2a',
    rumble: '#444',
    lane: 'rgba(255,255,255,0.6)',
    grass: '#0d1a0d',
    marker: '#c89a4e',
};

var segments = [];
for (var i = 0; i < SEGMENT_COUNT; i++) {
    segments.push({
        p1: { world: { y: 0, z: 0 }, camera: {}, screen: {} },
        p2: { world: { y: 0, z: 0 }, camera: {}, screen: {} },
        curve: 0,
        color: { road: colors.road, grass: colors.grass, rumble: colors.rumble },
        branch: null,
    });
}

function project(p, cameraX, cameraY, cameraZ, index) {
    p.camera.x = (p.world.x || 0) - cameraX;
    p.camera.y = p.world.y - cameraY;
    p.camera.z = p.world.z - cameraZ;
    p.screen.x = (p.camera.x / p.camera.z) * FOV + W / 2;
    p.screen.y = (p.camera.y / p.camera.z) * FOV + H / 2 - (CAMERA_HEIGHT / p.camera.z) * FOV;
    p.screen.w = FOV / p.camera.z;
}

function buildTrack(progress) {
    var totalLength = SEGMENT_COUNT * SEGMENT_LENGTH;
    var baseZ = 0;
    for (var i = 0; i < SEGMENT_COUNT; i++) {
        var s = segments[i];
        s.p1.world.z = i * SEGMENT_LENGTH;
        s.p2.world.z = (i + 1) * SEGMENT_LENGTH;
        s.p1.world.y = 0;
        s.p2.world.y = 0;
        s.p1.world.x = 0;
        s.p2.world.x = 0;
        s.curve = 0;
        s.branch = null;

        var lapSeg = (progress * SEGMENT_COUNT + i) % SEGMENT_COUNT;
        var branchIdx = Math.floor(lapSeg * branches.length / SEGMENT_COUNT) % branches.length;
        if ((i % Math.floor(SEGMENT_COUNT / branches.length)) === 0 && i < SEGMENT_COUNT * 0.8) {
            s.branch = branches[branchIdx];
        }
    }
}

function drawSegment(s, prev, next, x1, y1, w1, x2, y2, w2, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1 - w1, y1);
    ctx.lineTo(x1 + w1, y1);
    ctx.lineTo(x2 + w2, y2);
    ctx.lineTo(x2 - w2, y2);
    ctx.fill();
}

function draw() {
    W = canvas.width = canvas.clientWidth || window.innerWidth;
    H = canvas.height = canvas.clientHeight || window.innerHeight;

    var horizon = H * 0.40;
    var progress = (Date.now() % (48 * 60 * 60 * 1000)) / (48 * 60 * 60 * 1000);

    buildTrack(progress);

    ctx.clearRect(0, 0, W, H);

    // Sky gradient
    var grad = ctx.createLinearGradient(0, 0, 0, horizon);
    grad.addColorStop(0, '#0a0a1a');
    grad.addColorStop(0.5, '#1a1a3e');
    grad.addColorStop(1, '#2a1a0a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, horizon);

    // Stars
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    var seed = 12345;
    for (var i = 0; i < 80; i++) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        var sx = (seed % W);
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        var sy = (seed % horizon * 0.6);
        ctx.fillRect(sx, sy, 1.5, 1.5);
    }

    // Ground
    ctx.fillStyle = colors.ground;
    ctx.fillRect(0, horizon, W, H - horizon);

    var cameraX = 0;
    var cameraY = CAMERA_HEIGHT;
    var cameraZ = 0;

    var playerSegment = segments[Math.floor(progress * SEGMENT_COUNT) % SEGMENT_COUNT];
    var basePercent = (progress * SEGMENT_COUNT) % 1;
    var playerZ = (Math.floor(progress * SEGMENT_COUNT) % SEGMENT_COUNT + basePercent) * SEGMENT_LENGTH;

    var x = 0, dx = 0;
    var maxZ = SEGMENT_COUNT * SEGMENT_LENGTH;

    offset += 1.2;
    var steerOffset = steering * 120 * Math.sin(Date.now() / 3000);

    for (var i = 0; i < DRAW_DISTANCE; i++) {
        var idx = Math.floor(progress * SEGMENT_COUNT + i) % SEGMENT_COUNT;
        var s = segments[idx];
        var looped = Math.floor((progress * SEGMENT_COUNT + i) / SEGMENT_COUNT);

        s.p1.world.z = i * SEGMENT_LENGTH - basePercent * SEGMENT_LENGTH;
        s.p2.world.z = (i + 1) * SEGMENT_LENGTH - basePercent * SEGMENT_LENGTH;
        s.p1.world.x = x;
        s.p2.world.x = x + dx;

        s.curve = Math.sin(i * 0.08 + progress * Math.PI * 2) * 3 + steerOffset * 0.01;

        dx += s.curve;

        project(s.p1, 0, CAMERA_HEIGHT, 0, i);
        project(s.p2, 0, CAMERA_HEIGHT, 0, i);

        x += dx;

        if (s.p1.camera.z <= 0 || s.p2.camera.z <= 0) continue;
        if (s.p1.screen.y <= horizon && s.p2.screen.y <= horizon) continue;
        if (s.p1.screen.y >= H && s.p2.screen.y >= H) continue;

        var w1 = FOV * roadWidth / s.p1.camera.z / 2;
        var w2 = FOV * roadWidth / s.p2.camera.z / 2;
        var rw1 = FOV * (roadWidth + rumbleWidth * 2) / s.p1.camera.z / 2;
        var rw2 = FOV * (roadWidth + rumbleWidth * 2) / s.p2.camera.z / 2;
        var gw1 = rw1 + FOV * 5000 / s.p1.camera.z;
        var gw2 = rw2 + FOV * 5000 / s.p2.camera.z;

        // Grass
        drawSegment(s, null, null, s.p1.screen.x, s.p1.screen.y, gw1, s.p2.screen.x, s.p2.screen.y, gw2, colors.grass);

        // Rumble strip
        var rumbleColor = (i % 2 === 0) ? '#555' : '#222';
        drawSegment(s, null, null, s.p1.screen.x, s.p1.screen.y, rw1, s.p2.screen.x, s.p2.screen.y, rw2, rumbleColor);

        // Road
        drawSegment(s, null, null, s.p1.screen.x, s.p1.screen.y, w1, s.p2.screen.x, s.p2.screen.y, w2, '#2a2a2a');

        // Lane markings
        if (i > 0 && i % 3 === 0) {
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(s.p1.screen.x - w1 * 0.33, s.p1.screen.y);
            ctx.lineTo(s.p2.screen.x - w2 * 0.33, s.p2.screen.y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(s.p1.screen.x + w1 * 0.33, s.p1.screen.y);
            ctx.lineTo(s.p2.screen.x + w2 * 0.33, s.p2.screen.y);
            ctx.stroke();
        }

        // Milestone markers
        if (s.branch && s.p1.camera.z > 10 && s.p1.screen.y > horizon && s.p1.screen.y < H) {
            var scale = FOV / s.p1.camera.z;
            var postH = 40 * scale;
            var postW = 4 * scale;
            ctx.fillStyle = '#c89a4e';
            ctx.fillRect(s.p1.screen.x - w1 - postW, s.p1.screen.y - postH, postW * 2, postH);
            ctx.fillStyle = '#fff';
            ctx.font = Math.max(6, 8 * scale) + 'px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(s.branch.slice(0, 4), s.p1.screen.x - w1, s.p1.screen.y - postH - 2);
        }
    }

    // HUD overlay
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(10, H - 50, 200, 40);
    ctx.fillStyle = '#c89a4e';
    ctx.font = '10px monospace';
    ctx.fillText('STEER: ' + steering.toFixed(2), 20, H - 30);

    // Mini-map
    var miniSize = Math.min(W * 0.18, 140);
    var miniX = W - miniSize - 15;
    var miniY = 15;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(miniX, miniY, miniSize, miniSize);
    ctx.strokeStyle = 'rgba(200,154,78,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(miniX, miniY, miniSize, miniSize);

    var cx = miniX + miniSize / 2;
    var cy = miniY + miniSize / 2;
    var mapR = miniSize * 0.4;

    // Lap track circle
    ctx.strokeStyle = 'rgba(200,154,78,0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, mapR, 0, Math.PI * 2);
    ctx.stroke();

    // Milestone dots on mini-map
    var dotR = mapR * 0.85;
    for (var i = 0; i < branches.length; i++) {
        var a = (i / branches.length) * Math.PI * 2 - Math.PI / 2;
        ctx.fillStyle = 'rgba(200,154,78,0.15)';
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * dotR, cy + Math.sin(a) * dotR, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Player car on mini-map
    var carAngle = progress * Math.PI * 2 - Math.PI / 2;
    ctx.fillStyle = '#00e5ff';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(carAngle) * dotR + steerOffset * 0.3, cy + Math.sin(carAngle) * dotR, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Steering indicator on mini-map
    ctx.strokeStyle = '#c89a4e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + steerOffset * 0.5, cy - 8);
    ctx.stroke();

    animId = requestAnimationFrame(draw);
}

if (typeof window !== 'undefined') {
    window.trackInit = function(cv) {
        canvas = cv;
        ctx = canvas.getContext('2d');
        if (animId) cancelAnimationFrame(animId);
        draw();
    };
    window.trackSetSteering = function(v) {
        steering = Math.max(-1, Math.min(1, v || 0));
    };
    window.trackStop = function() {
        if (animId) {
            cancelAnimationFrame(animId);
            animId = null;
        }
    };
}
})();
