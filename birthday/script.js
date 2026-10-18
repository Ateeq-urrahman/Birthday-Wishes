const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const levelValue = document.getElementById('levelValue');
const starsValue = document.getElementById('starsValue');
const timeValue = document.getElementById('timeValue');
const statusMessage = document.getElementById('statusMessage');
const revealCard = document.getElementById('revealCard');
const restartBtn = document.getElementById('restartBtn');

const state = {
  levelIndex: 0,
  player: { x: 50, y: 50, r: 14, speed: 2.8 },
  stars: [],
  obstacleRects: [],
  starsCollected: 0,
  timeLeft: 30,
  completed: false,
  keys: {},
  lastTimestamp: 0,
  animationId: null,
  started: false,
};

const levels = [
  {
    time: 30,
    playerStart: { x: 52, y: 52 },
    stars: [
      { x: 180, y: 120 },
      { x: 520, y: 120 },
      { x: 620, y: 340 },
      { x: 210, y: 380 },
      { x: 350, y: 220 },
    ],
    obstacles: [
      { x: 120, y: 70, w: 100, h: 18 },
      { x: 260, y: 150, w: 18, h: 180 },
      { x: 420, y: 175, w: 120, h: 18 },
      { x: 360, y: 330, w: 120, h: 18 },
      { x: 150, y: 260, w: 18, h: 120 },
    ],
  },
  {
    time: 32,
    playerStart: { x: 56, y: 420 },
    stars: [
      { x: 140, y: 120 },
      { x: 290, y: 90 },
      { x: 410, y: 150 },
      { x: 620, y: 180 },
      { x: 560, y: 380 },
      { x: 220, y: 360 },
    ],
    obstacles: [
      { x: 100, y: 55, w: 20, h: 250 },
      { x: 200, y: 180, w: 180, h: 18 },
      { x: 480, y: 90, w: 20, h: 250 },
      { x: 290, y: 280, w: 160, h: 20 },
      { x: 150, y: 330, w: 180, h: 18 },
      { x: 420, y: 360, w: 120, h: 18 },
    ],
  },
  {
    time: 34,
    playerStart: { x: 60, y: 60 },
    stars: [
      { x: 120, y: 360 },
      { x: 240, y: 180 },
      { x: 340, y: 260 },
      { x: 470, y: 100 },
      { x: 560, y: 360 },
      { x: 650, y: 220 },
      { x: 340, y: 420 },
    ],
    obstacles: [
      { x: 100, y: 110, w: 180, h: 18 },
      { x: 160, y: 260, w: 18, h: 150 },
      { x: 270, y: 120, w: 20, h: 180 },
      { x: 330, y: 220, w: 180, h: 24 },
      { x: 420, y: 300, w: 20, h: 140 },
      { x: 520, y: 120, w: 18, h: 190 },
      { x: 560, y: 280, w: 120, h: 20 },
    ],
  },
];

function resetLevel() {
  const level = levels[state.levelIndex];
  state.player.x = level.playerStart.x;
  state.player.y = level.playerStart.y;
  state.stars = level.stars.map((star) => ({ ...star, collected: false }));
  state.obstacleRects = level.obstacles;
  state.starsCollected = 0;
  state.timeLeft = level.time;
  state.completed = false;
  state.started = true;
  updateHud();
}

function updateHud() {
  const level = levels[state.levelIndex];
  const total = state.stars.length || level.stars.length;
  levelValue.textContent = String(state.levelIndex + 1);
  starsValue.textContent = `${state.starsCollected}/${total}`;
  timeValue.textContent = `${Math.max(0, Math.ceil(state.timeLeft))}`;
}

function setStatus(message) {
  statusMessage.textContent = message;
}

function proceedToNextLevel() {
  if (state.levelIndex < levels.length - 1) {
    state.levelIndex += 1;
    setStatus(`Level ${state.levelIndex + 1}! Collect all the stars to unlock the next clue.`);
    resetLevel();
    return;
  }

  state.completed = true;
  revealCard.classList.remove('hidden');
  setStatus('You did it! The surprise has been unlocked.');
}

function checkCollisions() {
  const player = state.player;

  for (const rect of state.obstacleRects) {
    const nearestX = Math.max(rect.x, Math.min(player.x, rect.x + rect.w));
    const nearestY = Math.max(rect.y, Math.min(player.y, rect.y + rect.h));
    const dx = player.x - nearestX;
    const dy = player.y - nearestY;
    const distanceSq = dx * dx + dy * dy;

    if (distanceSq < player.r * player.r) {
      const pushX = dx === 0 ? 0 : (dx / Math.abs(dx)) * 1.5;
      const pushY = dy === 0 ? 0 : (dy / Math.abs(dy)) * 1.5;
      player.x += pushX;
      player.y += pushY;
    }
  }
}

function collectStars() {
  for (const star of state.stars) {
    if (star.collected) continue;

    const dx = state.player.x - star.x;
    const dy = state.player.y - star.y;
    const dist = Math.hypot(dx, dy);

    if (dist < state.player.r + 10) {
      star.collected = true;
      state.starsCollected += 1;
      setStatus(`Nice! ${state.starsCollected} of ${state.stars.length} stars collected.`);
      updateHud();
    }
  }

  if (state.starsCollected === state.stars.length) {
    proceedToNextLevel();
  }
}

function updatePlayer() {
  const p = state.player;
  let moveX = 0;
  let moveY = 0;

  if (state.keys.ArrowUp || state.keys.w) moveY -= 1;
  if (state.keys.ArrowDown || state.keys.s) moveY += 1;
  if (state.keys.ArrowLeft || state.keys.a) moveX -= 1;
  if (state.keys.ArrowRight || state.keys.d) moveX += 1;

  if (moveX !== 0 || moveY !== 0) {
    const length = Math.hypot(moveX, moveY) || 1;
    p.x += (moveX / length) * p.speed;
    p.y += (moveY / length) * p.speed;
  }

  p.x = Math.max(p.r, Math.min(canvas.width - p.r, p.x));
  p.y = Math.max(p.r, Math.min(canvas.height - p.r, p.y));

  checkCollisions();
  collectStars();
}

function drawRoundedRect(x, y, w, h, radius, fill) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawStar(x, y, radius, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const outerX = Math.cos(angle) * radius;
    const outerY = Math.sin(angle) * radius;
    const innerAngle = angle + Math.PI / 10;
    const innerX = Math.cos(innerAngle) * (radius * 0.5);
    const innerY = Math.sin(innerAngle) * (radius * 0.5);

    if (i === 0) {
      ctx.moveTo(outerX, outerY);
    } else {
      ctx.lineTo(outerX, outerY);
    }
    ctx.lineTo(innerX, innerY);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawPlayer() {
  ctx.beginPath();
  ctx.arc(state.player.x, state.player.y, state.player.r, 0, Math.PI * 2);
  ctx.fillStyle = '#f35c8d';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(state.player.x - 4, state.player.y - 3, 2.4, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(state.player.x + 4, state.player.y - 3, 2.4, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(state.player.x - 4, state.player.y - 3, 1.2, 0, Math.PI * 2);
  ctx.fillStyle = '#2d1c2c';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(state.player.x + 4, state.player.y - 3, 1.2, 0, Math.PI * 2);
  ctx.fillStyle = '#2d1c2c';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(state.player.x, state.player.y + 5, 5, 0, Math.PI, false);
  ctx.strokeStyle = '#2d1c2c';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#fffaf5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 18; i += 1) {
    const x = (i * 90) % canvas.width;
    const y = (i * 52) % canvas.height;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 223, 233, 0.7)' : 'rgba(255, 218, 175, 0.28)';
    ctx.fillRect(x, y, 46, 46);
  }

  for (const rect of state.obstacleRects) {
    drawRoundedRect(rect.x, rect.y, rect.w, rect.h, 12, '#e5c9d7');
  }

  for (const star of state.stars) {
    if (!star.collected) {
      drawStar(star.x, star.y, 12, '#ffd76a');
      drawStar(star.x, star.y, 7, '#fff1af');
    }
  }

  drawPlayer();
}

function tick(timestamp) {
  if (!state.started) {
    drawBoard();
    return;
  }

  const delta = (timestamp - (state.lastTimestamp || timestamp)) / 1000;
  state.lastTimestamp = timestamp;

  if (!state.completed) {
    state.timeLeft -= delta;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      setStatus('Time is up! Press restart and try again.');
      state.started = false;
      updateHud();
      drawBoard();
      return;
    }

    updatePlayer();
    updateHud();
  }

  drawBoard();
  requestAnimationFrame(tick);
}

function restartGame() {
  state.levelIndex = 0;
  state.completed = false;
  revealCard.classList.add('hidden');
  setStatus('Collect all stars to unlock the surprise.');
  resetLevel();
  state.lastTimestamp = 0;
  requestAnimationFrame(tick);
}

window.addEventListener('keydown', (event) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault();
  }
  state.keys[event.key] = true;
  state.keys[event.key.toLowerCase()] = true;
});

window.addEventListener('keyup', (event) => {
  state.keys[event.key] = false;
  state.keys[event.key.toLowerCase()] = false;
});

const touchButtons = document.querySelectorAll('.dir-btn');
touchButtons.forEach((button) => {
  const direction = button.dataset.dir;

  const press = (event) => {
    event.preventDefault();
    if (direction === 'up') state.keys.ArrowUp = true;
    if (direction === 'down') state.keys.ArrowDown = true;
    if (direction === 'left') state.keys.ArrowLeft = true;
    if (direction === 'right') state.keys.ArrowRight = true;
  };

  const release = () => {
    if (direction === 'up') state.keys.ArrowUp = false;
    if (direction === 'down') state.keys.ArrowDown = false;
    if (direction === 'left') state.keys.ArrowLeft = false;
    if (direction === 'right') state.keys.ArrowRight = false;
  };

  button.addEventListener('pointerdown', press);
  button.addEventListener('pointerup', release);
  button.addEventListener('pointerleave', release);
});

restartBtn.addEventListener('click', restartGame);

resetLevel();
requestAnimationFrame(tick);
