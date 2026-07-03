// ── 3D FPS CITY WORLD ──
// Branches as buildings, first-person navigation with WASD + mouse
(function() {
var scene, camera, renderer, clock;
var animId = null;
var canvas = null;
var container = null;
var locked = false;

var moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();
var euler = new THREE.Euler(0, 0, 0, 'YXZ');
var PI_2 = Math.PI / 2;

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
    0x6a4ec8, 0xc84ec8, 0x4ec89a, 0xc86ac8
];

var buildings = [];
var raycaster = new THREE.Raycaster();
var playerHeight = 1.7;
var speed = 8;
var keys = {};

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    scene.fog = new THREE.Fog(0x0a0a1a, 30, 80);

    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 200);
    camera.position.set(0, playerHeight, 0);

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
    var groundGeo = new THREE.PlaneGeometry(200, 200);
    var groundMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid lines on ground
    var gridHelper = new THREE.GridHelper(200, 40, 0x222222, 0x181818);
    scene.add(gridHelper);

    // Ambient light
    var ambient = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambient);

    // Directional light (sun)
    var dirLight = new THREE.DirectionalLight(0xfff0dd, 0.8);
    dirLight.position.set(30, 50, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 150;
    dirLight.shadow.camera.left = -60;
    dirLight.shadow.camera.right = 60;
    dirLight.shadow.camera.top = 60;
    dirLight.shadow.camera.bottom = -60;
    scene.add(dirLight);

    // Point lights at intersections
    for (var i = -40; i <= 40; i += 20) {
        for (var j = -40; j <= 40; j += 20) {
            var pLight = new THREE.PointLight(0xc89a4e, 0.3, 15);
            pLight.position.set(i, 4, j);
            scene.add(pLight);
        }
    }

    // Create buildings for each branch
    var cols = Math.ceil(Math.sqrt(BRANCHES.length));
    var spacing = 12;
    var startX = -(cols * spacing) / 2;
    var startZ = -(Math.ceil(BRANCHES.length / cols) * spacing) / 2;

    for (var i = 0; i < BRANCHES.length; i++) {
        var row = Math.floor(i / cols);
        var col = i % cols;
        var x = startX + col * spacing + spacing / 2;
        var z = startZ + row * spacing + spacing / 2;

        createBuilding(BRANCHES[i], x, z, COLORS[i % COLORS.length], i);
    }

    // Skybox stars
    var starGeo = new THREE.BufferGeometry();
    var starVerts = [];
    for (var s = 0; s < 500; s++) {
        starVerts.push((Math.random() - 0.5) * 200, Math.random() * 60 + 20, (Math.random() - 0.5) * 200);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starVerts, 3));
    var starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.15, transparent: true, opacity: 0.6 });
    scene.add(new THREE.Points(starGeo, starMat));
}

function createBuilding(name, x, z, color, idx) {
    var w = 4 + Math.random() * 3;
    var h = 3 + Math.random() * 8;
    var d = 4 + Math.random() * 3;

    // Main building
    var geo = new THREE.BoxGeometry(w, h, d);
    var mat = new THREE.MeshLambertMaterial({ color: color, transparent: true, opacity: 0.85 });
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { branch: name, index: idx };
    scene.add(mesh);
    buildings.push(mesh);

    // Windows (emissive dots)
    var windowMat = new THREE.MeshBasicMaterial({ color: 0xffffaa, transparent: true, opacity: 0.7 });
    for (var wy = 1.5; wy < h - 0.5; wy += 1.2) {
        for (var side = 0; side < 4; side++) {
            var wx = (side === 0 ? w/2 + 0.01 : side === 2 ? -w/2 - 0.01 : 0);
            var wz = (side === 1 ? d/2 + 0.01 : side === 3 ? -d/2 - 0.01 : 0);
            if (side < 2) {
                for (var wi = -w/3; wi <= w/3; wi += w/3) {
                    var win = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.05), windowMat);
                    if (side === 0) win.position.set(x + wx, wy, z + wi);
                    else if (side === 2) win.position.set(x + wx, wy, z + wi);
                    else win.position.set(x + wi, wy, z + wz);
                    scene.add(win);
                }
            } else {
                for (var wi2 = -d/3; wi2 <= d/3; wi2 += d/3) {
                    var win2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 0.3), windowMat);
                    win2.position.set(x + wi2, wy, z + wz);
                    scene.add(win2);
                }
            }
        }
    }

    // Roof glow
    var glowGeo = new THREE.BoxGeometry(w + 0.2, 0.1, d + 0.2);
    var glowMat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.4 });
    var glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.set(x, h + 0.1, z);
    scene.add(glow);

    // Label (using sprite)
    var labelCanvas = document.createElement('canvas');
    labelCanvas.width = 256;
    labelCanvas.height = 64;
    var lctx = labelCanvas.getContext('2d');
    lctx.fillStyle = 'rgba(0,0,0,0.7)';
    lctx.fillRect(0, 0, 256, 64);
    lctx.font = 'bold 24px Courier New';
    lctx.fillStyle = '#c89a4e';
    lctx.textAlign = 'center';
    lctx.fillText(name.toUpperCase(), 128, 40);

    var labelTexture = new THREE.CanvasTexture(labelCanvas);
    var labelMat = new THREE.SpriteMaterial({ map: labelTexture, transparent: true });
    var label = new THREE.Sprite(labelMat);
    label.position.set(x, h + 1.5, z);
    label.scale.set(4, 1, 1);
    scene.add(label);
}

function onMouseMove(e) {
    if (!locked) return;
    euler.setFromQuaternion(camera.quaternion);
    euler.y -= e.movementX * 0.002;
    euler.x -= e.movementY * 0.002;
    euler.x = Math.max(-PI_2, Math.min(PI_2, euler.x));
    camera.quaternion.setFromEuler(euler);
}

function onKeyDown(e) {
    keys[e.code] = true;
}
function onKeyUp(e) {
    keys[e.code] = false;
}

function animate() {
    animId = requestAnimationFrame(animate);
    if (!renderer || !scene || !camera) return;

    var delta = clock.getDelta();

    // Movement
    velocity.x -= velocity.x * 8.0 * delta;
    velocity.z -= velocity.z * 8.0 * delta;

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();

    if (moveForward || moveBackward) velocity.z -= direction.z * speed * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * speed * delta;

    // Apply movement in camera direction
    var forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(camera.quaternion);
    forward.y = 0;
    forward.normalize();

    var right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(camera.quaternion);
    right.y = 0;
    right.normalize();

    camera.position.addScaledVector(forward, -velocity.z * delta);
    camera.position.addScaledVector(right, -velocity.x * delta);

    // Keep player at walking height
    camera.position.y = playerHeight;

    // Boundary clamp
    camera.position.x = Math.max(-90, Math.min(90, camera.position.x));
    camera.position.z = Math.max(-90, Math.min(90, camera.position.z));

    // Check building collisions (simple AABB)
    var playerPos = camera.position;
    for (var i = 0; i < buildings.length; i++) {
        var b = buildings[i];
        var bw = b.geometry.parameters.width / 2 + 0.5;
        var bd = b.geometry.parameters.depth / 2 + 0.5;
        var bx = b.position.x;
        var bz = b.position.z;

        if (Math.abs(playerPos.x - bx) < bw && Math.abs(playerPos.z - bz) < bd) {
            // Push player out
            var overlapX = bw - Math.abs(playerPos.x - bx);
            var overlapZ = bd - Math.abs(playerPos.z - bz);
            if (overlapX < overlapZ) {
                playerPos.x += (playerPos.x > bx ? overlapX : -overlapX);
            } else {
                playerPos.z += (playerPos.z > bz ? overlapZ : -overlapZ);
            }
        }
    }

    renderer.render(scene, camera);
}

function onPointerLockChange() {
    locked = document.pointerLockElement === renderer.domElement;
}

function onClick() {
    if (!locked && renderer && renderer.domElement) {
        renderer.domElement.requestPointerLock();
    }
}

function onResize() {
    if (!renderer || !camera) return;
    var w = (container || document.body).clientWidth;
    var h = (container || document.body).clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}

function startLoop() {
    if (animId) cancelAnimationFrame(animId);
    animate();
}

function stopLoop() {
    if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
    }
}

// ── Public API ──
if (typeof window !== 'undefined') {
    var listenersAttached = false;

    window.trackInit = function(containerEl) {
        container = containerEl || document.body;
        if (!scene) {
            init();
        }
        // Always ensure canvas is in the DOM
        if (renderer && renderer.domElement && container) {
            if (!renderer.domElement.parentNode || renderer.domElement.parentNode !== container) {
                container.appendChild(renderer.domElement);
            }
        }
        // Size renderer to container
        if (renderer && container) {
            var w = container.clientWidth;
            var h = container.clientHeight;
            if (w > 0 && h > 0) {
                renderer.setSize(w, h);
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
            }
        }
        startLoop();

        if (!listenersAttached) {
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('keydown', onKeyDown);
            document.addEventListener('keyup', onKeyUp);
            document.addEventListener('pointerlockchange', onPointerLockChange);
            window.addEventListener('resize', onResize);
            if (renderer && renderer.domElement) {
                renderer.domElement.addEventListener('click', onClick);
            }
            listenersAttached = true;
        }
    };

    window.trackSetSteering = function(v) {
        // Steering maps to left/right look
        euler.setFromQuaternion(camera.quaternion);
        euler.y += v * 0.05;
        camera.quaternion.setFromEuler(euler);
    };

    window.trackStop = function() {
        stopLoop();
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('keyup', onKeyUp);
        document.removeEventListener('pointerlockchange', onPointerLockChange);
        window.removeEventListener('resize', onResize);
        if (renderer && renderer.domElement) {
            renderer.domElement.removeEventListener('click', onClick);
            if (document.pointerLockElement === renderer.domElement) {
                document.exitPointerLock();
            }
        }
        listenersAttached = false;
    };
}
})();
