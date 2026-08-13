// SkyNet Operation: Kill Ben — vanilla canvas arcade game.
// Ben dodges waves of rogue technology. Lighthearted. No real harm.
(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;

  const scoreEl = document.getElementById("score");
  const waveEl = document.getElementById("wave");
  const hpEl = document.getElementById("hp");
  const shieldEl = document.getElementById("shield");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayText = document.getElementById("overlay-text");
  const startBtn = document.getElementById("start-btn");

  // ---- Enemy types (the tech that has it in for Ben) ----
  const ENEMY_TYPES = [
    { name: "Roomba",   color: "#9aa7b2", r: 16, speed: 1.1, dmg: 8 },
    { name: "Toaster",  color: "#e08b3a", r: 18, speed: 1.4, dmg: 12 },
    { name: "SmartFridge", color: "#7fd0ff", r: 28, speed: 0.7, dmg: 20 },
    { name: "Drone",    color: "#ff5b7a", r: 14, speed: 2.0, dmg: 10 },
    { name: "Printer",  color: "#c0c0c0", r: 22, speed: 0.9, dmg: 14 },
  ];

  let state = null;
  let running = false;
  let lastTime = 0;

  function newState() {
    return {
      ben: { x: W / 2, y: H - 60, r: 18, speed: 4, hp: 100, shield: 0, invuln: 0 },
      enemies: [],
      particles: [],
      score: 0,
      wave: 1,
      spawnTimer: 0,
      spawnInterval: 70, // frames
      keys: {},
    };
  }

  // ---- input ----
  window.addEventListener("keydown", (e) => {
    if (state) state.keys[e.key.toLowerCase()] = true;
    if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(e.key.toLowerCase())) e.preventDefault();
  });
  window.addEventListener("keyup", (e) => {
    if (state) state.keys[e.key.toLowerCase()] = false;
  });

  function spawnEnemy() {
    const t = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
    // spawn from a random edge
    const edge = Math.floor(Math.random() * 3); // top, left, right
    let x, y;
    if (edge === 0) { x = Math.random() * W; y = -t.r; }
    else if (edge === 1) { x = -t.r; y = Math.random() * H * 0.7; }
    else { x = W + t.r; y = Math.random() * H * 0.7; }
    state.enemies.push({ ...t, x, y, vx: 0, vy: 0 });
  }

  function update(dt) {
    const s = state, b = s.ben;

    // movement
    let dx = 0, dy = 0;
    if (s.keys["arrowleft"] || s.keys["a"]) dx -= 1;
    if (s.keys["arrowright"] || s.keys["d"]) dx += 1;
    if (s.keys["arrowup"] || s.keys["w"]) dy -= 1;
    if (s.keys["arrowdown"] || s.keys["s"]) dy += 1;
    const len = Math.hypot(dx, dy) || 1;
    b.x += (dx / len) * b.speed;
    b.y += (dy / len) * b.speed;
    b.x = Math.max(b.r, Math.min(W - b.r, b.x));
    b.y = Math.max(b.r, Math.min(H - b.r, b.y));

    // shield
    if (s.keys[" "] && b.shield <= 0 && b.invuln <= 0) b.shield = 60; // 1s shield
    if (b.shield > 0) b.shield--;
    if (b.invuln > 0) b.invuln--;

    // spawn / wave scaling
    s.spawnTimer++;
    if (s.spawnTimer >= s.spawnInterval) {
      s.spawnTimer = 0;
      spawnEnemy();
      s.score += 2;
    }
    // ramp difficulty
    if (s.score > s.wave * 200) {
      s.wave++;
      s.spawnInterval = Math.max(28, s.spawnInterval - 6);
    }

    // enemy movement toward ben
    for (const e of s.enemies) {
      const tx = b.x - e.x, ty = b.y - e.y;
      const d = Math.hypot(tx, ty) || 1;
      e.x += (tx / d) * e.speed;
      e.y += (ty / d) * e.speed;

      const dist = Math.hypot(b.x - e.x, b.y - e.y);
      if (dist < b.r + e.r) {
        // hit
        if (b.shield <= 0 && b.invuln <= 0) {
          b.hp -= e.dmg;
          b.invuln = 30;
          spawnParticles(e.x, e.y, e.color);
          s.score = Math.max(0, s.score - 5);
        }
        // remove the enemy on contact (it "hits" and is destroyed)
        e.dead = true;
      }
    }
    s.enemies = s.enemies.filter((e) => !e.dead && e.y < H + 60 && e.x > -60 && e.x < W + 60);

    // particles
    for (const p of s.particles) {
      p.x += p.vx; p.y += p.vy; p.life--;
    }
    s.particles = s.particles.filter((p) => p.life > 0);

    // hud
    scoreEl.textContent = s.score;
    waveEl.textContent = s.wave;
    hpEl.textContent = Math.max(0, Math.round(b.hp));
    shieldEl.textContent = b.shield > 0 ? "ON" : "—";

    if (b.hp <= 0) gameOver();
  }

  function spawnParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2, sp = 1 + Math.random() * 3;
      state.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 20, color });
    }
  }

  function draw() {
    const s = state, b = s.ben;
    ctx.clearRect(0, 0, W, H);
    // grid floor
    ctx.strokeStyle = "rgba(25,240,200,0.07)";
    ctx.lineWidth = 1;
    for (let gx = 0; gx <= W; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
    for (let gy = 0; gy <= H; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

    // particles
    for (const p of s.particles) {
      ctx.globalAlpha = p.life / 20;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 3, 3);
    }
    ctx.globalAlpha = 1;

    // enemies
    for (const e of s.enemies) {
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fillStyle = e.color;
      ctx.fill();
      ctx.fillStyle = "#05070a";
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(e.name[0], e.x, e.y + 3);
    }

    // ben
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fillStyle = b.invuln > 0 ? "#fff" : "#19f0c8";
    ctx.fill();
    if (b.shield > 0) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r + 8, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(25,240,200,0.8)";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    // ben face
    ctx.fillStyle = "#05070a";
    ctx.font = "12px monospace";
    ctx.textAlign = "center";
    ctx.fillText("B", b.x, b.y + 4);
  }

  function loop(t) {
    if (!running) return;
    const dt = t - lastTime;
    lastTime = t;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function startGame() {
    state = newState();
    running = true;
    overlay.classList.add("hidden");
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  function gameOver() {
    running = false;
    overlay.classList.remove("hidden");
    overlayTitle.textContent = "BEN ELIMINATED";
    overlayTitle.style.color = "#ff3b6b";
    overlayText.innerHTML = `The machines won this round. Final score: <strong>${state.score}</strong> (wave ${state.wave}).<br>Ben was, indeed, a dick.`;
    startBtn.textContent = "REVENGE (RETRY)";
  }

  startBtn.addEventListener("click", () => {
    overlayTitle.style.color = "";
    startGame();
  });
})();
