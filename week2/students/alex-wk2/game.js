(() => {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const wrap = document.getElementById('canvasWrap');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const paceEl = document.getElementById('pace');
  const startCard = document.getElementById('startCard');
  const pauseCard = document.getElementById('pauseCard');
  const titleEl = document.getElementById('cardTitle');
  const kickerEl = document.getElementById('cardKicker');
  const textEl = document.getElementById('cardText');
  const buttonText = document.getElementById('buttonText');
  const pauseButton = document.getElementById('pauseButton');
  const soundButton = document.getElementById('soundButton');
  const duckButton = document.getElementById('duckButton');
  const zoneStatus = document.getElementById('zoneStatus');

  let width = 0, height = 0, dpr = 1, groundY = 0;
  let state = 'ready';
  let lastTime = 0, distance = 0, bonus = 0, speed = 380, spawnTimer = 0;
  let obstacles = [], particles = [], popups = [], clouds = [], hills = [], warning = 0, canyonAnnounced = false;
  let muted = false, audioCtx = null, shake = 0;
  let best = Number(localStorage.getItem('sidequest-best') || 0);

  const player = { x: 0, y: 0, w: 42, h: 58, vy: 0, grounded: true, hold: false, ducking: false, runFrame: 0 };
  const palette = { ink: '#20211d', red: '#e84a32', paper: '#f5ecda', beige: '#ded1ba', light: '#ebe0cd' };

  function resize() {
    const rect = wrap.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width; height = rect.height;
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    groundY = height * .78;
    player.x = Math.max(64, width * .16);
    if (state !== 'running') player.y = groundY - player.h;
    makeScenery();
  }

  function makeScenery() {
    clouds = Array.from({ length: 5 }, (_, i) => ({ x: (i * width / 4) + Math.random() * 120, y: 65 + Math.random() * 130, s: .6 + Math.random() * .7 }));
    hills = Array.from({ length: 7 }, (_, i) => ({ x: i * width / 5, w: 260 + Math.random() * 220, h: 50 + Math.random() * 90 }));
  }

  function reset() {
    distance = 0; bonus = 0; speed = 380; obstacles = []; particles = []; popups = []; spawnTimer = 1.35; canyonAnnounced = false;
    player.y = groundY - player.h; player.vy = 0; player.grounded = true; player.hold = false; player.ducking = false; warning = 0;
    scoreEl.textContent = '00000'; paceEl.textContent = '1.0×';
    zoneStatus.innerHTML = '<i></i> OPEN ROAD';
    state = 'running'; startCard.classList.add('hide'); pauseCard.hidden = true; lastTime = performance.now();
    beep(230, .07, 'square', .035);
    requestAnimationFrame(loop);
  }

  function jump() {
    if (state === 'ready' || state === 'gameover') return reset();
    if (state === 'paused') return resume();
    if (player.grounded) {
      player.vy = -720; player.grounded = false; player.hold = true;
      burst(player.x + player.w / 2, groundY, 6, palette.ink);
      beep(460, .06, 'square', .025);
    }
  }

  function releaseJump() {
    player.hold = false;
    if (player.vy < -270) player.vy *= .55;
  }

  function setDuck(active) {
    if (state !== 'running') return;
    player.ducking = active && player.grounded;
  }

  function spawnObstacle() {
    const difficulty = Math.min(distance / 1000, 1);
    const roll = Math.random();
    let w, h, kind;
    const enemiesUnlocked = distance >= 400;
    const canyonUnlocked = distance >= 800;
    if (canyonUnlocked && roll < .14) { w = 76 + Math.random() * 38; h = 20; kind = 'hole'; }
    else if (canyonUnlocked && roll < .29) { w = 66; h = 31; kind = 'hangingRock'; }
    else if (enemiesUnlocked && roll < .42) { w = 44; h = 42; kind = 'runner'; }
    else if (enemiesUnlocked && roll < .55) { w = 58; h = 25; kind = 'drone'; }
    else if (roll < .2 + difficulty * .12) { w = 26; h = 76 + Math.random() * 22; kind = 'post'; }
    else if (roll < .38 && distance > 250) { w = 78; h = 31; kind = 'double'; }
    else { w = 34 + Math.random() * 23; h = 40 + Math.random() * 25; kind = 'crate'; }
    const y = kind === 'hole' ? groundY : (kind === 'drone' || kind === 'hangingRock') ? groundY - 62 : groundY - h;
    obstacles.push({ x: width + 40, y, w, h, kind, passed: false, phase: Math.random() * 6 });
    const minGap = Math.max(0.72, 1.28 - difficulty * .48);
    spawnTimer = minGap + Math.random() * Math.max(.25, .72 - difficulty * .25);
  }

  function burst(x, y, count, color) {
    for (let i = 0; i < count; i++) particles.push({ x, y, vx: -30 - Math.random() * 130, vy: -20 - Math.random() * 100, life: .45 + Math.random() * .3, size: 2 + Math.random() * 4, color });
  }

  function update(dt) {
    const previousBottom = player.y + player.h;
    distance += speed * dt * .025;
    if (distance >= 390 && distance < 400) warning = Math.max(warning, 1.4);
    if (distance >= 800 && !canyonAnnounced) {
      canyonAnnounced = true; warning = 2.2; zoneStatus.innerHTML = '<i></i> CINDER CANYON';
      beep(175, .18, 'sawtooth', .035);
    }
    speed = Math.min(770, 380 + distance * .17);
    const pace = speed / 380;
    scoreEl.textContent = (Math.floor(distance) + bonus).toString().padStart(5, '0');
    paceEl.textContent = pace.toFixed(1) + '×';

    if (!player.grounded) player.ducking = false;
    player.vy += (player.hold && player.vy < 0 ? 1550 : 2100) * dt;
    player.y += player.vy * dt;
    if (player.y >= groundY - player.h) {
      if (!player.grounded && player.vy > 200) burst(player.x + player.w / 2, groundY, 4, palette.ink);
      player.y = groundY - player.h; player.vy = 0; player.grounded = true;
    }
    player.runFrame += dt * speed * .045;

    spawnTimer -= dt;
    if (spawnTimer <= 0) spawnObstacle();
    for (const o of obstacles) {
      if (o.destroyed) continue;
      o.x -= speed * dt;
      o.phase += dt * 8;
      if (!o.passed && o.x + o.w < player.x) { o.passed = true; beep(680, .025, 'square', .012); }
      const padX = 8;
      const horizontalOverlap = player.x + padX < o.x + o.w && player.x + player.w - padX > o.x;
      if (o.kind === 'hole') {
        if (horizontalOverlap && player.grounded) gameOver();
        continue;
      }
      const playerTop = player.ducking ? groundY - 29 : player.y + 5;
      const playerBottom = player.ducking ? groundY - 2 : player.y + player.h - 2;
      const overlaps = horizontalOverlap && playerTop < o.y + o.h && playerBottom > o.y;
      if (overlaps) {
        const isEnemy = o.kind === 'runner' || o.kind === 'drone';
        const stomped = isEnemy && player.vy > 80 && previousBottom <= o.y + 13;
        if (stomped) stomp(o); else gameOver();
      }
    }
    obstacles = obstacles.filter(o => !o.destroyed && o.x + o.w > -30);
    for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; p.life -= dt; }
    particles = particles.filter(p => p.life > 0);
    for (const p of popups) { p.y -= 42 * dt; p.life -= dt; }
    popups = popups.filter(p => p.life > 0);
    for (const c of clouds) { c.x -= speed * .025 * c.s * dt; if (c.x < -130) c.x = width + 100; }
    for (const h of hills) { h.x -= speed * .06 * dt; if (h.x + h.w < 0) h.x = width + Math.random() * 100; }
    shake = Math.max(0, shake - dt * 25);
    warning = Math.max(0, warning - dt);
  }

  function stomp(enemy) {
    enemy.destroyed = true;
    const points = enemy.kind === 'drone' ? 150 : 100;
    bonus += points;
    player.y = enemy.y - player.h;
    player.vy = -430;
    player.grounded = false;
    player.hold = false;
    burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, 14, palette.red);
    popups.push({ x: enemy.x + enemy.w / 2, y: enemy.y - 12, text: '+' + points, life: .9 });
    beep(820, .08, 'square', .035);
  }

  function gameOver() {
    if (state !== 'running') return;
    state = 'gameover'; shake = 8; beep(105, .18, 'sawtooth', .05);
    const finalScore = Math.floor(distance) + bonus;
    const newBest = finalScore > best;
    best = Math.max(best, finalScore); localStorage.setItem('sidequest-best', best); bestEl.textContent = best.toString().padStart(5, '0');
    kickerEl.textContent = 'RUN COMPLETE'; titleEl.innerHTML = `${finalScore}<br><em>POINTS.</em>`;
    textEl.innerHTML = newBest ? `New best — ${Math.floor(distance)}m traveled and ${bonus} bonus points.<br>Think you can push it farther?` : `You traveled ${Math.floor(distance)}m and earned ${bonus} bonus points.<br>Best score: ${best}.`;
    buttonText.textContent = 'RUN AGAIN';
    setTimeout(() => startCard.classList.remove('hide'), 380);
  }

  function togglePause() {
    if (state === 'running') { state = 'paused'; pauseCard.hidden = false; }
    else if (state === 'paused') resume();
  }
  function resume() { state = 'running'; pauseCard.hidden = true; lastTime = performance.now(); requestAnimationFrame(loop); }

  function beep(freq, duration, type, volume) {
    if (muted) return;
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
      osc.type = type; osc.frequency.value = freq; gain.gain.setValueAtTime(volume, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(.0001, audioCtx.currentTime + duration);
      osc.connect(gain).connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + duration);
    } catch (_) { /* audio is optional */ }
  }

  function drawCloud(c) {
    ctx.save(); ctx.translate(c.x, c.y); ctx.scale(c.s, c.s); ctx.fillStyle = 'rgba(208,197,177,.43)';
    ctx.beginPath(); ctx.arc(0, 10, 24, 0, 7); ctx.arc(30, 0, 35, 0, 7); ctx.arc(66, 13, 24, 0, 7); ctx.fill(); ctx.restore();
  }

  function drawObstacle(o) {
    ctx.save(); ctx.translate(o.x, o.y); ctx.fillStyle = palette.red; ctx.strokeStyle = palette.ink; ctx.lineWidth = 3;
    if (o.kind === 'hole') {
      ctx.fillStyle = distance >= 800 ? '#b5633f' : palette.paper;
      ctx.fillRect(-3, -4, o.w + 6, o.h + 18);
      ctx.fillStyle = '#171815'; ctx.beginPath(); ctx.ellipse(o.w / 2, 3, o.w / 2, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#e07145'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(4, -2); ctx.lineTo(o.w * .28, 4); ctx.moveTo(o.w - 4, -2); ctx.lineTo(o.w * .72, 4); ctx.stroke();
    } else if (o.kind === 'hangingRock') {
      ctx.fillStyle = '#2c2924'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(o.w, 0); ctx.lineTo(o.w - 8, 16); ctx.lineTo(o.w - 22, 12); ctx.lineTo(o.w - 31, o.h); ctx.lineTo(o.w - 43, 17); ctx.lineTo(9, 22); ctx.closePath(); ctx.fill();
      ctx.stroke(); ctx.fillStyle = palette.red; ctx.beginPath(); ctx.arc(o.w - 15, 9, 3, 0, 7); ctx.fill();
    } else if (o.kind === 'runner') {
      ctx.translate(0, Math.abs(Math.sin(o.phase)) * -3);
      ctx.fillStyle = palette.ink; ctx.beginPath(); ctx.arc(22, 12, 12, 0, 7); ctx.fill();
      ctx.fillStyle = palette.red; ctx.beginPath(); ctx.arc(18, 10, 3, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(27, 10, 3, 0, 7); ctx.fill();
      ctx.strokeStyle = palette.ink; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(18, 23); ctx.lineTo(10 + Math.sin(o.phase) * 6, 39); ctx.moveTo(27, 23); ctx.lineTo(35 - Math.sin(o.phase) * 6, 39); ctx.stroke();
    } else if (o.kind === 'drone') {
      ctx.translate(0, Math.sin(o.phase) * 3); ctx.fillStyle = palette.ink; ctx.beginPath(); ctx.roundRect(8, 4, 42, 20, 8); ctx.fill();
      ctx.fillStyle = palette.red; ctx.beginPath(); ctx.arc(38, 14, 4, 0, 7); ctx.fill();
      ctx.strokeStyle = palette.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(22, 2); ctx.moveTo(36, 2); ctx.lineTo(58, 2); ctx.stroke();
    } else if (o.kind === 'post') {
      ctx.fillRect(4, 0, o.w - 8, o.h); ctx.strokeRect(4, 0, o.w - 8, o.h);
      ctx.fillStyle = palette.paper; for (let y = 9; y < o.h; y += 19) ctx.fillRect(5, y, o.w - 10, 6);
    } else {
      ctx.fillRect(0, 0, o.w, o.h); ctx.strokeRect(0, 0, o.w, o.h); ctx.beginPath(); ctx.moveTo(3, 3); ctx.lineTo(o.w - 3, o.h - 3); ctx.moveTo(o.w - 3, 3); ctx.lineTo(3, o.h - 3); ctx.stroke();
      if (o.kind === 'double') { ctx.beginPath(); ctx.moveTo(o.w / 2, 0); ctx.lineTo(o.w / 2, o.h); ctx.stroke(); }
    }
    ctx.restore();
  }

  function drawPlayer() {
    const x = player.x, y = player.y, running = player.grounded && state === 'running';
    const swing = running ? Math.sin(player.runFrame) * 9 : 3;
    ctx.save();
    if (player.ducking) { ctx.translate(x + player.w / 2 + 5, groundY - 17); ctx.scale(1.18, .62); }
    else ctx.translate(x + player.w / 2, y + player.h / 2);
    if (state === 'gameover') ctx.rotate(-.25);
    ctx.strokeStyle = palette.ink; ctx.fillStyle = palette.ink; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.arc(2, -20, 9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(-2, 13); ctx.stroke();
    ctx.strokeStyle = palette.red; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-5, -8); ctx.lineTo(3, 9); ctx.stroke();
    ctx.strokeStyle = palette.ink; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(-1, 12); ctx.lineTo(-11 + swing, 28); ctx.moveTo(0, 12); ctx.lineTo(12 - swing, 28); ctx.stroke();
    ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-1, -5); ctx.lineTo(-13 - swing * .5, 8); ctx.moveTo(2, -4); ctx.lineTo(15 + swing * .5, 3); ctx.stroke();
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height); ctx.save();
    if (shake) ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);
    const canyonBlend = Math.max(0, Math.min(1, (distance - 760) / 80));
    if (canyonBlend > 0) {
      ctx.globalAlpha = canyonBlend; ctx.fillStyle = '#d88a5c'; ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f4c67c'; ctx.beginPath(); ctx.arc(width * .78, 105, 42, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    }
    for (const c of clouds) drawCloud(c);
    ctx.fillStyle = canyonBlend > .5 ? '#a94e37' : palette.light;
    for (const h of hills) { ctx.beginPath(); ctx.moveTo(h.x, groundY); ctx.quadraticCurveTo(h.x + h.w / 2, groundY - h.h, h.x + h.w, groundY); ctx.fill(); }
    ctx.strokeStyle = 'rgba(32,33,29,.14)'; ctx.lineWidth = 1; ctx.setLineDash([3, 8]); ctx.beginPath(); ctx.moveTo(0, groundY - 88); ctx.lineTo(width, groundY - 88); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = palette.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(width, groundY); ctx.stroke();
    const dashOffset = -((distance * 5) % 70); ctx.fillStyle = 'rgba(32,33,29,.22)';
    for (let x = dashOffset; x < width; x += 70) ctx.fillRect(x, groundY + 13, 38, 2);
    for (const o of obstacles) drawObstacle(o);
    for (const p of particles) { ctx.globalAlpha = Math.max(0, p.life * 1.7); ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); }
    for (const p of popups) {
      ctx.globalAlpha = Math.min(1, p.life * 2); ctx.fillStyle = palette.red; ctx.textAlign = 'center'; ctx.font = '800 18px DM Mono, monospace';
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1; drawPlayer();
    if (warning > 0) {
      ctx.globalAlpha = Math.min(1, warning * 2); ctx.fillStyle = palette.red; ctx.textAlign = 'center'; ctx.font = '500 11px DM Mono, monospace';
      const alertText = distance >= 795 ? '⚠ CINDER CANYON — WATCH THE GROUND' : '⚠ ENEMIES INCOMING — JUMP OR DUCK';
      ctx.fillText(alertText, width / 2, groundY - 125); ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function loop(now) {
    if (state !== 'running') { draw(); return; }
    const dt = Math.min((now - lastTime) / 1000, .032); lastTime = now;
    update(dt); draw();
    if (state === 'running') requestAnimationFrame(loop);
  }

  document.getElementById('startButton').addEventListener('click', reset);
  document.getElementById('resumeButton').addEventListener('click', resume);
  pauseButton.addEventListener('click', togglePause);
  soundButton.addEventListener('click', () => {
    muted = !muted; soundButton.style.opacity = muted ? '.4' : '1'; soundButton.setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound');
  });
  canvas.addEventListener('pointerdown', e => { e.preventDefault(); jump(); });
  window.addEventListener('pointerup', () => { releaseJump(); setDuck(false); });
  duckButton.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); setDuck(true); });
  duckButton.addEventListener('pointerup', e => { e.preventDefault(); setDuck(false); });
  duckButton.addEventListener('pointercancel', () => setDuck(false));
  window.addEventListener('keydown', e => {
    if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) { e.preventDefault(); if (!e.repeat) jump(); }
    if (e.code === 'KeyP' || e.code === 'Escape') togglePause();
    if (['ArrowDown', 'KeyS'].includes(e.code)) { e.preventDefault(); setDuck(true); }
  });
  window.addEventListener('keyup', e => {
    if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) releaseJump();
    if (['ArrowDown', 'KeyS'].includes(e.code)) setDuck(false);
  });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'running') togglePause(); });

  bestEl.textContent = best.toString().padStart(5, '0'); resize(); draw();
})();
