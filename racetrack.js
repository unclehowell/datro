// ── 3D CIRCLE TOUR ──
// Branches as buildings on a circle, Up/Down/Z/X navigation, idle auto-tour
(function() {
var scene, camera, renderer, clock;
var animId = null;
var container = null;

var moveForward = false, moveBackward = false;
var turnLeft = false, turnRight = false;
var playerHeight = 1.7;
var speed = 8;
var turnSpeed = 2.0;
var keys = {};

var BRANCHES = [
    'althea','archives','bpvsbuckler','bpvsbuckler-redflag','bucklervsbp',
    'bw_base','carfinancecheque','ccan','ceo','cnei','command',
    'command-agent-endpoint','dash','datro','dcc','financecheque',
    'financecheque-monday-agent','gh-pages','gui','hbnb','library',
    'llmwiki','pirateclaw','rerelease','subrepos','ui','wave',
    'wayback','whitepaper'
];

var COLORS = [
    0xc89a4e, 0x4ec8c8, 0xc84e6a, 0x6ac84e, 0x8a6bc8,
    0xc87a4e, 0x4e8ac8, 0xc8c84e, 0x6bc88a, 0xc84ec8,
    0x4ec88a, 0xc89a4e, 0x8ac84e, 0x4e6ac8, 0xc84e8a,
    0x6ac8c8, 0xc86a4e, 0x4ec84e, 0xc8c8c8, 0x4e4ec8,
    0xc84e4e, 0x4ec8c8, 0xc89ac8, 0x4ec86a, 0xc8c84e,
    0x6a4ec8, 0xc84ec8, 0xc86ac8
];

var buildings = [];
var buildingPositions = [];
var releaseData = {};
var playerAngle = 0;
var CIRCLE_RADIUS = 35;
var playerDistance = 8;

// Idle auto-tour state
var lastInputTime = 0;
var IDLE_TIMEOUT = 5000;
var autoTouring = false;
var tourAngle = 0;
var tourSpeed = (2 * Math.PI) / (15 * 60);
var tourPauseUntil = 0;
var tourNextBuilding = 0;
var tourGlancing = false;
var tourGlanceStart = 0;
var tourGlanceDuration = 3000;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    scene.fog = new THREE.Fog(0x0a0a1a, 40, 120);

    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 300);
    camera.position.set(0, playerHeight, playerDistance);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    var parent = container || document.body;
    parent.appendChild(renderer.domElement);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '5';
    renderer.domElement.id = 'three-canvas';

    clock = new THREE.Clock();

    // Ground
    var groundGeo = new THREE.PlaneGeometry(300, 300);
    var groundMat = new THREE.MeshLambertMaterial({ color: 0x0e0e0e });
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Circular path ring on ground
    var ringGeo = new THREE.RingGeometry(CIRCLE_RADIUS - 1.5, CIRCLE_RADIUS + 1.5, 128);
    var ringMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a, side: THREE.DoubleSide });
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    scene.add(ring);

    // Inner circle line
    var innerRingGeo = new THREE.RingGeometry(CIRCLE_RADIUS - 1.6, CIRCLE_RADIUS - 1.4, 128);
    var innerRingMat = new THREE.MeshBasicMaterial({ color: 0x2a2a2a, side: THREE.DoubleSide });
    var innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = 0.02;
    scene.add(innerRing);

    // Outer circle line
    var outerRingGeo = new THREE.RingGeometry(CIRCLE_RADIUS + 1.4, CIRCLE_RADIUS + 1.6, 128);
    var outerRingMat = new THREE.MeshBasicMaterial({ color: 0x2a2a2a, side: THREE.DoubleSide });
    var outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.rotation.x = -Math.PI / 2;
    outerRing.position.y = 0.02;
    scene.add(outerRing);

    // Grid lines on ground (sparse)
    var gridHelper = new THREE.GridHelper(300, 60, 0x151515, 0x111111);
    scene.add(gridHelper);

    // Ambient light
    var ambient = new THREE.AmbientLight(0x505050, 0.7);
    scene.add(ambient);

    // Directional light (sun)
    var dirLight = new THREE.DirectionalLight(0xfff0dd, 0.8);
    dirLight.position.set(40, 60, 30);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.camera.left = -80;
    dirLight.shadow.camera.right = 80;
    dirLight.shadow.camera.top = 80;
    dirLight.shadow.camera.bottom = -80;
    scene.add(dirLight);

    // Point lights along the circle
    for (var i = 0; i < BRANCHES.length; i++) {
        var angle = (i / BRANCHES.length) * Math.PI * 2;
        var lx = Math.cos(angle) * CIRCLE_RADIUS;
        var lz = Math.sin(angle) * CIRCLE_RADIUS;
        var pLight = new THREE.PointLight(0xc89a4e, 0.4, 20);
        pLight.position.set(lx, 5, lz);
        scene.add(pLight);
    }

    // Fetch releases for version labels
    fetch('/api/releases')
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (data.releases) {
                data.releases.forEach(function(rel) {
                    if (!releaseData[rel.branch]) releaseData[rel.branch] = [];
                    releaseData[rel.branch].push(rel);
                });
            }
            createBuildings();
        })
        .catch(function() {
            createBuildings();
        });

    // Skybox stars
    var starGeo = new THREE.BufferGeometry();
    var starVerts = [];
    for (var s = 0; s < 800; s++) {
        starVerts.push((Math.random() - 0.5) * 300, Math.random() * 80 + 20, (Math.random() - 0.5) * 300);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));
    var starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.15, transparent: true, opacity: 0.5 });
    scene.add(new THREE.Points(starGeo, starMat));

    lastInputTime = Date.now();
}

function createBuildings() {
    var count = BRANCHES.length;
    for (var i = 0; i < count; i++) {
        var angle = (i / count) * Math.PI * 2;
        var bx = Math.cos(angle) * CIRCLE_RADIUS;
        var bz = Math.sin(angle) * CIRCLE_RADIUS;
        buildingPositions.push({ angle: angle, x: bx, z: bz });

        var version = '';
        var rels = releaseData[BRANCHES[i]];
        if (rels && rels.length > 0) {
            version = rels[0].version || '';
        }
        createBuilding(BRANCHES[i], bx, bz, COLORS[i % COLORS.length], i, version);
    }
}

function createBuilding(name, x, z, color, idx, version) {
    var w = 5;
    var h = 4;
    var d = 5;

    // Main building — single story, no windows
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color, transparent: true, opacity: 0.85 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { branch: name, index: idx, version: version };
    scene.add(mesh);
    buildings.push(mesh);

    // Roof glow strip
    var glowGeo = new THREE.BoxGeometry(w + 0.2, 0.15, d + 0.2);
    var glowMat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.5 });
    var glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.set(x, h + 0.1, z);
    scene.add(glow);

    // Label sprite — branch name + semantic version
    var labelCanvas = document.createElement('canvas');
    labelCanvas.width = 256;
    labelCanvas.height = 80;
    var lctx = labelCanvas.getContext('2d');
    lctx.fillStyle = 'rgba(0,0,0,0.8)';
    lctx.fillRect(0, 0, 256, 80);

    // Branch name
    lctx.font = 'bold 22px Courier New';
    lctx.fillStyle = '#c89a4e';
    lctx.textAlign = 'center';
    lctx.fillText(name.toUpperCase(), 128, 32);

    // Semantic version
    if (version) {
        lctx.font = '16px Courier New';
        lctx.fillStyle = '#8ec8a0';
        lctx.fillText('v' + version, 128, 58);
    }

    var labelTexture = new THREE.CanvasTexture(labelCanvas);
    var labelMat = new THREE.SpriteMaterial({ map: labelTexture, transparent: true });
    var label = new THREE.Sprite(labelMat);
    label.position.set(x, h + 2, z);
    label.scale.set(6, 2, 1);
    scene.add(label);
}

function animate() {
    animId = requestAnimationFrame(animate);
    if (!renderer || !scene || !camera) return;

    var delta = clock.getDelta();
    var now = Date.now();

    if (autoTouring) {
        updateAutoTour(delta, now);
    } else {
        updateManualControls(delta, now);
    }

    camera.position.y = playerHeight;
    renderer.render(scene, camera);
}

function updateManualControls(delta, now) {
    var didInput = false;

    if (turnLeft) { playerAngle += turnSpeed * delta; didInput = true; }
    if (turnRight) { playerAngle -= turnSpeed * delta; didInput = true; }

    if (moveForward) {
        camera.position.x += Math.sin(playerAngle) * speed * delta;
        camera.position.z += -Math.cos(playerAngle) * speed * delta;
        didInput = true;
    }
    if (moveBackward) {
        camera.position.x -= Math.sin(playerAngle) * speed * delta * 0.5;
        camera.position.z -= -Math.cos(playerAngle) * speed * delta * 0.5;
        didInput = true;
    }

    camera.rotation.set(0, 0, 0);
    camera.rotateY(-playerAngle);

    // Building collisions
    var pp = camera.position;
    for (var i = 0; i < buildings.length; i++) {
        var b = buildings[i];
        var bw = b.geometry.parameters.width / 2 + 0.5;
        var bd = b.geometry.parameters.depth / 2 + 0.5;
        if (Math.abs(pp.x - b.position.x) < bw && Math.abs(pp.z - b.position.z) < bd) {
            var ox = bw - Math.abs(pp.x - b.position.x);
            var oz = bd - Math.abs(pp.z - b.position.z);
            if (ox < oz) pp.x += (pp.x > b.position.x ? ox : -ox);
            else pp.z += (pp.z > b.position.z ? oz : -oz);
        }
    }

    if (didInput) lastInputTime = now;
    else if (now - lastInputTime > IDLE_TIMEOUT && !autoTouring) startAutoTour();
}

function startAutoTour() {
    autoTouring = true;
    tourAngle = playerAngle;
    var best = Infinity;
    tourNextBuilding = 0;
    for (var i = 0; i < buildingPositions.length; i++) {
        var d = buildingPositions[i].angle - tourAngle;
        while (d < 0) d += Math.PI * 2;
        while (d > Math.PI * 2) d -= Math.PI * 2;
        if (d < best) { best = d; tourNextBuilding = i; }
    }
    tourPauseUntil = 0;
    tourGlancing = false;
}

function updateAutoTour(delta, now) {
    var count = buildingPositions.length;
    if (tourGlancing) {
        if (now > tourGlanceStart + tourGlanceDuration) {
            tourGlancing = false;
            tourPauseUntil = now + 500;
            tourNextBuilding = (tourNextBuilding + 1) % count;
        } else {
            var p = (now - tourGlanceStart) / tourGlanceDuration;
            camera.rotation.set(0, 0, 0);
            camera.rotateY(-tourAngle - Math.sin(p * Math.PI) * 0.8);
        }
        return;
    }
    if (now < tourPauseUntil) {
        camera.rotation.set(0, 0, 0);
        camera.rotateY(-tourAngle);
        return;
    }
    var target = buildingPositions[tourNextBuilding].angle;
    var diff = target - tourAngle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    if (Math.abs(diff) < 0.05) {
        tourAngle = target;
        camera.position.x = Math.cos(tourAngle) * (CIRCLE_RADIUS - playerDistance);
        camera.position.z = Math.sin(tourAngle) * (CIRCLE_RADIUS - playerDistance);
        tourGlancing = true;
        tourGlanceStart = now;
        return;
    }
    var step = tourSpeed * delta * 3;
    tourAngle += (Math.abs(diff) < step ? diff : (diff > 0 ? step : -step));
    camera.position.x = Math.cos(tourAngle) * (CIRCLE_RADIUS - playerDistance);
    camera.position.z = Math.sin(tourAngle) * (CIRCLE_RADIUS - playerDistance);
    camera.rotation.set(0, 0, 0);
    camera.rotateY(-tourAngle);
}

function onKeyDown(e) {
    keys[e.code] = true;
    if (autoTouring) { autoTouring = false; lastInputTime = Date.now(); playerAngle = tourAngle; }
    if (e.code === 'ArrowUp') { moveForward = true; e.preventDefault(); }
    if (e.code === 'ArrowDown') { moveBackward = true; e.preventDefault(); }
    if (e.code === 'KeyZ') { turnLeft = true; e.preventDefault(); }
    if (e.code === 'KeyX') { turnRight = true; e.preventDefault(); }
}

function onKeyUp(e) {
    keys[e.code] = false;
    if (e.code === 'ArrowUp') moveForward = false;
    if (e.code === 'ArrowDown') moveBackward = false;
    if (e.code === 'KeyZ') turnLeft = false;
    if (e.code === 'KeyX') turnRight = false;
}

function onResize() {
    if (!renderer || !camera) return;
    var w = (container || document.body).clientWidth;
    var h = (container || document.body).clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}

function startLoop() { if (animId) cancelAnimationFrame(animId); animate(); }
function stopLoop() { if (animId) { cancelAnimationFrame(animId); animId = null; } }

// ── Public API ──
if (typeof window !== 'undefined') {
    var listenersAttached = false;

    window.trackInit = function(containerEl) {
        container = containerEl || document.body;
        if (!scene) init();
        if (renderer && renderer.domElement && container) {
            if (!renderer.domElement.parentNode || renderer.domElement.parentNode !== container)
                container.appendChild(renderer.domElement);
        }
        if (renderer && container) {
            var w = container.clientWidth, h = container.clientHeight;
            if (w > 0 && h > 0) { renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
        }
        camera.position.set(0, playerHeight, CIRCLE_RADIUS - playerDistance);
        playerAngle = 0;
        camera.rotation.set(0, 0, 0);
        lastInputTime = Date.now();
        autoTouring = false;
        startLoop();
        if (!listenersAttached) {
            document.addEventListener('keydown', onKeyDown);
            document.addEventListener('keyup', onKeyUp);
            window.addEventListener('resize', onResize);
            listenersAttached = true;
        }
    };

    window.trackSetSteering = function(v) { playerAngle += v * 0.05; };

    window.trackStop = function() {
        stopLoop();
        document.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('keyup', onKeyUp);
        window.removeEventListener('resize', onResize);
        autoTouring = false;
        listenersAttached = false;
    };
}
})();
