import * as THREE from "three";

const canvas = document.querySelector("#three-game");
const gameInstructions = document.querySelector("#game-instructions");
const noteOverlay = document.querySelector("#note-overlay");
const closeNote = document.querySelector("#close-note");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080611);
scene.fog = new THREE.FogExp2(0x100d1d, 0.028);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 150);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

scene.add(new THREE.HemisphereLight(0x9b8cd4, 0x16101b, 1.6));
scene.add(new THREE.AmbientLight(0x8a709a, 0.45));

const moon = new THREE.DirectionalLight(0x8ba5d8, 2.3);
moon.position.set(-10, 18, 8);
moon.castShadow = true;
moon.shadow.mapSize.set(1024, 1024);
scene.add(moon);

const material = (color, emissive = 0) => new THREE.MeshStandardMaterial({
  color,
  roughness: 0.68,
  metalness: 0.05,
  emissive,
  emissiveIntensity: emissive ? 1.8 : 0,
});

const stone = material(0x393240);
const wood = material(0x3f1f14);
const gold = material(0xc89c46);
const skin = material(0xd7a977);
const hair = material(0x1c120f);
const ember = material(0xff9a2e, 0xff5b14);

const world = new THREE.Group();
scene.add(world);
const obstacles = [];
const notePosition = new THREE.Vector3(-5, 0, -8);
let noteFound = false;

function box(x, y, z, w, h, d, mat, shadow = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = shadow;
  mesh.receiveShadow = true;
  world.add(mesh);
  return mesh;
}

box(0, -0.6, 0, 42, 1, 52, stone);
for (const x of [-20, 20]) box(x, 7, -5, 1.2, 15, 42, stone);
box(0, 7, -25, 42, 15, 1.2, stone);
for (let z = -22; z < 18; z += 6) {
  box(-19.3, 7, z, 0.15, 14, 4.8, material(0x4d4658));
  box(19.3, 7, z, 0.15, 14, 4.8, material(0x4d4658));
}

for (const z of [-8, 5]) {
  box(0, 0.75, z, 26, 0.4, 2.5, wood);
  box(0, -0.1, z, 24, 1.2, 1.6, material(0x29130f));
  obstacles.push({ type: "box", x: 0, z, halfWidth: 13, halfDepth: 1.35 });
}

function makeTableNote() {
  const noteCanvas = document.createElement("canvas");
  noteCanvas.width = 512;
  noteCanvas.height = 256;
  const context = noteCanvas.getContext("2d");
  context.fillStyle = "#eee0b8";
  context.fillRect(0, 0, noteCanvas.width, noteCanvas.height);
  context.strokeStyle = "#7d5b2d";
  context.lineWidth = 10;
  context.strokeRect(5, 5, noteCanvas.width - 10, noteCanvas.height - 10);
  context.fillStyle = "#241a16";
  context.font = "bold 58px Georgia";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("code: KOSP", noteCanvas.width / 2, noteCanvas.height / 2);

  const note = new THREE.Mesh(
    new THREE.PlaneGeometry(2.8, 1.4),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(noteCanvas), side: THREE.DoubleSide })
  );
  note.position.set(notePosition.x, 0.99, notePosition.z);
  note.rotation.x = -Math.PI / 2;
  world.add(note);
}

makeTableNote();

function candle(x, z, height) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, height, 10), material(0xe7d49d));
  body.position.y = height / 2;
  group.add(body);

  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10), ember);
  flame.scale.set(0.7, 1.45, 0.7);
  flame.position.y = height + 0.24;
  group.add(flame);

  const light = new THREE.PointLight(0xffae45, 1.6, 7, 2);
  light.position.y = height + 0.2;
  group.add(light);

  group.position.set(x, 1.06, z);
  world.add(group);
  return { group, flame };
}

const flames = [];
const candleHeights = [1.2, 1.8, 2.5, 1.5, 2.2, 1.7, 2.7, 1.3];
for (const z of [-8, 5]) {
  let index = 0;
  for (let x = -11; x <= 11; x += 3.6) {
    const height = candleHeights[index % candleHeights.length];
    flames.push(candle(x, z, height));
    obstacles.push({ type: "circle", x, z, radius: 0.38 });
    index += 1;
  }
}

function makePlayerCube() {
  const player = new THREE.Group();
  const robeMat = material(0x2d4b36);
  const trimMat = material(0xcaa34a);
  const tieMat = material(0x8b1d1d);
  const hairMat = material(0x1a110f);
  const glassesMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

  const robe = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.5, 1.45), robeMat);
  robe.position.y = -0.2;
  robe.castShadow = true;
  robe.receiveShadow = true;
  player.add(robe);

  const trim = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.12, 1.52), trimMat);
  trim.position.set(0, 0.18, 0);
  player.add(trim);

  const face = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), skin);
  face.position.y = 0.35;
  face.castShadow = true;
  face.receiveShadow = true;
  player.add(face);

  const hair = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.34, 1.26), hairMat);
  hair.position.set(0, 0.98, 0);
  player.add(hair);

  const glassesMaterial = new THREE.MeshBasicMaterial({ color: 0x9fe7ff, transparent: true, opacity: 0.95 });
  for (const x of [-0.28, 0.28]) {
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.22, 32), glassesMaterial);
    lens.position.set(x, 0.38, 0.63);
    lens.rotation.y = Math.PI;
    player.add(lens);
  }

  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.04), glassesMaterial);
  bridge.position.set(0, 0.38, 0.63);
  player.add(bridge);

  const scar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.04), material(0xe53935));
  scar.position.set(0.12, 0.25, 0.64);
  scar.rotation.z = 0.7;
  player.add(scar);

  const collar = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.18, 0.12), trimMat);
  collar.position.set(0, 0.03, 0.67);
  player.add(collar);

  const tie = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.08), tieMat);
  tie.position.set(0, -0.55, 0.67);
  player.add(tie);

  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.58, 0.28), material(0x1a1717));
  leftLeg.position.set(-0.25, -1.03, 0.06);
  leftLeg.castShadow = true;
  leftLeg.receiveShadow = true;
  player.add(leftLeg);

  const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.58, 0.28), material(0x1a1717));
  rightLeg.position.set(0.25, -1.03, 0.06);
  rightLeg.castShadow = true;
  rightLeg.receiveShadow = true;
  player.add(rightLeg);

  const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.5), material(0x201b1b));
  leftFoot.position.set(-0.25, -1.44, 0.14);
  leftFoot.castShadow = true;
  leftFoot.receiveShadow = true;
  player.add(leftFoot);

  const rightFoot = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.5), material(0x201b1b));
  rightFoot.position.set(0.25, -1.44, 0.14);
  rightFoot.castShadow = true;
  rightFoot.receiveShadow = true;
  player.add(rightFoot);

  const wand = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 8), material(0x9a6b3d));
  wand.rotation.z = -0.8;
  wand.position.set(0.9, -0.05, 0.2);
  player.add(wand);

  player.userData.leftLeg = leftLeg;
  player.userData.rightLeg = rightLeg;
  player.userData.leftFoot = leftFoot;
  player.userData.rightFoot = rightFoot;
  player.userData.walkCycle = 0;

  player.position.set(0, 0.72, 0);
  world.add(player);
  return player;
}

const player = makePlayerCube();
const keys = {};
let active = false;
const clock = new THREE.Clock();
const cameraRig = { yaw: Math.PI * 0.85, pitch: 0.42, distance: 7.5 };

function updateCamera() {
  const target = player.position.clone().add(new THREE.Vector3(0, 1, 0));
  const x = Math.sin(cameraRig.yaw) * cameraRig.distance * Math.cos(cameraRig.pitch);
  const z = Math.cos(cameraRig.yaw) * cameraRig.distance * Math.cos(cameraRig.pitch);
  const y = target.y + Math.sin(cameraRig.pitch) * cameraRig.distance;
  camera.position.set(target.x + x, y, target.z + z);
  camera.lookAt(target);
}

function collidesWithObstacle(x, z) {
  const playerRadius = 0.78;
  return obstacles.some((obstacle) => {
    if (obstacle.type === "circle") {
      const distanceX = x - obstacle.x;
      const distanceZ = z - obstacle.z;
      const combinedRadius = playerRadius + obstacle.radius;
      return distanceX * distanceX + distanceZ * distanceZ < combinedRadius * combinedRadius;
    }

    return Math.abs(x - obstacle.x) < obstacle.halfWidth + playerRadius
      && Math.abs(z - obstacle.z) < obstacle.halfDepth + playerRadius;
  });
}

function update(dt, elapsed) {
  if (!active) return;

  if (keys.ArrowLeft) cameraRig.yaw += 1.5 * dt;
  if (keys.ArrowRight) cameraRig.yaw -= 1.5 * dt;
  if (keys.ArrowUp) cameraRig.pitch = Math.min(1.15, cameraRig.pitch + 1.1 * dt);
  if (keys.ArrowDown) cameraRig.pitch = Math.max(0.08, cameraRig.pitch - 1.1 * dt);

  const moveX = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
  const moveZ = (keys.KeyS ? 1 : 0) - (keys.KeyW ? 1 : 0);
  const isMoving = moveX !== 0 || moveZ !== 0;

  if (isMoving) {
    const forward = new THREE.Vector3(Math.sin(cameraRig.yaw), 0, Math.cos(cameraRig.yaw));
    const right = new THREE.Vector3(Math.cos(cameraRig.yaw), 0, -Math.sin(cameraRig.yaw));
    const move = new THREE.Vector3();
    move.addScaledVector(forward, moveZ);
    move.addScaledVector(right, moveX);
    if (move.lengthSq() > 0) {
      move.normalize();
      const distance = 5.5 * dt;
      const nextX = THREE.MathUtils.clamp(player.position.x + move.x * distance, -16, 16);
      const nextZ = THREE.MathUtils.clamp(player.position.z + move.z * distance, -18, 18);

      if (!collidesWithObstacle(nextX, player.position.z)) player.position.x = nextX;
      if (!collidesWithObstacle(player.position.x, nextZ)) player.position.z = nextZ;
    }
  }

  if (!noteFound && player.position.distanceTo(notePosition) < 2.1) {
    noteFound = true;
    gameInstructions.textContent = "Find the lock & crack the code.";
    noteOverlay.hidden = false;
    closeNote.focus();
  }

  const leftLeg = player.userData.leftLeg;
  const rightLeg = player.userData.rightLeg;
  const leftFoot = player.userData.leftFoot;
  const rightFoot = player.userData.rightFoot;

  if (isMoving) {
    player.userData.walkCycle += dt * 9;
    const stride = Math.sin(player.userData.walkCycle) * 0.54;
    const lift = Math.abs(Math.sin(player.userData.walkCycle)) * 0.22;

    leftLeg.rotation.x = stride;
    rightLeg.rotation.x = -stride;
    leftFoot.rotation.x = stride * 0.9;
    rightFoot.rotation.x = -stride * 0.9;
    leftFoot.position.y = -1.44 + lift;
    rightFoot.position.y = -1.44 + lift;
  } else {
    player.userData.walkCycle = 0;
    leftLeg.rotation.x = 0;
    rightLeg.rotation.x = 0;
    leftFoot.rotation.x = 0;
    rightFoot.rotation.x = 0;
    leftFoot.position.y = -1.44;
    rightFoot.position.y = -1.44;
  }

  flames.forEach(({ flame }, index) => {
    flame.scale.y = 1.1 + Math.sin(elapsed * 7 + index) * 0.23;
  });

  updateCamera();
}

function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.04);
  update(dt, clock.elapsedTime);
  renderer.render(scene, camera);
}

window.startDiningHall3D = () => {
  active = true;
  noteFound = false;
  gameInstructions.textContent = "Find the note.";
  noteOverlay.hidden = true;
  player.position.set(0, 0.72, 0);
  cameraRig.yaw = Math.PI * 0.85;
  cameraRig.pitch = 0.42;
  cameraRig.distance = 7.5;
  updateCamera();
  canvas.hidden = false;
  document.body.classList.add("three-active");
};

window.stopDiningHall3D = () => {
  active = false;
  noteOverlay.hidden = true;
  canvas.hidden = true;
  Object.keys(keys).forEach((key) => delete keys[key]);
};

if (document.body.classList.contains("enter-hall")) window.startDiningHall3D();

addEventListener("keydown", (event) => {
  keys[event.code] = true;
  if (active && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyW", "KeyA", "KeyS", "KeyD"].includes(event.code)) {
    event.preventDefault();
  }
});

addEventListener("keyup", (event) => {
  keys[event.code] = false;
});

closeNote.addEventListener("click", () => {
  noteOverlay.hidden = true;
});

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

updateCamera();
loop();
