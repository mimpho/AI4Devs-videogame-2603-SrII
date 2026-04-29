/* ============================================
   NEON DRIFT — Game Logic
   ============================================ */

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ─── DOM refs ─────────────────────────────────
const startScreen    = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const pauseScreen    = document.getElementById('pauseScreen');
const hud            = document.getElementById('hud');
const scoreDisplay   = document.getElementById('scoreDisplay');
const levelDisplay   = document.getElementById('levelDisplay');
const livesDisplay   = document.getElementById('livesDisplay');
const finalScore     = document.getElementById('finalScore');
const finalHiScore   = document.getElementById('finalHiScore');
const finalLevel     = document.getElementById('finalLevel');
const hiScoreStart   = document.getElementById('hiScoreStart');

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);
document.getElementById('menuBtn').addEventListener('click', showMenu);
document.getElementById('resumeBtn').addEventListener('click', resumeGame);
document.getElementById('pauseMenuBtn').addEventListener('click', showMenu);

// ─── Game State ───────────────────────────────
let state = 'menu'; // menu | playing | paused | gameover
let score, level, lives, hiScore, animId;
let frameCount, spawnInterval, speed;

// ─── Canvas resize ────────────────────────────
function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// ─── Starfield ────────────────────────────────
let stars = [];
function initStars() {
  stars = [];
  for (let i = 0; i < 160; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.2,
      speed: Math.random() * 0.6 + 0.2,
      alpha: Math.random() * 0.7 + 0.3
    });
  }
}

function drawStars() {
  stars.forEach(s => {
    s.y += s.speed * (speed / 3);
    if (s.y > canvas.height) { s.y = 0; s.x = Math.random() * canvas.width; }
    ctx.save();
    ctx.globalAlpha = s.alpha;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

// ─── Grid floor ───────────────────────────────
let gridOffset = 0;
function drawGrid() {
  const W = canvas.width, H = canvas.height;
  const horizon = H * 0.52;
  const cols = 14, spacing = W / cols;
  const rows = 18, rowSpacing = (H - horizon) / rows;

  gridOffset = (gridOffset + speed * 0.5) % rowSpacing;

  ctx.save();
  ctx.strokeStyle = 'rgba(180,79,255,0.22)';
  ctx.lineWidth = 1;

  // Vertical lines converging to center
  for (let c = 0; c <= cols; c++) {
    const bx = c * spacing;
    const tx = W / 2 + (bx - W / 2) * 0.05;
    ctx.beginPath();
    ctx.moveTo(tx, horizon);
    ctx.lineTo(bx, H);
    ctx.stroke();
  }

  // Horizontal lines with perspective
  for (let r = 0; r <= rows; r++) {
    const y = horizon + r * rowSpacing + gridOffset;
    if (y > H) continue;
    const t = (y - horizon) / (H - horizon);
    const xl = W / 2 - (W / 2) * t;
    const xr = W / 2 + (W / 2) * t;
    ctx.globalAlpha = t * 0.6;
    ctx.beginPath();
    ctx.moveTo(xl, y);
    ctx.lineTo(xr, y);
    ctx.stroke();
  }

  // Gradient fade over grid
  const grad = ctx.createLinearGradient(0, horizon, 0, H);
  grad.addColorStop(0, 'rgba(4,2,15,0.85)');
  grad.addColorStop(0.4, 'rgba(4,2,15,0.1)');
  grad.addColorStop(1, 'rgba(4,2,15,0)');
  ctx.globalAlpha = 1;
  ctx.fillStyle = grad;
  ctx.fillRect(0, horizon, W, H - horizon);
  ctx.restore();
}

// ─── Player ───────────────────────────────────
const PLAYER_W = 46, PLAYER_H = 52;
let player;

function initPlayer() {
  player = {
    x: canvas.width / 2,
    y: canvas.height * 0.78,
    w: PLAYER_W, h: PLAYER_H,
    vx: 0,
    speed: 5.5,
    invincible: false,
    invTimer: 0,
    thrustAnim: 0
  };
}

function drawPlayer() {
  if (player.invincible && Math.floor(Date.now() / 80) % 2 === 0) return;

  const { x, y, w, h } = player;
  player.thrustAnim = (player.thrustAnim + 0.18) % (Math.PI * 2);

  ctx.save();
  ctx.translate(x, y);

  // Engine glow
  const engineFlicker = 0.7 + 0.3 * Math.sin(player.thrustAnim * 4);
  const eg = ctx.createRadialGradient(0, h * 0.35, 2, 0, h * 0.35, 22 * engineFlicker);
  eg.addColorStop(0, 'rgba(255,230,0,0.9)');
  eg.addColorStop(0.4, 'rgba(255,100,0,0.6)');
  eg.addColorStop(1, 'rgba(255,45,120,0)');
  ctx.fillStyle = eg;
  ctx.beginPath();
  ctx.ellipse(0, h * 0.38, 10, 26 * engineFlicker, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ship body
  ctx.beginPath();
  ctx.moveTo(0, -h / 2);       // nose
  ctx.lineTo(-w / 2, h * 0.3); // left wing
  ctx.lineTo(-w * 0.15, h * 0.1);
  ctx.lineTo(0, h * 0.25);     // center bottom
  ctx.lineTo(w * 0.15, h * 0.1);
  ctx.lineTo(w / 2, h * 0.3);  // right wing
  ctx.closePath();

  const bodyGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  bodyGrad.addColorStop(0, '#00f5ff');
  bodyGrad.addColorStop(0.5, '#6030cc');
  bodyGrad.addColorStop(1, '#ff2d78');
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,245,255,0.8)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Cockpit
  ctx.beginPath();
  ctx.ellipse(0, -h * 0.12, 7, 10, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,245,255,0.3)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,245,255,0.9)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Wing accents
  ctx.strokeStyle = 'rgba(255,45,120,0.7)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-w * 0.4, h * 0.2);
  ctx.lineTo(-w * 0.15, h * 0.05);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w * 0.4, h * 0.2);
  ctx.lineTo(w * 0.15, h * 0.05);
  ctx.stroke();

  ctx.restore();
}

// ─── Obstacles (asteroids) ────────────────────
let obstacles = [];
let obstaclePool = [];

function spawnObstacle() {
  const size   = 20 + Math.random() * 32;
  const margin = size + 10;
  const x      = margin + Math.random() * (canvas.width - margin * 2);
  const sides  = Math.floor(Math.random() * 4) + 5; // 5–8 sides
  const rot    = Math.random() * Math.PI * 2;
  const rotV   = (Math.random() - 0.5) * 0.04;
  const hue    = Math.random() < 0.5 ? 'pink' : 'purple';

  obstacles.push({ x, y: -size - 10, size, sides, rot, rotV, hue, vx: (Math.random() - 0.5) * 1.2 });
}

function drawObstacle(o) {
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(o.rot);

  const color    = o.hue === 'pink' ? '#ff2d78' : '#b44fff';
  const colorInner = o.hue === 'pink' ? 'rgba(255,45,120,0.2)' : 'rgba(180,79,255,0.2)';

  ctx.beginPath();
  for (let i = 0; i < o.sides; i++) {
    const angle = (i / o.sides) * Math.PI * 2 - Math.PI / 2;
    const vary  = 0.8 + Math.random() * 0.0; // fixed shape
    const rx = Math.cos(angle) * o.size * vary;
    const ry = Math.sin(angle) * o.size * vary;
    i === 0 ? ctx.moveTo(rx, ry) : ctx.lineTo(rx, ry);
  }
  ctx.closePath();
  ctx.fillStyle = colorInner;
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.stroke();

  // Inner highlight
  ctx.beginPath();
  ctx.arc(0, 0, o.size * 0.3, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.shadowBlur = 0;
  ctx.stroke();

  ctx.restore();
}

// ─── Bullets ──────────────────────────────────
let bullets = [];

function fireBullet() {
  bullets.push({ x: player.x, y: player.y - player.h / 2, r: 4, vy: -14 });
  if (bullets.length > 30) bullets.shift();
}

function drawBullet(b) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
  ctx.fillStyle = '#00f5ff';
  ctx.shadowColor = '#00f5ff';
  ctx.shadowBlur = 16;
  ctx.fill();
  ctx.restore();
}

// ─── Particles ────────────────────────────────
let particles = [];

function spawnExplosion(x, y, color) {
  const count = 18 + Math.floor(Math.random() * 12);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd   = 1.5 + Math.random() * 4.5;
    particles.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      r:  2 + Math.random() * 4,
      alpha: 1,
      color: Math.random() < 0.5 ? color : '#ffe600',
      life: 0.015 + Math.random() * 0.02
    });
  }
}

function updateParticles() {
  particles = particles.filter(p => p.alpha > 0.02);
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.06;
    p.r  *= 0.97;
    p.alpha -= p.life;
    p.vx *= 0.97;
  });
}

function drawParticles() {
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.restore();
  });
}

// ─── Hit flash ────────────────────────────────
let hitFlash = 0;

// ─── Inputs ───────────────────────────────────
const keys = {};
document.addEventListener('keydown', e => {
  if (state !== 'playing') return;
  keys[e.code] = true;
  if (e.code === 'Space') { e.preventDefault(); fireBullet(); }
  if (e.code === 'Escape') { e.preventDefault(); togglePause(); }
});
document.addEventListener('keyup', e => { keys[e.code] = false; });

// Touch support
let touchStartX = null;
canvas.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
  if (state === 'playing') fireBullet();
}, { passive: true });
canvas.addEventListener('touchmove', e => {
  if (state !== 'playing' || touchStartX === null) return;
  const dx = e.touches[0].clientX - touchStartX;
  player.x = Math.max(player.w / 2, Math.min(canvas.width - player.w / 2, player.x + dx * 0.9));
  touchStartX = e.touches[0].clientX;
}, { passive: true });

// ─── Collision ────────────────────────────────
function circleRect(cx, cy, cr, rx, ry, rw, rh) {
  const nearX = Math.max(rx - rw / 2, Math.min(cx, rx + rw / 2));
  const nearY = Math.max(ry - rh / 2, Math.min(cy, ry + rh / 2));
  const dx = cx - nearX, dy = cy - nearY;
  return dx * dx + dy * dy < cr * cr;
}

// ─── Init / Reset ─────────────────────────────
function initGame() {
  score    = 0;
  level    = 1;
  lives    = 3;
  speed    = 3;
  frameCount    = 0;
  spawnInterval = 75;
  obstacles  = [];
  bullets    = [];
  particles  = [];
  hitFlash   = 0;
  initPlayer();
  initStars();
  updateHUD();
}

function updateHUD() {
  scoreDisplay.textContent = score;
  levelDisplay.textContent = level;
  livesDisplay.textContent = '♥'.repeat(lives);
}

// ─── Game flow ────────────────────────────────
function startGame() {
  hiScore = parseInt(localStorage.getItem('neonDriftHiScore') || '0');
  initGame();
  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  pauseScreen.classList.add('hidden');
  hud.classList.remove('hidden');
  state = 'playing';
  cancelAnimationFrame(animId);
  loop();
}

function showMenu() {
  state = 'menu';
  cancelAnimationFrame(animId);
  gameOverScreen.classList.add('hidden');
  pauseScreen.classList.add('hidden');
  hud.classList.add('hidden');
  startScreen.classList.remove('hidden');
  hiScore = parseInt(localStorage.getItem('neonDriftHiScore') || '0');
  hiScoreStart.textContent = hiScore;
}

function endGame() {
  state = 'gameover';
  if (score > hiScore) {
    hiScore = score;
    localStorage.setItem('neonDriftHiScore', hiScore);
  }
  finalScore.textContent   = score;
  finalHiScore.textContent = hiScore;
  finalLevel.textContent   = level;
  hud.classList.add('hidden');
  gameOverScreen.classList.remove('hidden');
}

function togglePause() {
  if (state === 'playing') {
    state = 'paused';
    pauseScreen.classList.remove('hidden');
    cancelAnimationFrame(animId);
  }
}

function resumeGame() {
  if (state === 'paused') {
    state = 'playing';
    pauseScreen.classList.add('hidden');
    loop();
  }
}

// ─── Main loop ────────────────────────────────
function loop() {
  if (state !== 'playing') return;
  animId = requestAnimationFrame(loop);
  update();
  draw();
}

function update() {
  frameCount++;

  // Level progression
  const newLevel = 1 + Math.floor(score / 300);
  if (newLevel !== level) {
    level = newLevel;
    speed = 3 + (level - 1) * 0.6;
    spawnInterval = Math.max(28, 75 - (level - 1) * 7);
    updateHUD();
  }

  // Score tick
  if (frameCount % 20 === 0) {
    score += level;
    scoreDisplay.textContent = score;
  }

  // Player move
  if (keys['ArrowLeft'] || keys['KeyA'])  player.vx -= 0.9;
  if (keys['ArrowRight'] || keys['KeyD']) player.vx += 0.9;
  player.vx *= 0.78;
  player.x  += player.vx;
  player.x   = Math.max(player.w / 2, Math.min(canvas.width - player.w / 2, player.x));

  // Invincibility timer
  if (player.invincible) {
    player.invTimer--;
    if (player.invTimer <= 0) player.invincible = false;
  }

  // Spawn obstacles
  if (frameCount % spawnInterval === 0) spawnObstacle();

  // Update obstacles
  obstacles.forEach(o => {
    o.y   += speed + (level - 1) * 0.3;
    o.x   += o.vx;
    o.rot += o.rotV;
    if (o.x < o.size) { o.x = o.size; o.vx *= -1; }
    if (o.x > canvas.width - o.size) { o.x = canvas.width - o.size; o.vx *= -1; }
  });
  obstacles = obstacles.filter(o => o.y < canvas.height + o.size + 20);

  // Update bullets
  bullets.forEach(b => b.y += b.vy);
  bullets = bullets.filter(b => b.y > -20);

  // Bullet vs obstacle
  bullets.forEach((b, bi) => {
    obstacles.forEach((o, oi) => {
      const dx = b.x - o.x, dy = b.y - o.y;
      if (dx * dx + dy * dy < (o.size + b.r) * (o.size + b.r)) {
        const color = o.hue === 'pink' ? '#ff2d78' : '#b44fff';
        spawnExplosion(o.x, o.y, color);
        score += 10 + level * 5;
        scoreDisplay.textContent = score;
        bullets.splice(bi, 1);
        obstacles.splice(oi, 1);
      }
    });
  });

  // Player vs obstacle
  if (!player.invincible) {
    obstacles.forEach((o, oi) => {
      if (circleRect(o.x, o.y, o.size * 0.75, player.x, player.y, player.w * 0.7, player.h * 0.75)) {
        spawnExplosion(o.x, o.y, '#ff2d78');
        obstacles.splice(oi, 1);
        lives--;
        hitFlash = 18;
        player.invincible = true;
        player.invTimer   = 120;
        updateHUD();
        if (lives <= 0) { endGame(); return; }
      }
    });
  }

  updateParticles();
  if (hitFlash > 0) hitFlash--;
}

function draw() {
  const W = canvas.width, H = canvas.height;

  // Background
  const bg = ctx.createRadialGradient(W / 2, H * 0.3, 60, W / 2, H * 0.3, W * 0.8);
  bg.addColorStop(0, '#110830');
  bg.addColorStop(1, '#04020f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  drawStars();
  drawGrid();

  // Hit flash overlay
  if (hitFlash > 0) {
    ctx.save();
    ctx.globalAlpha = (hitFlash / 18) * 0.35;
    ctx.fillStyle   = '#ff2d78';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // Sun / horizon glow
  const sunGrad = ctx.createRadialGradient(W / 2, H * 0.52, 0, W / 2, H * 0.52, W * 0.35);
  sunGrad.addColorStop(0, 'rgba(255,45,120,0.22)');
  sunGrad.addColorStop(0.5, 'rgba(180,79,255,0.08)');
  sunGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = sunGrad;
  ctx.fillRect(0, 0, W, H);

  obstacles.forEach(drawObstacle);
  bullets.forEach(drawBullet);
  drawParticles();
  drawPlayer();
}

// ─── Menu background animation ────────────────
(function menuLoop() {
  if (state !== 'menu' && state !== 'gameover') return;
  requestAnimationFrame(menuLoop);
  const W = canvas.width, H = canvas.height;
  const bg = ctx.createRadialGradient(W / 2, H * 0.4, 60, W / 2, H * 0.4, W);
  bg.addColorStop(0, '#110830');
  bg.addColorStop(1, '#04020f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  speed = 2.5;
  drawStars();
  speed = 3;
})();

// init hi score display
hiScoreStart.textContent = localStorage.getItem('neonDriftHiScore') || '0';
initStars();
