const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const coinCountEl = document.getElementById('coinCount');
const livesCountEl = document.getElementById('livesCount');
const goalTextEl = document.getElementById('goalText');
const restartButton = document.getElementById('restartButton');

const keys = {};
const gravity = 0.68;
const friction = 0.82;

const player = {
  x: 410,
  y: 440,
  w: 32,
  h: 40,
  vx: 0,
  vy: 0,
  speed: 4.2,
  jumpPower: 12.5,
  onGround: false,
  facing: 1,
  invulnerable: 0,
  lives: 3,
  airJumpsLeft: 0,
  maxAirJumps: 1,
  boostTimer: 0,
  shieldTimer: 0,
  baseSpeed: 4.2,
  dashTime: 0,
  dashCooldown: 0,
};

let cameraY = 0;
let heightScore = 0;
let jumpQueued = false;
let dashQueued = false;
let platforms = [];
let enemies = [];
let powerUps = [];
let nextPlatformId = 1;

const powerUpTypes = ['boost', 'shield', 'heart', 'double'];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function makePlatform(x, y, w) {
  return { x, y, w, h: 18, id: nextPlatformId++ };
}

function maybeSpawnEnemyForPlatform(platform) {
  const nearPlayer = Math.abs(platform.y - player.y) < 650;
  const tooClose = enemies.some((enemy) => Math.abs(enemy.y - platform.y) < 70 && Math.abs(enemy.x - platform.x) < 120);

  if (!nearPlayer || tooClose || Math.random() > 0.45) return;

  const enemyY = platform.y - 34;
  enemies.push({
    x: platform.x + randomBetween(16, platform.w - 56),
    y: enemyY,
    w: 28,
    h: 28,
    vx: randomBetween(0.8, 1.8),
    vy: 0,
    dir: Math.random() > 0.5 ? 1 : -1,
    baseX: platform.x + 12,
    maxX: platform.x + platform.w - 58,
    jumpCooldown: randomBetween(10, 75),
    active: false,
  });
}

function addPlatformAt(yCursor) {
  const width = randomBetween(140, 220);
  const x = clamp(randomBetween(70, canvas.width - width - 70), 30, canvas.width - width - 30);
  const platform = makePlatform(x, yCursor, width);
  platforms.push(platform);
  maybeSpawnEnemyForPlatform(platform);

  if (Math.random() < 0.7) {
    const loot = {
      x: x + width * 0.5,
      y: yCursor - 24,
      r: 11,
      type: powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)],
      bob: Math.random() * Math.PI * 2,
    };
    powerUps.push(loot);
  }
}

function generateWorld() {
  platforms = [];
  enemies = [];
  powerUps = [];
  nextPlatformId = 1;

  const groundPlatform = makePlatform(0, canvas.height - 60, canvas.width);
  platforms.push(groundPlatform);

  let yCursor = canvas.height - 180;
  for (let i = 0; i < 16; i++) {
    addPlatformAt(yCursor);
    yCursor -= randomBetween(90, 120);
  }

  player.x = canvas.width * 0.5 - player.w * 0.5;
  player.y = groundPlatform.y - player.h;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  player.invulnerable = 0;
  player.boostTimer = 0;
  player.shieldTimer = 0;
  player.maxAirJumps = 1;
  player.airJumpsLeft = 1;
  player.dashTime = 0;
  player.dashCooldown = 0;
  cameraY = 0;
  heightScore = 0;
  updateHud();
}

function resetGame() {
  player.lives = 3;
  generateWorld();
}

function updateHud() {
  coinCountEl.textContent = `${Math.max(0, Math.floor(heightScore))} m`;
  livesCountEl.textContent = String(player.lives);
  if (player.boostTimer > 0) {
    goalTextEl.textContent = 'Boost';
  } else if (player.shieldTimer > 0) {
    goalTextEl.textContent = 'Shield';
  } else if (player.maxAirJumps > 0) {
    goalTextEl.textContent = 'Double Jump';
  } else {
    goalTextEl.textContent = 'None';
  }
}

function getPowerUpColor(type) {
  const colors = {
    boost: '#ffd166',
    shield: '#5eead4',
    heart: '#ec4899',
    double: '#a78bfa',
  };
  return colors[type] || '#ffffff';
}

function applyPowerUp(type) {
  if (type === 'boost') {
    player.boostTimer = 700;
  }
  if (type === 'shield') {
    player.shieldTimer = 700;
  }
  if (type === 'heart') {
    player.lives = Math.min(player.lives + 1, 5);
  }
  if (type === 'double') {
    player.maxAirJumps = 1;
    player.airJumpsLeft = 1;
  }
  updateHud();
}

function handleInput() {
  const moveLeft = keys['ArrowLeft'] || keys.a;
  const moveRight = keys['ArrowRight'] || keys.d;

  if (moveLeft && !moveRight) {
    player.vx = -player.speed;
    player.facing = -1;
  } else if (moveRight && !moveLeft) {
    player.vx = player.speed;
    player.facing = 1;
  } else {
    player.vx *= friction;
    if (Math.abs(player.vx) < 0.1) player.vx = 0;
  }

  if (dashQueued && player.dashCooldown <= 0) {
    const dashDirection = player.facing || 1;
    player.vx = dashDirection * 12;
    player.vy *= 0.3;
    player.dashTime = 12;
    player.dashCooldown = 70;
    dashQueued = false;
  }

  if (player.dashTime > 0) {
    player.dashTime -= 1;
    player.vx = player.facing * 12;
  }

  if (player.dashCooldown > 0) {
    player.dashCooldown -= 1;
  }

  if (jumpQueued) {
    if (player.onGround) {
      player.vy = -player.jumpPower;
      player.onGround = false;
      player.airJumpsLeft = player.maxAirJumps;
    } else if (player.airJumpsLeft > 0) {
      player.vy = -player.jumpPower * 0.92;
      player.airJumpsLeft -= 1;
    }
    jumpQueued = false;
  }
}

function updatePlayer() {
  if (player.boostTimer > 0) {
    player.boostTimer -= 1;
    player.speed = player.baseSpeed + 1.6;
  } else {
    player.speed = player.baseSpeed;
  }

  if (player.shieldTimer > 0) {
    player.shieldTimer -= 1;
  }

  if (player.maxAirJumps > 0 && player.onGround) {
    player.airJumpsLeft = player.maxAirJumps;
  }

  if (player.dashTime > 0) {
    player.vy = Math.min(player.vy, 2);
  }

  handleInput();

  player.vy += gravity;
  player.x += player.vx;
  player.y += player.vy;

  player.onGround = false;

  for (const platform of platforms) {
    const prevBottom = player.y - player.vy + player.h;
    const prevTop = player.y - player.vy;
    const prevRight = player.x - player.vx + player.w;
    const prevLeft = player.x - player.vx;

    const playerRect = { x: player.x, y: player.y, w: player.w, h: player.h };
    const platformRect = { x: platform.x, y: platform.y, w: platform.w, h: platform.h };

    if (!rectsOverlap(playerRect, platformRect)) continue;

    const wasAbove = prevBottom <= platform.y + 14;
    const wasBelow = prevTop >= platform.y + platform.h - 12;

    if (player.vy >= 0 && wasAbove) {
      player.y = platform.y - player.h;
      player.vy = 0;
      player.onGround = true;
      player.airJumpsLeft = player.maxAirJumps;
    } else if (player.vy < 0 && wasBelow) {
      player.y = platform.y + platform.h;
      player.vy = 0;
    } else if (player.vx > 0 && prevRight <= platform.x + 10) {
      player.x = platform.x - player.w;
      player.vx = 0;
    } else if (player.vx < 0 && prevLeft >= platform.x + platform.w - 10) {
      player.x = platform.x + platform.w;
      player.vx = 0;
    }
  }

  player.x = clamp(player.x, 30, canvas.width - player.w - 30);

  if (player.y > canvas.height + 180) {
    loseLife();
  }

  if (player.y < cameraY + 110) {
    cameraY = player.y - 110;
  }

  heightScore = Math.max(heightScore, Math.abs(Math.floor((player.y - 440) / 10)) * 10 * -1);

  if (player.invulnerable > 0) {
    player.invulnerable -= 1;
  }

  if (player.y < -1500) {
    cameraY = player.y - 100;
  }
}

function updatePowerUps() {
  for (let i = powerUps.length - 1; i >= 0; i--) {
    const powerUp = powerUps[i];
    powerUp.bob += 0.08;
    const playerRect = { x: player.x, y: player.y, w: player.w, h: player.h };
    const pickup = {
      x: powerUp.x - 12,
      y: powerUp.y - 12 + Math.sin(powerUp.bob) * 3,
      w: 24,
      h: 24,
    };

    if (rectsOverlap(playerRect, pickup)) {
      applyPowerUp(powerUp.type);
      powerUps.splice(i, 1);
    }
  }
}

function updateEnemies() {
  for (const enemy of enemies) {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.hypot(dx, dy);

    if (Math.abs(dy) > 360 || Math.abs(dx) > 520) {
      enemy.active = false;
      continue;
    }

    enemy.active = true;

    if (distance < 200) {
      enemy.dir = dx < 0 ? -1 : 1;
      enemy.vx = enemy.dir * 1.7;
      if (Math.abs(dx) < 50 && Math.abs(dy) < 70 && enemy.jumpCooldown <= 0) {
        enemy.vy = -8;
        enemy.jumpCooldown = 70;
      }
    } else {
      enemy.vx *= 0.9;
      if (Math.abs(enemy.vx) < 0.2) enemy.vx = 0;
    }

    enemy.x += enemy.vx;
    enemy.y += (enemy.vy || 0) + 0.55;
    enemy.vy = (enemy.vy || 0) + gravity * 0.8;
    enemy.jumpCooldown -= 1;

    if (enemy.x < enemy.baseX) {
      enemy.x = enemy.baseX;
      enemy.dir = 1;
    }
    if (enemy.x > enemy.maxX) {
      enemy.x = enemy.maxX;
      enemy.dir = -1;
    }

    const enemyRect = { x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h };
    const playerRect = { x: player.x, y: player.y, w: player.w, h: player.h };

    if (rectsOverlap(enemyRect, playerRect)) {
      const stomped = player.vy > 0 && player.y + player.h - enemy.y < 22;
      if (stomped) {
        player.vy = -9;
        enemy.x = -2000;
      } else {
        loseLife();
      }
    }
  }

  enemies = enemies.filter((enemy) => enemy.x > -3000 && enemy.active !== false);
}

function loseLife() {
  if (player.invulnerable > 0) return;

  player.lives -= 1;
  player.invulnerable = 80;
  updateHud();

  if (player.lives <= 0) {
    resetGame();
    return;
  }

  player.x = 410;
  player.y = 440;
  player.vx = 0;
  player.vy = 0;
  cameraY = 0;
}

function updateWorld() {
  while (platforms[platforms.length - 1].y > cameraY - 220) {
    addPlatformAt(platforms[platforms.length - 1].y - randomBetween(80, 120));
  }

  while (platforms[0].y < cameraY - 200) {
    platforms.shift();
  }

  while (powerUps.length > 20) {
    powerUps.shift();
  }
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, '#75d7ff');
  sky.addColorStop(0.45, '#dff8ff');
  sky.addColorStop(1, '#c7ffca');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(255, 244, 168, 0.9)';
  ctx.beginPath();
  ctx.arc(840, 110, 52, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 45; i++) {
    const x = ((i * 137) + (cameraY * 0.2)) % (canvas.width + 90) - 30;
    const y = (i * 67) % 180 + 28;
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.fillRect(x, y, 2, 2);
  }
}

function drawPlatform(platform) {
  const y = platform.y - cameraY;
  ctx.fillStyle = '#3d7d52';
  ctx.fillRect(platform.x, y, platform.w, platform.h);
  ctx.fillStyle = '#7bd389';
  ctx.fillRect(platform.x, y, platform.w, 6);
}

function drawPowerUps() {
  for (const power of powerUps) {
    const y = power.y - cameraY + Math.sin(power.bob) * 4;
    ctx.fillStyle = getPowerUpColor(power.type);
    ctx.beginPath();
    ctx.arc(power.x, y, power.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0b172a';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(power.type[0].toUpperCase(), power.x, y + 4);
  }
}

function drawEnemies() {
  for (const enemy of enemies) {
    if (Math.abs(enemy.y - player.y) > 360 || Math.abs(enemy.x - player.x) > 520) continue;

    const y = enemy.y - cameraY;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(enemy.x, y, enemy.w, enemy.h);
    ctx.fillStyle = '#fff';
    ctx.fillRect(enemy.x + 6, y + 8, 6, 6);
    ctx.fillRect(enemy.x + enemy.w - 12, y + 8, 6, 6);
  }
}

function drawPlayer() {
  const x = player.x;
  const y = player.y - cameraY;
  const blink = player.invulnerable > 0 && Math.floor(player.invulnerable / 8) % 2 === 0;
  if (blink) return;

  ctx.fillStyle = player.shieldTimer > 0 ? '#67e8f9' : '#1d3557';
  ctx.fillRect(x, y, player.w, player.h);

  ctx.fillStyle = '#f1faee';
  ctx.fillRect(x + 8, y + 8, 7, 7);
  ctx.fillRect(x + player.w - 15, y + 8, 7, 7);

  ctx.fillStyle = '#ffb703';
  ctx.fillRect(x + 6, y + 18, player.w - 12, 10);

  ctx.fillStyle = '#e63946';
  ctx.fillRect(x + 5, y + 28, player.w - 10, 10);

  if (player.shieldTimer > 0) {
    ctx.strokeStyle = '#67e8f9';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x + player.w / 2, y + player.h / 2, 24, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawHUDText() {
  ctx.fillStyle = 'rgba(11, 23, 42, 0.52)';
  ctx.fillRect(18, 18, 256, 42);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`Climb: ${Math.max(0, Math.floor(heightScore))}m`, 34, 46);
}

function draw() {
  drawBackground();
  for (const platform of platforms) drawPlatform(platform);
  drawPowerUps();
  drawEnemies();
  drawPlayer();
  drawHUDText();
}

function update() {
  updatePlayer();
  updatePowerUps();
  updateEnemies();
  updateWorld();
  updateHud();
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys[key] = true;
  if (key === ' ' || event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
  }
  if (event.key === ' ' || event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W') {
    jumpQueued = true;
  }
  if (event.key === 'Shift' || event.key === 'shift') {
    dashQueued = true;
  }
});

window.addEventListener('keyup', (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys[key] = false;
});

restartButton.addEventListener('click', () => {
  resetGame();
});

resetGame();
requestAnimationFrame(gameLoop);
