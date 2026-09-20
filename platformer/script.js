const canvas = document.querySelector('#game-canvas');
const context = canvas.getContext('2d');
const startOverlay = document.querySelector('#start-overlay');
const resultOverlay = document.querySelector('#result-overlay');
const startButton = document.querySelector('#start-button');
const restartButton = document.querySelector('#restart-button');
const instructionsButton = document.querySelector('#instructions-button');
const instructionsPanel = document.querySelector('#instructions-panel');
const instructionsClose = document.querySelector('#instructions-close');
const onlineVaultButton = document.querySelector('#online-vault-button');
const onlineVaultPanel = document.querySelector('#online-vault-panel');
const onlineVaultClose = document.querySelector('#online-vault-close');
const vaultCode = document.querySelector('#vault-code');
const joinButton = document.querySelector('#join-button');
const vaultMessage = document.querySelector('#vault-message');
const freezeButton = document.querySelector('#freeze-button');
const freezeUsesDisplay = document.querySelector('#freeze-uses');
const resultKicker = document.querySelector('#result-kicker');
const resultTitle = document.querySelector('#result-title');
const resultCopy = document.querySelector('#result-copy');
const scoreDisplay = document.querySelector('#score');
const altitudeDisplay = document.querySelector('#altitude');
const shardsDisplay = document.querySelector('#shards');
const shardCounter = document.querySelector('#shard-counter');
const levelDisplay = document.querySelector('#level');
const bestDisplay = document.querySelector('#best');

const view = { width: 960, height: 560 };
const keys = {};
const world = { width: 2500, height: 1800 };
const player = { x: 100, y: 1340, width: 28, height: 38, vx: 0, vy: 0, grounded: false };
const camera = { x: 0, y: 0 };
const basePlatforms = [
  { x: 0, y: 1380, width: 420, height: 40 }, { x: 510, y: 1240, width: 250, height: 28 },
  { x: 850, y: 1110, width: 300, height: 28 }, { x: 1250, y: 990, width: 230, height: 28 },
  { x: 1580, y: 850, width: 300, height: 28 }, { x: 1960, y: 700, width: 260, height: 28 },
  { x: 2200, y: 530, width: 260, height: 28 }, { x: 1810, y: 420, width: 250, height: 28 },
  { x: 1420, y: 300, width: 250, height: 28 }, { x: 1010, y: 190, width: 260, height: 28 },
  { x: 610, y: 90, width: 250, height: 28 }, { x: 210, y: 0, width: 250, height: 28 }
];
const baseObstacles = [
  { x: 245, y: 1348, width: 28, height: 32, type: 'rock' },
  { x: 335, y: 1348, width: 28, height: 32, type: 'spikes' },
  { x: 650, y: 1208, width: 28, height: 32, type: 'spikes' },
  { x: 1030, y: 1078, width: 28, height: 32, type: 'rock' },
  { x: 1390, y: 958, width: 28, height: 32, type: 'spikes' },
  { x: 1735, y: 818, width: 28, height: 32, type: 'rock' },
  { x: 2110, y: 668, width: 28, height: 32, type: 'spikes' }
];
const baseMonsters = [
  { x: 145, y: 1348, width: 30, height: 32, left: 80, right: 380, speed: 1.2, direction: 1 },
  { x: 930, y: 1078, width: 30, height: 32, left: 870, right: 1115, speed: 1.1, direction: -1 },
  { x: 2020, y: 668, width: 30, height: 32, left: 1980, right: 2185, speed: .8, direction: -1 }
];
const baseCheckpoints = [
  { x: 100, groundY: 1380, reached: true }, { x: 860, groundY: 1110, reached: false },
  { x: 1590, groundY: 850, reached: false }, { x: 2210, groundY: 530, reached: false }
];
const levelShardSets = [
  [[590, 1190], [960, 1060], [1330, 940], [1690, 800], [2060, 650], [2290, 480], [1500, 250]],
  [[300, 1340], [700, 1190], [1100, 1060], [1370, 940], [1770, 800], [2130, 650], [2330, 480]],
  [[590, 1190], [1010, 1060], [1430, 940], [1740, 800], [2010, 650], [2320, 480], [1110, 160]],
  [[280, 1340], [620, 1190], [930, 1060], [1310, 940], [1640, 800], [2050, 650], [1470, 250]],
  [[580, 1190], [980, 1060], [1290, 940], [1700, 800], [2080, 650], [2310, 480], [730, 40]]
];
const levelThemes = [
  { skyTop: '#66c9f2', skyBottom: '#e7f6d5', hill: '#8ed39a', leaf: '#2f824b', leafLight: '#73c965', grass: '#4f9a50', shard: '#ff896d' },
  { skyTop: '#54aeda', skyBottom: '#f6d9a0', hill: '#a7b86d', leaf: '#9d5d38', leafLight: '#e38a4d', grass: '#668e43', shard: '#ffe36e' },
  { skyTop: '#3d5eaf', skyBottom: '#d6b9e8', hill: '#7182b5', leaf: '#315b76', leafLight: '#5f9fc0', grass: '#3f7954', shard: '#b8f4ff' },
  { skyTop: '#4aaec4', skyBottom: '#f5e4a5', hill: '#b8c76c', leaf: '#4d7b39', leafLight: '#9dc84e', grass: '#598d3f', shard: '#ff9f4d' },
  { skyTop: '#72cbe4', skyBottom: '#f7c4c8', hill: '#a1c997', leaf: '#4c7655', leafLight: '#8ebf6b', grass: '#4b985c', shard: '#e88cff' }
];
const levelPlacementProfiles = [
  { platformX: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], platformY: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], obstacleX: [0, 0, 0, 0, 0, 0, 0], monsterX: [0, 0, 0], checkpointX: [0, 0, 0, 0] },
  { platformX: [0, 28, -32, 42, -24, 36, -28, 30, -36, 42, -24, 28], platformY: [0, 14, -12, 20, -14, 18, -12, 12, -10, 14, -8, 0], obstacleX: [24, -24, 30, -32, 22, -24, 28], monsterX: [30, -28, 24], checkpointX: [0, 24, -20, -28] },
  { platformX: [0, -34, 46, -40, 38, -44, 34, -32, 48, -38, 28, -24], platformY: [0, 24, 18, -16, 20, -13, 18, -15, 13, -10, 10, 0], obstacleX: [-20, 30, -36, 32, -24, 30, -34], monsterX: [-24, 36, -30], checkpointX: [0, -30, 30, 24] },
  { platformX: [0, 70, -80, 55, -75, 80, -60, 250, -85, 55, -65, 45], platformY: [0, 35, -35, 45, -35, 40, -30, 35, -25, 30, -15, 0], obstacleX: [50, -55, 60, -65, 45, -50, 55], monsterX: [60, -55, 50], checkpointX: [0, 55, -50, -45] },
  { platformX: [0, -80, 90, -75, 85, -90, 70, -80, 95, -70, 60, -50], platformY: [0, -35, 45, -40, 50, -35, 45, -35, 35, -25, 25, 0], obstacleX: [-45, 60, -70, 65, -50, 55, -65], monsterX: [-50, 70, -60], checkpointX: [0, -60, 60, 50] }
];
let shards = [];
let platforms = [];
let obstacles = [];
let monsters = [];
let checkpoints = [];
let score = 0;
let running = false;
let lastTime = 0;
let activeCheckpoint = 0;
let levelIndex = 0;
let freezeUses = 2;
let freezeTimer = 0;
let onlineMode = false;
let multiplayerSocket = null;
let localOnlinePlayer = null;
let onlinePlayers = [];
let audioContext = null;
let musicTimer = null;
let footstepTimer = 0;

function startAudio() {
  if (!audioContext) audioContext = new AudioContext();
  if (audioContext.state === 'suspended') audioContext.resume();
  if (musicTimer === null) {
    const notes = [196, 247, 294, 247, 220, 277, 330, 277];
    let noteIndex = 0;
    musicTimer = window.setInterval(() => {
      playTone(notes[noteIndex++ % notes.length], .035, 1.1, 'sine');
    }, 720);
  }
}

function playTone(frequency, volume, duration, type = 'square') {
  if (!audioContext) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

function playJumpSound() {
  playTone(330, .08, .1, 'triangle');
  window.setTimeout(() => playTone(494, .07, .12, 'triangle'), 45);
  window.setTimeout(() => playTone(659, .06, .18, 'sine'), 90);
}
function playMoveSound() { playTone(120, .045, .06, 'triangle'); }
function playDeathSound() { playTone(180, .14, .18, 'sawtooth'); playTone(90, .1, .3, 'sawtooth'); }
function playClickSound() { playTone(420, .08, .06, 'square'); }
function playJewelSound() {
  playTone(880, .09, .1, 'sine');
  window.setTimeout(() => playTone(1320, .07, .16, 'sine'), 55);
}
function playCheckpointSound() {
  playTone(392, .1, .12, 'triangle');
  window.setTimeout(() => playTone(587, .08, .2, 'triangle'), 70);
}
let best = Number(localStorage.getItem('skybound-best') || 0);
bestDisplay.textContent = String(best).padStart(4, '0');

function loadLevel(index) {
  levelIndex = index;
  const profile = levelPlacementProfiles[index];
  shards = levelShardSets[index].map(([x, y]) => ({ x, y, collected: false }));
  platforms = basePlatforms.map((platform, platformIndex) => ({
    ...platform,
    x: platform.x + profile.platformX[platformIndex],
    y: platform.y + profile.platformY[platformIndex]
  }));
  const hazardPlatforms = [0, 0, 1, 2, 3, 4, 5];
  obstacles = baseObstacles.map((obstacle, obstacleIndex) => ({
    ...obstacle,
    x: obstacle.x + profile.obstacleX[obstacleIndex],
    y: obstacle.y + profile.platformY[hazardPlatforms[obstacleIndex]]
  }));
  const monsterPlatforms = [0, 2, 5];
  monsters = baseMonsters.map((monster, monsterIndex) => ({
    ...monster,
    x: monster.x + profile.monsterX[monsterIndex],
    y: monster.y + profile.platformY[monsterPlatforms[monsterIndex]],
    left: monster.left + profile.platformX[monsterPlatforms[monsterIndex]],
    right: monster.right + profile.platformX[monsterPlatforms[monsterIndex]],
    direction: monster.direction
  }));
  checkpoints = baseCheckpoints.map((checkpoint, checkpointIndex) => ({
    ...checkpoint,
    x: checkpoint.x + profile.checkpointX[checkpointIndex],
    groundY: checkpoint.groundY + profile.platformY[[0, 2, 4, 6][checkpointIndex]],
    reached: checkpointIndex === 0
  }));
  activeCheckpoint = 0;
  freezeUses = 2;
  freezeTimer = 0;
  player.x = 100;
  player.y = checkpoints[0].groundY - player.height;
  player.vx = 0;
  player.vy = 0;
  camera.x = 0;
  camera.y = 900;
  levelDisplay.textContent = `${levelIndex + 1}/5`;
  updateFreezeButton();
}

function updateFreezeButton() {
  freezeUsesDisplay.textContent = `${freezeUses} LEFT`;
  freezeButton.disabled = freezeUses === 0 || freezeTimer > 0 || !running;
}

function freezeMonsters() {
  if (!running || freezeUses === 0 || freezeTimer > 0) return;
  freezeUses -= 1;
  freezeTimer = 4;
  updateFreezeButton();
}

function resetGame() {
  score = 0;
  loadLevel(0);
  monsters.forEach((monster) => { monster.direction = Math.abs(monster.direction); });
  updateHud();
}

function startGame() {
  startAudio(); resetGame(); running = true; updateFreezeButton(); startOverlay.hidden = true; resultOverlay.hidden = true; lastTime = performance.now(); requestAnimationFrame(loop);
}

function sendOnlineState() {
  if (!onlineMode || !multiplayerSocket || multiplayerSocket.readyState !== WebSocket.OPEN || !localOnlinePlayer) return;
  multiplayerSocket.send(JSON.stringify({ type: 'state', x: player.x, y: player.y, level: levelIndex + 1 }));
}

function connectToOnlineVault(code) {
  if (multiplayerSocket) multiplayerSocket.close();
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  multiplayerSocket = new WebSocket(`${protocol}://${location.hostname}:8080`);
  multiplayerSocket.addEventListener('open', () => multiplayerSocket.send(JSON.stringify({ type: 'join', code })));
  multiplayerSocket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'join-error') {
      vaultMessage.textContent = message.message;
      return;
    }
    if (message.type === 'joined') {
      onlineMode = true;
      localOnlinePlayer = message.player;
      onlinePlayers = message.players;
      vaultMessage.textContent = `JOINED AS ${localOnlinePlayer.name}!`;
      startGame();
      return;
    }
    if (message.type === 'players') onlinePlayers = message.players;
    if (message.type === 'winner' && message.winner.id !== localOnlinePlayer?.id) {
      resultKicker.textContent = 'ONLINE RACE';
      resultTitle.textContent = `${message.winner.name} WINS!`;
      resultCopy.textContent = 'They reached the highest point first.';
      resultOverlay.hidden = false;
    }
  });
  multiplayerSocket.addEventListener('error', () => { vaultMessage.textContent = 'Online vault is offline right now.'; });
}

function finishGame(won) {
  running = false;
  updateFreezeButton();
  if (won && onlineMode && multiplayerSocket?.readyState === WebSocket.OPEN) multiplayerSocket.send(JSON.stringify({ type: 'finish' }));
  resultKicker.textContent = won ? 'RUN COMPLETE' : 'SIGNAL LOST';
  resultTitle.textContent = won ? 'YOU WIN!!' : 'Keep climbing.';
  resultCopy.textContent = won ? 'All five levels conquered.' : 'The cloudline is still waiting. Try a different route.';
  resultOverlay.hidden = false;
  if (score > best) { best = score; localStorage.setItem('skybound-best', String(best)); bestDisplay.textContent = String(best).padStart(4, '0'); }
}

function advanceLevel() {
  if (levelIndex === 4) { finishGame(true); return; }
  loadLevel(levelIndex + 1);
  updateHud();
}

function respawnAtCheckpoint() {
  playDeathSound();
  const checkpoint = checkpoints[activeCheckpoint];
  player.x = checkpoint.x;
  player.y = checkpoint.groundY - player.height;
  player.vx = 0;
  player.vy = 0;
  score = Math.max(0, score - 50);
}

function updateHud() {
  scoreDisplay.textContent = String(score).padStart(4, '0');
  altitudeDisplay.textContent = String(Math.max(0, Math.round((world.height - player.y) / 10))).padStart(3, '0');
  const collectedShards = shards.filter((shard) => shard.collected).length;
  shardsDisplay.textContent = `${collectedShards}/7`;
  shardCounter.textContent = `${collectedShards}/7`;
  levelDisplay.textContent = `${levelIndex + 1}/5`;
}

function update(delta) {
  if (freezeTimer > 0) {
    freezeTimer = Math.max(0, freezeTimer - delta / 60);
    updateFreezeButton();
  }
  const moveLeft = keys.ArrowLeft || keys.KeyA;
  const moveRight = keys.ArrowRight || keys.KeyD;
  const wasGrounded = player.grounded;
  const isMoving = moveLeft || moveRight;
  player.vx = moveLeft ? -4.8 : moveRight ? 4.8 : player.vx * 0.82;
  player.vy += 0.52 * delta;
  if ((keys.Space || keys.ArrowUp || keys.KeyW) && player.grounded) { playJumpSound(); player.vy = -12.5; player.grounded = false; }
  if (isMoving && wasGrounded) {
    footstepTimer -= delta;
    if (footstepTimer <= 0) { playMoveSound(); footstepTimer = 18; }
  } else if (!isMoving) footstepTimer = 0;
  const previousBottom = player.y + player.height;
  player.x += player.vx * delta;
  player.x = Math.max(0, Math.min(world.width - player.width, player.x));
  player.y += player.vy * delta;
  player.grounded = false;

  if (freezeTimer === 0) {
    monsters.forEach((monster) => {
      monster.x += monster.speed * monster.direction * delta;
      if (monster.x <= monster.left || monster.x + monster.width >= monster.right) monster.direction *= -1;
    });
  }

  platforms.forEach((platform) => {
    const overlapsX = player.x + player.width > platform.x && player.x < platform.x + platform.width;
    const crossesTop = previousBottom <= platform.y && player.y + player.height >= platform.y;
    if (overlapsX && crossesTop && player.vy >= 0) { player.y = platform.y - player.height; player.vy = 0; player.grounded = true; }
  });
  shards.forEach((shard) => {
    if (!shard.collected && player.x < shard.x + 22 && player.x + player.width > shard.x - 22 && player.y < shard.y + 22 && player.y + player.height > shard.y - 22) { shard.collected = true; score += 125; playJewelSound(); }
  });
  if (shards.every((shard) => shard.collected)) { advanceLevel(); sendOnlineState(); return; }
  checkpoints.forEach((checkpoint, index) => {
    if (!checkpoint.reached && player.x > checkpoint.x && Math.abs((player.y + player.height) - checkpoint.groundY) < 100) {
      checkpoint.reached = true;
      activeCheckpoint = index;
      playCheckpointSound();
    }
  });
  const hitObstacle = obstacles.some((obstacle) => player.x < obstacle.x + obstacle.width && player.x + player.width > obstacle.x && player.y < obstacle.y + obstacle.height && player.y + player.height > obstacle.y);
  const hitMonster = monsters.some((monster) => player.x < monster.x + monster.width && player.x + player.width > monster.x && player.y < monster.y + monster.height && player.y + player.height > monster.y);
  if (hitObstacle || hitMonster) { respawnAtCheckpoint(); return; }
  if (player.y > world.height + 100) { respawnAtCheckpoint(); return; }
  if (player.x > 275 && player.y < 60) finishGame(true);
  sendOnlineState();
  camera.x += ((player.x - view.width * .38) - camera.x) * .08;
  camera.y += ((player.y - view.height * .52) - camera.y) * .08;
  camera.x = Math.max(0, Math.min(world.width - view.width, camera.x));
  camera.y = Math.max(0, Math.min(world.height - view.height, camera.y));
  updateHud();
}

function drawBackground() {
  const theme = levelThemes[levelIndex];
  const gradient = context.createLinearGradient(0, 0, 0, view.height);
  gradient.addColorStop(0, theme.skyTop); gradient.addColorStop(.68, '#b7e8f7'); gradient.addColorStop(1, theme.skyBottom);
  context.fillStyle = gradient; context.fillRect(0, 0, view.width, view.height);
  context.fillStyle = theme.hill;
  context.beginPath(); context.moveTo(0, 405); context.lineTo(150, 325); context.lineTo(310, 405); context.lineTo(500, 295); context.lineTo(710, 405); context.lineTo(860, 320); context.lineTo(960, 380); context.lineTo(960, 560); context.lineTo(0, 560); context.fill();
  const treeY = 455 - camera.y * 0.08;
  for (let index = -1; index < 12; index += 1) {
    const treeX = index * 105 - (camera.x * 0.22 % 105);
    context.fillStyle = '#765139';
    context.fillRect(treeX + 27, treeY, 12, 76);
    context.fillStyle = theme.leaf;
    context.fillRect(treeX + 5, treeY - 34, 56, 43);
    context.fillStyle = theme.leafLight;
    context.fillRect(treeX + 17, treeY - 52, 32, 30);
    context.fillStyle = '#73c965';
    context.fillRect(treeX + 25, treeY - 58, 14, 13);
  }
}

function draw() {
  const theme = levelThemes[levelIndex];
  const isFrozen = freezeTimer > 0;
  context.clearRect(0, 0, view.width, view.height); drawBackground(); context.save(); context.translate(-camera.x, -camera.y);
  platforms.forEach((platform) => {
    context.fillStyle = isFrozen ? '#ffffff' : theme.grass;
    context.fillRect(platform.x, platform.y, platform.width, platform.height);
    context.fillStyle = isFrozen ? '#dff8ff' : '#b6dc72';
    context.fillRect(platform.x, platform.y, platform.width, 7);
    context.fillStyle = isFrozen ? '#b9e8f4' : '#275737';
    context.fillRect(platform.x, platform.y + platform.height - 7, platform.width, 7);
    if (isFrozen) {
      context.fillStyle = '#b9e8f4';
      for (let icicleX = platform.x + 12; icicleX < platform.x + platform.width - 4; icicleX += 28) {
        const icicleHeight = 8 + ((Math.floor(icicleX) * 7) % 12);
        context.beginPath();
        context.moveTo(icicleX, platform.y + platform.height);
        context.lineTo(icicleX + 7, platform.y + platform.height);
        context.lineTo(icicleX + 3.5, platform.y + platform.height + icicleHeight);
        context.closePath();
        context.fill();
      }
    }
  });
  checkpoints.forEach((checkpoint) => {
    context.fillStyle = '#704735'; context.fillRect(checkpoint.x, checkpoint.groundY - 48, 6, 48);
    context.fillStyle = checkpoint.reached ? '#ffe36e' : '#f28c73';
    context.fillRect(checkpoint.x + 6, checkpoint.groundY - 46, 25, 16);
    context.fillStyle = '#fff3ad'; context.fillRect(checkpoint.x + 11, checkpoint.groundY - 42, 9, 8);
  });
  monsters.forEach((monster) => {
    context.fillStyle = isFrozen ? '#9bddec' : '#6c3d8f'; context.fillRect(monster.x + 4, monster.y + 8, 22, 24);
    context.fillStyle = isFrozen ? '#d7f8ff' : '#9d62bd'; context.fillRect(monster.x, monster.y + 13, 30, 15);
    context.fillStyle = isFrozen ? '#ffffff' : '#f6e37a'; context.fillRect(monster.x + 7, monster.y + 16, 4, 5); context.fillRect(monster.x + 19, monster.y + 16, 4, 5);
    context.fillStyle = isFrozen ? '#9bddec' : '#6c3d8f'; context.fillRect(monster.x + 5, monster.y + 3, 7, 10); context.fillRect(monster.x + 18, monster.y + 3, 7, 10);
  });
  onlinePlayers.forEach((remotePlayer) => {
    if (remotePlayer.id === localOnlinePlayer?.id) return;
    context.fillStyle = remotePlayer.color;
    context.fillRect(remotePlayer.x + 4, remotePlayer.y + 8, 22, 24);
    context.fillRect(remotePlayer.x, remotePlayer.y + 13, 30, 15);
    context.fillStyle = '#fff0a8';
    context.fillRect(remotePlayer.x + 7, remotePlayer.y + 16, 4, 5);
    context.fillRect(remotePlayer.x + 19, remotePlayer.y + 16, 4, 5);
    context.fillStyle = '#17262b';
    context.font = '500 11px DM Mono';
    context.fillText(remotePlayer.name, remotePlayer.x - 3, remotePlayer.y - 8);
  });
  obstacles.forEach((obstacle) => {
    context.fillStyle = obstacle.type === 'rock' ? '#6d7460' : '#f0d66c';
    if (obstacle.type === 'rock') {
      context.fillRect(obstacle.x + 5, obstacle.y + 8, 20, 24);
      context.fillRect(obstacle.x, obstacle.y + 16, 28, 16);
      context.fillStyle = '#aeb493';
      context.fillRect(obstacle.x + 7, obstacle.y + 8, 8, 7);
    } else {
      context.beginPath(); context.moveTo(obstacle.x, obstacle.y + obstacle.height); context.lineTo(obstacle.x + 9, obstacle.y); context.lineTo(obstacle.x + 18, obstacle.y + obstacle.height); context.lineTo(obstacle.x + 28, obstacle.y); context.lineTo(obstacle.x + 28, obstacle.y + obstacle.height); context.closePath(); context.fill();
    }
  });
  shards.forEach((shard) => { if (shard.collected) return; context.save(); context.translate(shard.x, shard.y); context.rotate(Math.PI / 4); context.fillStyle = theme.shard; context.shadowColor = theme.shard; context.shadowBlur = 18; context.fillRect(-10, -10, 20, 20); context.restore(); });
  context.fillStyle = '#d7ff5d'; context.fillRect(300, -40, 5, 68); context.fillStyle = '#eaf1eb'; context.font = '500 13px DM Mono'; context.fillText('UPPER AIR', 318, 0);
  context.fillStyle = '#c76536'; context.fillRect(player.x + 4, player.y + 8, 22, 24);
  context.fillStyle = '#f3a15d'; context.fillRect(player.x + 1, player.y + 13, 28, 15);
  context.fillStyle = '#c76536'; context.fillRect(player.x + 5, player.y + 3, 7, 10); context.fillRect(player.x + 18, player.y + 3, 7, 10);
  context.fillStyle = '#fff0a8'; context.fillRect(player.x + 8, player.y + 16, 4, 5); context.fillRect(player.x + 20, player.y + 16, 4, 5);
  context.fillStyle = '#a9472d'; context.fillRect(player.x + 8, player.y + 28, 6, 4); context.fillRect(player.x + 18, player.y + 28, 6, 4); context.restore();
}

function loop(timestamp) { if (!running) return; const delta = Math.min((timestamp - lastTime) / 16.67, 2); lastTime = timestamp; update(delta); draw(); requestAnimationFrame(loop); }

addEventListener('keydown', (event) => { keys[event.code] = true; if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space', 'KeyA', 'KeyD', 'KeyW'].includes(event.code)) event.preventDefault(); if (event.code === 'KeyR') startGame(); });
addEventListener('keyup', (event) => { keys[event.code] = false; });
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
freezeButton.addEventListener('click', freezeMonsters);
instructionsButton.addEventListener('click', () => { instructionsPanel.hidden = false; });
instructionsClose.addEventListener('click', () => { instructionsPanel.hidden = true; });
onlineVaultButton.addEventListener('click', () => { onlineVaultPanel.hidden = false; vaultCode.focus(); });
onlineVaultClose.addEventListener('click', () => { onlineVaultPanel.hidden = true; });
joinButton.addEventListener('click', () => {
  const code = vaultCode.value.trim();
  if (code !== '6147') {
    vaultMessage.textContent = 'That code is not available.';
    vaultMessage.classList.remove('vault-success');
    return;
  }
  vaultMessage.textContent = 'CONNECTING...';
  vaultMessage.classList.remove('vault-success');
  connectToOnlineVault(code);
});
[
  startButton, restartButton, instructionsButton, instructionsClose,
  onlineVaultButton, onlineVaultClose, joinButton, freezeButton
].forEach((button) => button.addEventListener('click', () => { startAudio(); playClickSound(); }));
resetGame(); draw();
