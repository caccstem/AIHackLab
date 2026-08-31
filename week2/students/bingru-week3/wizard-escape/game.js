import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const canvas = document.querySelector("#three-game");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080611);
scene.fog = new THREE.FogExp2(0x100d1d, 0.026);
const world = new THREE.Group();
scene.add(world);
const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 140);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;

scene.add(new THREE.HemisphereLight(0x9b8cd4, 0x16101b, 1.6));
scene.add(new THREE.AmbientLight(0x8a709a, 0.45));
const moon = new THREE.DirectionalLight(0x8ba5d8, 2.3);
moon.position.set(-10, 18, 8); moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024); scene.add(moon);

const material = (color, emissive = 0) => new THREE.MeshStandardMaterial({ color, roughness: 0.68, metalness: 0.05, emissive, emissiveIntensity: emissive ? 1.8 : 0 });
const stone = material(0x393240), wood = material(0x3f1f14), gold = material(0xc89c46), robe = material(0x171623), skin = material(0xe5b68f), hair = material(0x21151b), ember = material(0xff9a2e, 0xff5b14);

function box(x, y, z, w, h, d, mat, shadow = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z); mesh.castShadow = shadow; mesh.receiveShadow = true; world.add(mesh); return mesh;
}

box(0, -0.6, 0, 42, 1, 52, stone);
for (const x of [-20, 20]) box(x, 7, -5, 1.2, 15, 42, stone);
box(0, 7, -25, 42, 15, 1.2, stone);
for (let z = -22; z < 18; z += 6) { box(-19.3, 7, z, .15, 14, 4.8, material(0x4d4658)); box(19.3, 7, z, .15, 14, 4.8, material(0x4d4658)); }

function candle(x, z, height) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(.11, .13, height, 10), material(0xe7d49d)); body.position.y = height / 2; group.add(body);
  const flame = new THREE.Mesh(new THREE.SphereGeometry(.19, 12, 10), ember); flame.scale.set(.7, 1.45, .7); flame.position.y = height + .24; group.add(flame);
  const light = new THREE.PointLight(0xffae45, 1.6, 7, 2); light.position.y = height + .2; group.add(light);
  group.position.set(x, 1.06, z); world.add(group); return { group, flame };
}

for (const z of [-8, 5]) {
  box(0, .75, z, 26, .4, 2.5, wood); box(0, -.1, z, 24, 1.2, 1.6, material(0x29130f));
  for (let x = -11; x <= 11; x += 3.6) candle(x, z, 1.4 + ((x + z + 20) % 4) * .34);
}

const flames = [];
for (const x of [-9, -3, 3, 9]) flames.push(candle(x, -15, 1.2 + Math.abs(x) / 7));

function portraitTexture(tint) {
  const c = document.createElement("canvas"); c.width = 160; c.height = 220; const ctx = c.getContext("2d");
  ctx.fillStyle = tint; ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = "rgba(255,214,147,.2)"; ctx.beginPath(); ctx.arc(80, 75, 30, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#3a2928"; ctx.fillRect(47, 103, 66, 90); ctx.fillStyle = "#be8f69"; ctx.beginPath(); ctx.ellipse(80, 78, 22, 29, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#2a1b1e"; ctx.fillRect(57, 49, 48, 18); ctx.strokeStyle = "rgba(74,40,26,.45)"; for (let i = 0; i < 17; i++) { ctx.beginPath(); ctx.moveTo(Math.random() * 160, Math.random() * 220); ctx.lineTo(Math.random() * 160, Math.random() * 220); ctx.stroke(); }
  const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}
function makePortrait(x, z, tint, phase) {
  const group = new THREE.Group(); const frame = new THREE.Mesh(new THREE.BoxGeometry(3.1, 4.2, .26), gold); frame.position.y = 5.4; group.add(frame);
  const image = new THREE.Mesh(new THREE.PlaneGeometry(2.55, 3.65), new THREE.MeshBasicMaterial({ map: portraitTexture(tint) })); image.position.set(0, 5.4, .16); group.add(image);
  group.position.set(x, 0, z); group.userData = { phase, image }; world.add(group); return group;
}
const portraits = [makePortrait(-19.25, -14, "#8b6a4e", 0), makePortrait(19.25, -10, "#746154", 1.1), makePortrait(-19.25, 4, "#7c4f48", 2.3), makePortrait(19.25, 9, "#596d64", 3.2)];
portraits.forEach((p, i) => p.rotation.y = i % 2 ? -Math.PI / 2 : Math.PI / 2);

function wizardCube() {
  const player = new THREE.Group();
  // BoxGeometry maps these six materials to right, left, top, bottom, front, and back.
  const faceMats = [material(0x201d2b), material(0x201d2b), hair, material(0x1b1925), skin, material(0x2a1d25)];
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.45, 1.45), faceMats); body.castShadow = true; body.receiveShadow = true; player.add(body);
  const fringe = new THREE.Mesh(new THREE.BoxGeometry(1.48, .3, .18), hair); fringe.position.set(0, .45, .74); player.add(fringe);
  const glassesMat = new THREE.MeshBasicMaterial({ color: 0x15131a });
  for (const x of [-.28, .28]) { const g = new THREE.Mesh(new THREE.TorusGeometry(.19, .03, 8, 16), glassesMat); g.position.set(x, .05, .746); player.add(g); }
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(.18, .03, .03), glassesMat); bridge.position.set(0, .05, .746); player.add(bridge);
  const scar = new THREE.Mesh(new THREE.BoxGeometry(.04, .22, .028), material(0xa12f24)); scar.position.set(.1, .28, .75); scar.rotation.z = .5; player.add(scar);
  const tie = new THREE.Mesh(new THREE.BoxGeometry(.15, .5, .05), material(0x8b2429)); tie.position.set(0, -.43, .752); player.add(tie);
  const goldStripe = new THREE.Mesh(new THREE.BoxGeometry(.85, .08, .05), gold); goldStripe.position.set(0, -.23, .754); player.add(goldStripe);
  player.position.set(0, .72, 0); scene.add(player); return player;
}
const player = wizardCube();
const keys = {}; let active = false; const clock = new THREE.Clock();
function update(dt, elapsed) {
  if (!active) return;
  const forward = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
  const side = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  // The player and camera never change X/Z. The whole world moves in the opposite direction.
  if (forward || side) { const move = new THREE.Vector3(-side, 0, forward).normalize(); world.position.addScaledVector(move, 6 * dt); }
  player.rotation.z = 0;
  camera.position.set(0, 4.1, 8.7);
  camera.lookAt(0, .72, 0);
  flames.forEach(({ group, flame }, i) => { flame.scale.y = 1.1 + Math.sin(elapsed * 7 + i) * .23; group.position.y = Math.sin(elapsed * 1.5 + i) * .025; });
  portraits.forEach((p) => { p.position.y = Math.sin(elapsed * .9 + p.userData.phase) * .14; p.rotation.z = Math.sin(elapsed * .7 + p.userData.phase) * .025; });
}
function loop() { requestAnimationFrame(loop); const dt = Math.min(clock.getDelta(), .04); update(dt, clock.elapsedTime); renderer.render(scene, camera); } loop();
window.startDiningHall3D = () => { active = true; player.position.set(0, .72, 0); world.position.set(0, 0, -15); canvas.hidden = false; document.body.classList.add("three-active"); };
window.stopDiningHall3D = () => { active = false; canvas.hidden = true; Object.keys(keys).forEach((k) => delete keys[k]); };
if (document.body.classList.contains("enter-hall")) window.startDiningHall3D();
addEventListener("keydown", (event) => { keys[event.code] = true; if (active && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyW", "KeyA", "KeyS", "KeyD"].includes(event.code)) event.preventDefault(); });
addEventListener("keyup", (event) => { keys[event.code] = false; });
addEventListener("resize", () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
