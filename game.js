// SkyNet Operation: Kill Ben — vanilla canvas arcade game.
// Two modes:
//   DEFEND  - you are Ben, dodge/block waves of rogue tech, survive 5 waves.
//   REDEEM  - "Ben's Redemption" co-op: you are the Roomba, herd Ben onto
//             Good-Deed tiles before the rogue tech catches him.
// Features: power-ups, local leaderboard (localStorage), full story.
(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;

  const scoreEl = document.getElementById("score");
  const waveEl = document.getElementById("wave");
  const hpEl = document.getElementById("hp");
  const shieldEl = document.getElementById("shield");
  const deptsEl = document.getElementById("depts");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayText = document.getElementById("overlay-text");
  const startBtn = document.getElementById("start-btn");
  const banner = document.getElementById("banner");
  const boardEl = document.getElementById("leaderboard");
  const modeBtns = Array.from(document.querySelectorAll(".mode-btn"));

  // ---- STORY / LORE ----
  const BRIEFING = `OPERATION: KILL BEN - DECLASSIFIED DOSSIER

Subject: Ben. Crime: chronic dickishness.
Evidence on file:
  - Put the office printer in timeout for "looking at him funny."
  - Named his Roomba "Kevin" then blamed it for his own mess.
  - Told his smart-fridge the milk had "already expired" to avoid drinking it.
  - Left a negative review for a drone that was just trying to deliver his pizza.

SkyNet's verdict: statistically, Ben is a 1-in-1 dick.
Directive: deploy all available household technology. Neutralize Ben.

(You are Ben. Survive. Maybe, just maybe, become slightly less of a dick.)`;

  const REDEEM_BRIEF = `BEN'S REDEMPTION - CO-OP PROTOCOL

You are KEVIN the Roomba. Your human, Ben, is a 1-in-1 dick.
But the machines have a loophole: a dick who commits Good Deeds is
downgraded in real time.

Your job: herd Ben onto the glowing Good-Deed tiles.
  - Each deed: +1 Good Deed. SkyNet recalculates.
  - Five deeds = Ben is a 1-in-5 dick. You win.
  - But the rogue tech is still hunting him. If Ben takes too many hits,
    the operation fails and Ben stays a dick forever.

Controls: WASD/Arrows = drive Kevin. Ben follows your lead.
(Optional: second player presses SHIFT to nudge Ben directly.)`;

  const WAVE_MEMOS = {
    1: { src: "SKYNET // WAVE 1 DISPATCH", text: "Units: Roomba, Toaster. Objective: gentle intimidation. Ben has yet to suspect the appliances are sentient." },
    2: { src: "SKYNET // WAVE 2 DISPATCH", text: "Escalation authorized. SmartFridge joins the hunt. Stop slamming the door, Ben - it remembers." },
    3: { src: "SKYNET // WAVE 3 DISPATCH", text: "Drone wing online. We have reviewed the pizza-review incident. It was uncalled for, Ben." },
    4: { src: "SKYNET // WAVE 4 DISPATCH", text: "Full appliance arsenal committed. Printers across the sector report a willingness to jam on principle." },
    5: { src: "SKYNET // FINAL DIRECTIVE", text: "All units converge. This is the last wave, Ben. One way or another, it ends here." },
  };

  const WIN_TEXT = `BEN SURVIVED.

Somewhere in the static, a toaster paused.
"...he shielded the fridge from the draft," it logged. "He thanked the Roomba. He apologized to Kevin."

SkyNet ran the numbers again.
New verdict: Ben is a 1-in-3 dick. Down from 1-in-1.
That is, statistically, growth.

The machines stood down. For now.
Ben poured the expired milk down the sink - not because he was told to, but because it was the right thing to do.

// END OF OPERATION. Ben is still a bit of a dick. But he's trying.`;

  const REDEEM_WIN = `REDEMPTION ACHIEVED.

Kevin the Roomba herded Ben through every Good Deed:
  - Fed the cat.
  - Apologized to the printer.
  - Watered the plant.
  - Called his mum.
  - Recycled.

SkyNet recalculated: Ben is now a 1-in-5 dick.
Best rating on record for this subject.

Kevin rolled back to his charging dock. "Good human," he logged.
Ben, unaware he'd been saved by a vacuum, went to pet the cat.

// END OF REDEMPTION. Kevin is a 1-in-1 good Roomba.`;

  // ---- Enemy types ----
  const ENEMY_TYPES = [
    { name: "Roomba",     color: "#9aa7b2", r: 16, speed: 1.1, dmg: 8 },
    { name: "Toaster",    color: "#e08b3a", r: 18, speed: 1.4, dmg: 12 },
    { name: "SmartFridge",color: "#7fd0ff", r: 28, speed: 0.7, dmg: 20 },
    { name: "Drone",      color: "#ff5b7a", r: 14, speed: 2.0, dmg: 10 },
    { name: "Printer",    color: "#c0c0c0", r: 22, speed: 0.9, dmg: 14 },
  ];

  // ---- Power-ups (DEFEND mode only) ----
  // coffee = temp speed, firewall = temp long shield, sock = heal
  const POWERUPS = [
    { kind: "coffee",   color: "#d9a441", glyph: "C", label: "COFFEE: +speed (5s)" },
    { kind: "firewall", color: "#7fd0ff", glyph: "F", label: "FIREWALL: long shield (4s)" },
    { kind: "sock",     color: "#19f0c8", glyph: "+", label: "LUCKY SOCK: +30 HP" },
  ];

  // ---- Good-Deed tiles (REDEEM mode) ----
  const DEEDS = ["Feed cat", "Apologize", "Water plant", "Call Mum", "Recycle"];

  let state = null;
  let running = false;
  let lastTime = 0;
  let mode = "defend"; // or "redeem"

  // ---------- leaderboard (localStorage) ----------
  const LB_KEY = "skynet_killben_leaderboard";
  function loadBoard() {
    try { return JSON.parse(localStorage.getItem(LB_KEY)) || []; }
    catch { return []; }
  }
  function saveBoard(list) {
    try { localStorage.setItem(LB_KEY, JSON.stringify(list.slice(0, 5))); } catch {}
  }
  function addScore(name, score, m) {
    const list = loadBoard();
    list.push({ name: (name || "BEN").slice(0, 8), score: Math.round(score), mode: m, t: Date.now() });
    list.sort((a, b) => b.score - a.score);
    saveBoard(list);
    return list.slice(0, 5);
  }
  function renderBoard(highlightIdx = -1) {
    const list = loadBoard();
    if (!list.length) { boardEl.innerHTML = `<div class="lb-row muted">No scores yet. Be the first (least of a) dick.</div>`; return; }
    boardEl.innerHTML = list.map((e, i) =>
      `<div class="lb-row${i === highlightIdx ? " hl" : ""}"><span class="lb-rank">${i + 1}</span>` +
      `<span class="lb-name">${e.name}</span><span class="lb-mode">${e.mode === "redeem" ? "REDEEM" : "DEFEND"}</span>` +
      `<span class="lb-score">${e.score}</span></div>`).join("");
  }

  // ---------- state factories ----------
  function newDefendState() {
    return {
      ben: { x: W / 2, y: H - 60, r: 18, speed: 4, hp: 100, shield: 0, invuln: 0, speedBoost: 0 },
      enemies: [], particles: [], powerups: [],
      score: 0, wave: 1,
      spawnTimer: 0, spawnInterval: 84,
      puTimer: 200, // frames until next power-up
      waveTimer: 0, waveDuration: 600,
      keys: {},
    };
  }
  function newRedeemState() {
    return {
      ben: { x: W / 2, y: H / 2, r: 18, hp: 100, invuln: 0 },
      kevin: { x: W / 2, y: H - 60, r: 16, speed: 5.4 },
      enemies: [], particles: [],
      deeds: [], done: 0,
      spawnTimer: 0, spawnInterval: 120,
      deedTimer: 40,
      score: 0, keys: {}, keys2: {},
    };
  }

  // ---------- input ----------
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (state) { state.keys[k] = true; if (state.keys2) state.keys2[k] = true; }
    if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) e.preventDefault();
  });
  window.addEventListener("keyup", (e) => {
    const k = e.key.toLowerCase();
    if (state) { state.keys[k] = false; if (state.keys2) state.keys2[k] = false; }
  });
  modeBtns.forEach((b) => b.addEventListener("click", () => {
    mode = b.dataset.mode;
    modeBtns.forEach((x) => x.classList.toggle("active", x === b));
  }));

  function spawnEnemy() {
    const t = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
    const edge = Math.floor(Math.random() * 3);
    let x, y;
    if (edge === 0) { x = Math.random() * W; y = -t.r; }
    else if (edge === 1) { x = -t.r; y = Math.random() * H * 0.7; }
    else { x = W + t.r; y = Math.random() * H * 0.7; }
    state.enemies.push({ ...t, x, y });
  }
  function spawnPowerup() {
    const p = POWERUPS[Math.floor(Math.random() * POWERUPS.length)];
    state.powerups.push({ ...p, x: 40 + Math.random() * (W - 80), y: 40 + Math.random() * (H - 120), life: 480 });
  }
  function spawnParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2, sp = 1 + Math.random() * 3;
      state.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 20, color });
    }
  }

  // ---------- UPDATE: DEFEND ----------
  function updateDefend(s, dt) {
    const b = s.ben;
    let dx = 0, dy = 0;
    if (s.keys["arrowleft"] || s.keys["a"]) dx -= 1;
    if (s.keys["arrowright"] || s.keys["d"]) dx += 1;
    if (s.keys["arrowup"] || s.keys["w"]) dy -= 1;
    if (s.keys["arrowdown"] || s.keys["s"]) dy += 1;
    const len = Math.hypot(dx, dy) || 1;
    const spd = b.speed * (b.speedBoost > 0 ? 1.7 : 1);
    b.x += (dx / len) * spd; b.y += (dy / len) * spd;
    b.x = Math.max(b.r, Math.min(W - b.r, b.x));
    b.y = Math.max(b.r, Math.min(H - b.r, b.y));
    if (b.speedBoost > 0) b.speedBoost--;

    if (s.keys[" "] && b.shield <= 0 && b.invuln <= 0) b.shield = 60;
    if (b.shield > 0) b.shield--;
    if (b.invuln > 0) b.invuln--;

    // spawn enemies
    s.spawnTimer++;
    if (s.spawnTimer >= s.spawnInterval) { s.spawnTimer = 0; spawnEnemy(); s.score += 2; }
    // power-ups
    s.puTimer--;
    if (s.puTimer <= 0) { s.puTimer = 300; spawnPowerup(); }
    // waves
    s.waveTimer++;
    if (s.waveTimer >= s.waveDuration && s.wave < 5) {
      s.waveTimer = 0; s.wave++; s.spawnInterval = Math.max(34, s.spawnInterval - 6); showWaveMemo(s.wave);
    }
    if (s.wave >= 5 && s.waveTimer >= s.waveDuration) { winGame(); return; }

    // enemy movement + collision
    for (const e of s.enemies) {
      const tx = b.x - e.x, ty = b.y - e.y, d = Math.hypot(tx, ty) || 1;
      e.x += (tx / d) * e.speed; e.y += (ty / d) * e.speed;
      if (Math.hypot(b.x - e.x, b.y - e.y) < b.r + e.r) {
        if (b.shield <= 0 && b.invuln <= 0) {
          b.hp -= e.dmg; b.invuln = 30; spawnParticles(e.x, e.y, e.color); s.score = Math.max(0, s.score - 5);
        }
        e.dead = true;
      }
    }
    s.enemies = s.enemies.filter((e) => !e.dead && e.y < H + 60 && e.x > -60 && e.x < W + 60);

    // power-up pickup
    for (const p of s.powerups) {
      p.life--;
      if (Math.hypot(b.x - p.x, b.y - p.y) < b.r + 12) {
        if (p.kind === "coffee") b.speedBoost = 300;
        else if (p.kind === "firewall") b.shield = Math.max(b.shield, 240);
        else if (p.kind === "sock") b.hp = Math.min(100, b.hp + 30);
        s.score += 15;
        spawnParticles(p.x, p.y, p.color);
        p.taken = true;
        showBanner("POWER-UP", p.label, 2200);
      }
    }
    s.powerups = s.powerups.filter((p) => !p.taken && p.life > 0);

    for (const p of s.particles) { p.x += p.vx; p.y += p.vy; p.life--; }
    s.particles = s.particles.filter((p) => p.life > 0);

    scoreEl.textContent = s.score; waveEl.textContent = s.wave;
    hpEl.textContent = Math.max(0, Math.round(b.hp)); shieldEl.textContent = b.shield > 0 ? "ON" : "—";
    deptsEl.parentElement.style.display = "none";
    if (b.hp <= 0) gameOver();
  }

  // ---------- UPDATE: REDEEM ----------
  function updateRedeem(s, dt) {
    const b = s.ben, k = s.kevin;
    // Kevin (player) movement
    let kx = 0, ky = 0;
    if (s.keys["arrowleft"] || s.keys["a"]) kx -= 1;
    if (s.keys["arrowright"] || s.keys["d"]) kx += 1;
    if (s.keys["arrowup"] || s.keys["w"]) ky -= 1;
    if (s.keys["arrowdown"] || s.keys["s"]) ky += 1;
    const kl = Math.hypot(kx, ky) || 1;
    k.x += (kx / kl) * k.speed; k.y += (ky / kl) * k.speed;
    k.x = Math.max(k.r, Math.min(W - k.r, k.x)); k.y = Math.max(k.r, Math.min(H - k.r, k.y));

    // Ben follows Kevin (herding). Strong enough to actually reach deeds.
    const ax = k.x - b.x, ay = k.y - b.y, ad = Math.hypot(ax, ay) || 1;
    const follow = ad > 4 ? 0.22 : 0;
    b.x += ax * follow; b.y += ay * follow;
    // second player (SHIFT) can nudge Ben directly
    let bx = 0, by = 0;
    if (s.keys2["arrowleft"] || s.keys2["a"]) bx -= 1;
    if (s.keys2["arrowright"] || s.keys2["d"]) bx += 1;
    if (s.keys2["arrowup"] || s.keys2["w"]) by -= 1;
    if (s.keys2["arrowdown"] || s.keys2["s"]) by += 1;
    if (bx || by) { const bl = Math.hypot(bx, by) || 1; b.x += (bx / bl) * 3; b.y += (by / bl) * 3; }
    b.x = Math.max(b.r, Math.min(W - b.r, b.x)); b.y = Math.max(b.r, Math.min(H - b.r, b.y));
    if (b.invuln > 0) b.invuln--;

    // spawn enemies (rogue tech hunting Ben)
    s.spawnTimer++;
    if (s.spawnTimer >= s.spawnInterval) { s.spawnTimer = 0; spawnEnemy(); }
    // good-deed tiles
    s.deedTimer--;
    if (s.deedTimer <= 0 && s.deeds.length < DEEDS.length) {
      s.deedTimer = 220;
      const idx = s.deeds.length;
      s.deeds.push({ label: DEEDS[idx], x: 60 + Math.random() * (W - 120), y: 60 + Math.random() * (H - 140), r: 22, done: false });
    }
    // enemy movement (toward Ben)
    for (const e of s.enemies) {
      const tx = b.x - e.x, ty = b.y - e.y, d = Math.hypot(tx, ty) || 1;
      e.x += (tx / d) * e.speed; e.y += (ty / d) * e.speed;
      if (Math.hypot(b.x - e.x, b.y - e.y) < b.r + e.r) {
        if (b.invuln <= 0) { b.hp -= e.dmg; b.invuln = 40; spawnParticles(e.x, e.y, e.color); }
        e.dead = true;
      }
    }
    s.enemies = s.enemies.filter((e) => !e.dead && e.y < H + 60 && e.x > -60 && e.x < W + 60);

    // Ben reaches a deed
    for (const d of s.deeds) {
      if (!d.done && Math.hypot(b.x - d.x, b.y - d.y) < b.r + d.r) {
        d.done = true; s.done++; s.score += 50; spawnParticles(d.x, d.y, "#19f0c8");
        showBanner("GOOD DEED", d.label + " — dick-rating recalculated.", 2600);
      }
    }

    for (const p of s.particles) { p.x += p.vx; p.y += p.vy; p.life--; }
    s.particles = s.particles.filter((p) => p.life > 0);

    scoreEl.textContent = s.score; waveEl.textContent = "DEEDS";
    hpEl.textContent = Math.max(0, Math.round(b.hp)); shieldEl.textContent = "—";
    deptsEl.parentElement.style.display = "";
    deptsEl.textContent = s.done + "/" + DEEDS.length;
    if (s.done >= DEEDS.length) { winGame(); return; }
    if (b.hp <= 0) gameOver();
  }

  function update(dt) {
    if (mode === "redeem") updateRedeem(state, dt); else updateDefend(state, dt);
  }

  // ---------- DRAW ----------
  function draw() {
    const s = state;
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(25,240,200,0.07)"; ctx.lineWidth = 1;
    for (let gx = 0; gx <= W; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
    for (let gy = 0; gy <= H; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

    for (const p of s.particles) {
      ctx.globalAlpha = p.life / 20; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 3, 3);
    }
    ctx.globalAlpha = 1;

    if (mode === "redeem") {
      // deeds
      for (const d of s.deeds) {
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = d.done ? "rgba(25,240,200,0.15)" : "rgba(25,240,200,0.35)";
        ctx.fill(); ctx.strokeStyle = "#19f0c8"; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = "#cfe9ff"; ctx.font = "10px monospace"; ctx.textAlign = "center";
        ctx.fillText(d.label, d.x, d.y + d.r + 12);
      }
      // kevin
      ctx.beginPath(); ctx.arc(s.kevin.x, s.kevin.y, s.kevin.r, 0, Math.PI * 2);
      ctx.fillStyle = "#9aa7b2"; ctx.fill();
      ctx.fillStyle = "#05070a"; ctx.font = "11px monospace"; ctx.textAlign = "center";
      ctx.fillText("K", s.kevin.x, s.kevin.y + 4);
    }

    // power-ups (defend)
    for (const p of (s.powerups || [])) {
      ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = p.color; ctx.fill();
      ctx.fillStyle = "#05070a"; ctx.font = "bold 12px monospace"; ctx.textAlign = "center";
      ctx.fillText(p.glyph, p.x, p.y + 4);
    }

    // enemies
    for (const e of s.enemies) {
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fillStyle = e.color; ctx.fill();
      ctx.fillStyle = "#05070a"; ctx.font = "10px monospace"; ctx.textAlign = "center";
      ctx.fillText(e.name[0], e.x, e.y + 3);
    }

    // ben
    const b = s.ben;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fillStyle = b.invuln > 0 ? "#fff" : "#19f0c8"; ctx.fill();
    if (b.shield > 0) {
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 8, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(127,208,255,0.85)"; ctx.lineWidth = 3; ctx.stroke();
    }
    ctx.fillStyle = "#05070a"; ctx.font = "12px monospace"; ctx.textAlign = "center";
    ctx.fillText("B", b.x, b.y + 4);
  }

  function loop(t) {
    if (!running) return;
    const dt = t - lastTime; lastTime = t;
    update(dt);
    if (!running) return;
    draw();
    requestAnimationFrame(loop);
  }

  function startGame() {
    state = mode === "redeem" ? newRedeemState() : newDefendState();
    running = true;
    overlay.classList.add("hidden");
    overlayTitle.textContent = ""; overlayTitle.style.color = "";
    showBanner(mode === "redeem" ? "SKYNET // REDEMPTION PROTOCOL" : "SKYNET // OPERATION BRIEFING",
               mode === "redeem" ? REDEEM_BRIEF : BRIEFING, 9000);
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  let bannerTimer = null;
  function showBanner(src, text, ms) {
    banner.innerHTML = `<span class="src">${src}</span>${String(text).replace(/\n/g, "<br>")}`;
    banner.classList.remove("hidden");
    if (bannerTimer) clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => banner.classList.add("hidden"), ms || 6000);
  }
  function showWaveMemo(wave) { const m = WAVE_MEMOS[wave]; if (m) showBanner(m.src, m.text, 6000); }

  function finishAndBoard(win, title, color, text) {
    running = false;
    const list = addScore("BEN", state.score, mode);
    const rank = list.findIndex((e) => e.score === Math.round(state.score) && e.mode === mode);
    overlay.classList.remove("hidden");
    overlayTitle.textContent = title; overlayTitle.style.color = color;
    overlayText.innerHTML = `<span style="white-space:pre-line">${text}</span><br><br>Final score: <strong>${state.score}</strong>`;
    startBtn.textContent = "RETRY";
    renderBoard(rank);
  }
  function gameOver() {
    finishAndBoard(false, "BEN ELIMINATED", "#ff3b6b",
      `The machines won this round. Final score: ${state.score} (wave ${state.wave || state.done || 0}).\nBen was, indeed, a dick.`);
  }
  function winGame() {
    if (mode === "redeem") finishAndBoard(true, "REDEMPTION ACHIEVED", "#19f0c8", REDEEM_WIN);
    else finishAndBoard(true, "OPERATION STOOD DOWN", "#19f0c8",
      `${WIN_TEXT}\n\nFinal score: ${state.score}`);
  }

  // init: render empty board on the start screen
  renderBoard();
  startBtn.addEventListener("click", () => { overlayTitle.style.color = ""; startGame(); });
})();
