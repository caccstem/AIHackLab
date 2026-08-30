const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const yearEl = document.querySelector('#year');

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const healthFill = document.getElementById('healthFill');
const stormText = document.getElementById('stormText');
const scoreText = document.getElementById('scoreText');
const enemyText = document.getElementById('enemyText');
const statusText = document.getElementById('statusText');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const inventorySlots = [...document.querySelectorAll('.inventory-slot')];
const loadoutCards = [...document.querySelectorAll('.loadout-card')];

const loadouts = {
  ranger: { label: 'Ranger', speed: 240, damage: 20, maxAmmo: 16, perk: 'Balanced assault' },
  scout: { label: 'Scout', speed: 280, damage: 17, maxAmmo: 18, perk: 'High mobility' },
  tank: { label: 'Tank', speed: 200, damage: 25, maxAmmo: 12, perk: 'Heavy armor' },
};

const inventory = {
  medkit: 2,
  shield: 1,
  ammo: 3,
  grenade: 1,
};

let activeLoadout = 'ranger';
const keys = {};
const mouse = { x: canvas.width / 2, y: canvas.height / 2, down: false };

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const createPlayer = () => {
  const loadout = loadouts[activeLoadout];
  return {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 16,
    speed: loadout.speed,
    health: 100,
    maxHealth: 100,
    fireCooldown: 0,
    angle: 0,
    ammo: loadout.maxAmmo,
    maxAmmo: loadout.maxAmmo,
    damage: loadout.damage,
    reloadTime: 0,
    score: 0,
    alive: true,
  };
};

let player = createPlayer();
let enemies = [];
let bullets = [];
let particles = [];
let gameRunning = false;
let lastTime = 0;
let spawnTimer = 0;
let storm = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 260,
  minRadius: 50,
};

function syncInventoryUi() {
  inventorySlots.forEach((slot) => {
    const key = slot.dataset.item;
    const count = inventory[key] ?? 0;
    const label = slot.querySelector('strong');
    if (label) {
      label.textContent = String(count);
    }
  });
}

function applyLoadout(name) {
  if (!loadouts[name]) return;

  activeLoadout = name;
  loadoutCards.forEach((card) => {
    card.classList.toggle('active', card.dataset.loadout === name);
  });

  statusText.textContent = `${loadouts[name].label} equipped. ${loadouts[name].perk}.`;

  if (!gameRunning) {
    player = createPlayer();
    updateHud();
    return;
  }

  player.speed = loadouts[name].speed;
  player.damage = loadouts[name].damage;
  player.maxAmmo = loadouts[name].maxAmmo;
  player.ammo = Math.min(player.ammo || player.maxAmmo, player.maxAmmo);
}

function useInventoryItem(itemName) {
  if (!gameRunning) {
    statusText.textContent = 'Drop in to use your gear.';
    return;
  }

  if ((inventory[itemName] ?? 0) <= 0) {
    statusText.textContent = `No ${itemName} left in the inventory.`;
    return;
  }

  inventory[itemName] -= 1;
  syncInventoryUi();

  if (itemName === 'medkit') {
    player.health = clamp(player.health + 25, 0, player.maxHealth);
    statusText.textContent = 'Medkit used. Health restored.';
  } else if (itemName === 'shield') {
    player.health = clamp(player.health + 18, 0, player.maxHealth);
    statusText.textContent = 'Shield boost activated.';
  } else if (itemName === 'ammo') {
    player.ammo = clamp(player.ammo + 8, 0, player.maxAmmo);
    statusText.textContent = 'Ammo restocked.';
  } else if (itemName === 'grenade') {
    createBurst(player.x, player.y, '#ff69d8', 22);
    enemies = enemies.filter((enemy) => {
      const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
      if (dist < 110) {
        player.score += 1;
        return false;
      }
      return true;
    });
    statusText.textContent = 'Grenade detonated. Area cleared.';
  }

  updateHud();
}

function resetGame() {
  player = createPlayer();
  enemies = [];
  bullets = [];
  particles = [];
  spawnTimer = 0;
  storm.radius = 260;
  updateHud();
}

function startGame() {
  resetGame();
  gameRunning = true;
  statusText.textContent = `${loadouts[activeLoadout].label} online. Survive the storm.`;
}

function endGame(win) {
  gameRunning = false;
  if (win) {
    statusText.textContent = 'Victory royale! You survived the storm.';
  } else {
    statusText.textContent = 'Eliminated. Hit restart and try again.';
  }
}

function shoot() {
  if (!gameRunning || !player.alive || player.reloadTime > 0 || player.fireCooldown > 0 || player.ammo <= 0) {
    return;
  }

  player.ammo -= 1;
  player.fireCooldown = 0.18;

  const dx = mouse.x - player.x;
  const dy = mouse.y - player.y;
  const distance = Math.hypot(dx, dy) || 1;

  bullets.push({
    x: player.x + Math.cos(player.angle) * 18,
    y: player.y + Math.sin(player.angle) * 18,
    vx: (dx / distance) * 520,
    vy: (dy / distance) * 520,
    radius: 4,
    life: 1.25,
  });

  if (player.ammo <= 0) {
    player.reloadTime = 1.2;
    player.ammo = player.maxAmmo;
    statusText.textContent = 'Reloading...';
  }

  if (player.damage > 20) {
    createBurst(player.x + Math.cos(player.angle) * 18, player.y + Math.sin(player.angle) * 18, '#f7d74d', 5);
  }
}

function spawnEnemy() {
  const side = Math.floor(Math.random() * 4);
  let x = 0;
  let y = 0;

  if (side === 0) {
    x = Math.random() * canvas.width;
    y = -30;
  } else if (side === 1) {
    x = canvas.width + 30;
    y = Math.random() * canvas.height;
  } else if (side === 2) {
    x = Math.random() * canvas.width;
    y = canvas.height + 30;
  } else {
    x = -30;
    y = Math.random() * canvas.height;
  }

  enemies.push({
    x,
    y,
    radius: 16,
    speed: 85 + Math.random() * 70,
    health: 26,
    attackCooldown: 0,
  });
}

function updateHud() {
  healthFill.style.width = `${(player.health / player.maxHealth) * 100}%`;
  stormText.textContent = `${Math.max(0, Math.round((storm.radius / 260) * 100))}%`;
  scoreText.textContent = String(player.score);
  enemyText.textContent = String(enemies.length);
}

function createBurst(x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 180,
      vy: (Math.random() - 0.5) * 180,
      life: 0.5 + Math.random() * 0.5,
      radius: 2 + Math.random() * 3,
      color,
    });
  }
}

function update(dt) {
  if (!gameRunning) {
    return;
  }

  player.fireCooldown = Math.max(0, player.fireCooldown - dt);
  player.reloadTime = Math.max(0, player.reloadTime - dt);

  if (keys.w) player.y -= player.speed * dt;
  if (keys.s) player.y += player.speed * dt;
  if (keys.a) player.x -= player.speed * dt;
  if (keys.d) player.x += player.speed * dt;

  player.x = clamp(player.x, 20, canvas.width - 20);
  player.y = clamp(player.y, 20, canvas.height - 20);

  player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

  if (mouse.down) {
    shoot();
  }

  storm.radius = Math.max(storm.minRadius, storm.radius - dt * 4.5);

  if (Math.hypot(player.x - storm.x, player.y - storm.y) > storm.radius) {
    player.health -= dt * 10;
    statusText.textContent = 'Outside the safe zone! Move inward.';
  }

  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnEnemy();
    spawnTimer = Math.max(0.7, 1.6 - player.score * 0.03);
  }

  for (let i = bullets.length - 1; i >= 0; i -= 1) {
    const bullet = bullets[i];
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;

    if (bullet.life <= 0 || bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
      bullets.splice(i, 1);
      continue;
    }

    for (let j = enemies.length - 1; j >= 0; j -= 1) {
      const enemy = enemies[j];
      const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
      if (dist < bullet.radius + enemy.radius) {
        enemy.health -= player.damage;
        bullets.splice(i, 1);
        createBurst(bullet.x, bullet.y, '#ffdf6b', 8);
        if (enemy.health <= 0) {
          enemies.splice(j, 1);
          player.score += 1;
          createBurst(enemy.x, enemy.y, '#74f7c2', 18);
        }
        break;
      }
    }
  }

  for (let i = enemies.length - 1; i >= 0; i -= 1) {
    const enemy = enemies[i];
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.hypot(dx, dy) || 1;

    enemy.x += (dx / distance) * enemy.speed * dt;
    enemy.y += (dy / distance) * enemy.speed * dt;

    if (distance < enemy.radius + player.radius + 4) {
      enemy.attackCooldown -= dt;
      if (enemy.attackCooldown <= 0) {
        player.health -= 10;
        enemy.attackCooldown = 0.75;
        createBurst(player.x, player.y, '#ff5d73', 10);
      }
    }

    if (Math.hypot(enemy.x - storm.x, enemy.y - storm.y) > storm.radius) {
      enemy.health -= dt * 12;
      if (enemy.health <= 0) {
        enemies.splice(i, 1);
        player.score += 1;
      }
    }
  }

  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const particle = particles[i];
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.life -= dt;
    if (particle.life <= 0) {
      particles.splice(i, 1);
    }
  }

  if (player.health <= 0) {
    player.health = 0;
    player.alive = false;
    endGame(false);
  }

  if (player.score >= 10) {
    endGame(true);
  }

  updateHud();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#1f8d5a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 12; i += 1) {
    const offset = i * 52;
    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset - 180, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, offset);
    ctx.lineTo(canvas.width, offset - 140);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.arc(storm.x, storm.y, storm.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(storm.x, storm.y, storm.radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#3b3327';
  for (let i = 0; i < 15; i += 1) {
    const treeX = ((i * 79) % canvas.width) + ((i % 3) * 12);
    const treeY = ((i * 143) % canvas.height) + ((i % 2) * 20);
    ctx.fillRect(treeX, treeY, 12, 22);
    ctx.beginPath();
    ctx.arc(treeX + 6, treeY - 8, 16, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const bullet of bullets) {
    ctx.fillStyle = '#f9d423';
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const enemy of enemies) {
    ctx.fillStyle = '#ff5d73';
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const particle of particles) {
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  ctx.fillStyle = '#4bc1ff';
  ctx.fillRect(0, -6, 26, 12);
  ctx.fillStyle = '#f5f7ff';
  ctx.fillRect(18, -3, 10, 6);
  ctx.restore();

  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(player.x + Math.cos(player.angle) * 28, player.y + Math.sin(player.angle) * 28);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  if (!gameRunning) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000 || 0.016, 0.033);
  lastTime = timestamp;

  update(dt);
  render();

  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
    keys[key] = true;
  }
  if (key === ' ') {
    event.preventDefault();
    shoot();
  }
});

window.addEventListener('keyup', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
    keys[key] = false;
  }
});

canvas.addEventListener('mousemove', (event) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
  mouse.y = ((event.clientY - rect.top) / rect.height) * canvas.height;
});

canvas.addEventListener('mousedown', () => {
  mouse.down = true;
  if (gameRunning) shoot();
});

window.addEventListener('mouseup', () => {
  mouse.down = false;
});

inventorySlots.forEach((slot) => {
  slot.addEventListener('click', () => {
    useInventoryItem(slot.dataset.item);
  });
});

loadoutCards.forEach((card) => {
  card.addEventListener('click', () => {
    applyLoadout(card.dataset.loadout);
  });
});

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', () => {
  startGame();
});

syncInventoryUi();
applyLoadout(activeLoadout);
resetGame();
requestAnimationFrame(gameLoop);
