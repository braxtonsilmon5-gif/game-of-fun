const arena = document.getElementById("arena");
const fighter1El = document.getElementById("fighter1");
const fighter2El = document.getElementById("fighter2");
const p1HealthEl = document.getElementById("p1-health");
const p2HealthEl = document.getElementById("p2-health");
const timerEl = document.getElementById("timer");
const resultBanner = document.getElementById("result-banner");
const resetBtn = document.getElementById("reset-btn");

const ROUND_TIME = 90;
const GRAVITY = 0.7;
const FLOOR_Y = 24;

const state = {
  timer: ROUND_TIME,
  running: true,
  keys: {},
  p1: createFighter({ x: 120, facing: 1 }),
  p2: createFighter({ x: arena.clientWidth - 184, facing: -1 }),
};

function createFighter({ x, facing }) {
  return {
    x,
    y: FLOOR_Y,
    width: 64,
    height: 120,
    vx: 0,
    vy: 0,
    speed: 4.4,
    health: 100,
    facing,
    attackCooldown: 0,
    stunFrames: 0,
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function triggerAttack(attacker, target, isHeavy, element) {
  if (!state.running || attacker.attackCooldown > 0 || attacker.stunFrames > 0) {
    return;
  }

  const range = isHeavy ? 92 : 72;
  const damage = isHeavy ? 18 : 9;
  const cooldown = isHeavy ? 48 : 24;

  attacker.attackCooldown = cooldown;
  element.classList.add("attacking");
  setTimeout(() => element.classList.remove("attacking"), 120);

  const distance = Math.abs(attacker.x - target.x);
  if (distance <= range) {
    target.health = clamp(target.health - damage, 0, 100);
    target.stunFrames = isHeavy ? 10 : 6;

    const targetEl = target === state.p1 ? fighter1El : fighter2El;
    targetEl.classList.add("hit");
    setTimeout(() => targetEl.classList.remove("hit"), 100);

    target.vx += attacker.facing * (isHeavy ? 4.2 : 2.2);
  }
}

function handleInput() {
  const { p1, p2, keys } = state;

  if (p1.stunFrames <= 0) {
    p1.vx = 0;
    if (keys.KeyA) p1.vx = -p1.speed;
    if (keys.KeyD) p1.vx = p1.speed;
    if (keys.KeyW && p1.y === FLOOR_Y) p1.vy = 13;
  }

  if (p2.stunFrames <= 0) {
    p2.vx = 0;
    if (keys.KeyJ) p2.vx = -p2.speed;
    if (keys.KeyL) p2.vx = p2.speed;
    if (keys.KeyI && p2.y === FLOOR_Y) p2.vy = 13;
  }
}

function updatePhysics(f) {
  f.attackCooldown = Math.max(0, f.attackCooldown - 1);
  f.stunFrames = Math.max(0, f.stunFrames - 1);

  f.x += f.vx;
  if (f.vx !== 0) {
    f.facing = f.vx > 0 ? 1 : -1;
  }

  f.y += f.vy;
  f.vy -= GRAVITY;

  if (f.y < FLOOR_Y) {
    f.y = FLOOR_Y;
    f.vy = 0;
  }

  const maxX = arena.clientWidth - f.width;
  f.x = clamp(f.x, 0, maxX);
}

function render() {
  fighter1El.style.left = `${state.p1.x}px`;
  fighter2El.style.left = `${state.p2.x}px`;

  fighter1El.style.bottom = `${state.p1.y}px`;
  fighter2El.style.bottom = `${state.p2.y}px`;

  fighter1El.style.transform = `scaleX(${state.p1.facing})`;
  fighter2El.style.transform = `scaleX(${state.p2.facing})`;

  p1HealthEl.style.width = `${state.p1.health}%`;
  p2HealthEl.style.width = `${state.p2.health}%`;

  p1HealthEl.style.background = state.p1.health < 35 ? "var(--danger)" : "linear-gradient(90deg, var(--success), #79f3ae)";
  p2HealthEl.style.background = state.p2.health < 35 ? "var(--danger)" : "linear-gradient(90deg, var(--success), #79f3ae)";
}

function resolveRound() {
  const { p1, p2, timer } = state;

  if (p1.health <= 0 || p2.health <= 0 || timer <= 0) {
    state.running = false;

    let text = "Draw!";
    if (p1.health !== p2.health) {
      text = p1.health > p2.health ? "Deku Wins! Detroit Smash!" : "Bakugo Wins! Howitzer Impact!";
    }

    resultBanner.textContent = `${text} Press Restart Match to play again.`;
    resultBanner.hidden = false;
    return true;
  }

  return false;
}

function gameLoop() {
  if (state.running) {
    handleInput();

    updatePhysics(state.p1);
    updatePhysics(state.p2);

    const spacing = Math.abs(state.p1.x - state.p2.x);
    if (spacing < 56) {
      const overlap = (56 - spacing) / 2;
      state.p1.x = clamp(state.p1.x - overlap, 0, arena.clientWidth - state.p1.width);
      state.p2.x = clamp(state.p2.x + overlap, 0, arena.clientWidth - state.p2.width);
    }

    render();
    resolveRound();
  }

  requestAnimationFrame(gameLoop);
}

let timerInterval = null;
function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!state.running) return;
    state.timer -= 1;
    timerEl.textContent = state.timer;
    resolveRound();
  }, 1000);
}

function resetGame() {
  state.timer = ROUND_TIME;
  timerEl.textContent = state.timer;
  state.running = true;
  state.p1 = createFighter({ x: 120, facing: 1 });
  state.p2 = createFighter({ x: arena.clientWidth - 184, facing: -1 });
  resultBanner.hidden = true;
  render();
  startTimer();
}

window.addEventListener("keydown", (event) => {
  state.keys[event.code] = true;

  if (event.code === "KeyF") {
    triggerAttack(state.p1, state.p2, false, fighter1El);
  } else if (event.code === "KeyG") {
    triggerAttack(state.p1, state.p2, true, fighter1El);
  } else if (event.code === "Semicolon") {
    triggerAttack(state.p2, state.p1, false, fighter2El);
  } else if (event.code === "Quote") {
    triggerAttack(state.p2, state.p1, true, fighter2El);
  }
});

window.addEventListener("keyup", (event) => {
  state.keys[event.code] = false;
});

window.addEventListener("resize", () => {
  state.p1.x = clamp(state.p1.x, 0, arena.clientWidth - state.p1.width);
  state.p2.x = clamp(state.p2.x, 0, arena.clientWidth - state.p2.width);
});

resetBtn.addEventListener("click", resetGame);

render();
startTimer();
requestAnimationFrame(gameLoop);
