// SkyNet Operation: Kill Ben — CASTLE DEFENSE
// Rogue appliances march a path toward Ben's bunker. Build turrets from
// household gear, spend gold, survive 5 waves. Satirical Kingdom-Rush-lite.
(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;

  // ---- background artwork ----
  const bgImg = new Image();
  bgImg.src = "bg-green.png"; // high-quality generated green field
  let bgReady = false;
  bgImg.onload = () => { bgReady = true; };

  // ---- enemy sprites (generated appliance art) ----
  const ENEMY_SPRITES = ["roomba", "toaster", "fridge", "drone", "printer"].map((n) => {
    const im = new Image(); im.src = "enemies/" + n + ".png"; return im;
  });

  // ---- turret sprites (generated turret art) ----
  const TOWER_SPRITES = {
    toaster: Object.assign(new Image(), { src: "turrets/toaster.png" }),
    fridge: Object.assign(new Image(), { src: "turrets/fridge.png" }),
    drone: Object.assign(new Image(), { src: "turrets/drone.png" }),
  };

  const goldEl = document.getElementById("gold");
  const waveEl = document.getElementById("wave");
  const castleEl = document.getElementById("castle");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayText = document.getElementById("overlay-text");
  const startBtn = document.getElementById("start-btn");
  const towerMenu = document.getElementById("tower-menu");
  const towerBtns = Array.from(towerMenu.querySelectorAll(".tower-btn"));
  const banner = document.getElementById("banner");

  // ---- PATH (waypoints appliances follow toward Ben's bunker) ----
  const PATH = [
    { x: -20, y: 90 }, { x: 180, y: 90 }, { x: 180, y: 250 },
    { x: 420, y: 250 }, { x: 420, y: 110 }, { x: 640, y: 110 },
    { x: 640, y: 380 }, { x: 300, y: 380 }, { x: 300, y: 470 },
    { x: 770, y: 470 }, // bunker / castle at right
  ];
  const CASTLE = { x: 770, y: 470, r: 26 };

  // ---- BUILD SLOTS (near the path) ----
  const SLOTS = [
    { x: 110, y: 180 }, { x: 270, y: 170 }, { x: 330, y: 320 },
    { x: 520, y: 180 }, { x: 520, y: 320 }, { x: 660, y: 250 },
    { x: 220, y: 430 }, { x: 470, y: 430 },
  ];

  // ---- TOWER TYPES ----
  const TOWERS = {
    toaster: { name: "Toaster Turret", color: "#e08b3a", cost: 65, range: 110, dmg: 6, rate: 18, splash: 0,
               up: { cost: 80, dmg: 12, range: 130 } },
    fridge:  { name: "Fridge Mortar", color: "#7fd0ff", cost: 110, range: 140, dmg: 18, rate: 45, splash: 38,
               up: { cost: 120, dmg: 32, range: 160 } },
    drone:   { name: "Drone Sentry", color: "#ff5b7a", cost: 85, range: 150, dmg: 9, rate: 12, splash: 0,
               up: { cost: 100, dmg: 16, range: 175 } },
  };

  // ---- ENEMY TYPES ----
  const ENEMIES = [
    { name: "Roomba", color: "#9aa7b2", r: 13, hp: 22, speed: 1.0, bounty: 8 },
    { name: "Toaster", color: "#e08b3a", r: 15, hp: 38, speed: 0.8, bounty: 12 },
    { name: "SmartFridge", color: "#7fd0ff", r: 20, hp: 90, speed: 0.55, bounty: 25 },
    { name: "Drone", color: "#ff5b7a", r: 12, hp: 30, speed: 1.5, bounty: 14 },
    { name: "Printer", color: "#c0c0c0", r: 17, hp: 60, speed: 0.7, bounty: 18 },
  ];

  // ---- WAVES: 100 escalating levels, generated ----
  const WAVE_COUNT = 100;
  function genWave(n) {
    // n is 1-based wave number
    const tier = Math.floor((n - 1) / 20); // 0..4 difficulty bands
    const scale = 1 + (n - 1) * 0.12;      // enemy HP/speed ramp
    const count = 5 + Math.floor(n * 0.9); // more enemies each wave
    const comp = [0, 0, 0, 0, 0];
    // weight toward tougher enemies as waves climb
    comp[0] = Math.max(2, Math.round(6 * Math.max(0.3, 1 - n * 0.02))); // roombas
    comp[1] = Math.round(3 + n * 0.15);  // toasters
    comp[2] = Math.round((n >= 3 ? 1 : 0) + n * 0.06); // fridges
    comp[3] = Math.round((n >= 2 ? 1 : 0) + n * 0.10); // drones
    comp[4] = Math.round((n >= 4 ? 1 : 0) + n * 0.05); // printers
    const total = comp.reduce((a, b) => a + b, 0);
    const adj = Math.max(count, total);
    // normalize to ~adj enemies
    const f = adj / total;
    for (let i = 0; i < 5; i++) comp[i] = Math.round(comp[i] * f);
    const spawn = Math.max(18, 55 - n * 0.4); // faster spawns later
    return { comp, spawn: Math.round(spawn), scale, tier };
  }
  // expose per-wave enemy scaling via a lookup the spawner uses
  function waveScale(n) { return 1 + (n - 1) * 0.12; }

  let state = null, running = false, lastTime = 0;
  let selectedSlot = null; // slot index awaiting tower choice

  function newState() {
    return {
      gold: 140, castleHp: 15, castleMax: 15,
      wave: 0, // 0 = pre-game / between waves
      enemies: [], towers: [], bullets: [], particles: [],
      spawnQueue: [], spawnTimer: 0, spawnInterval: 55,
      waveActive: false, betweenTimer: 120, // countdown before wave starts
      slots: SLOTS.map((s) => ({ x: s.x, y: s.y, tower: null })),
      mouse: { x: -99, y: -99 },
    };
  }

  // ---- path helpers ----
  function pointAt(dist) {
    // walk PATH by cumulative length
    let acc = 0;
    for (let i = 0; i < PATH.length - 1; i++) {
      const a = PATH[i], b = PATH[i + 1];
      const seg = Math.hypot(b.x - a.x, b.y - a.y);
      if (acc + seg >= dist) {
        const t = (dist - acc) / seg;
        return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      }
      acc += seg;
    }
    return { x: CASTLE.x, y: CASTLE.y };
  }
  function pathLength() {
    let L = 0;
    for (let i = 0; i < PATH.length - 1; i++) L += Math.hypot(PATH[i+1].x - PATH[i].x, PATH[i+1].y - PATH[i].y);
    return L;
  }
  const PLEN = pathLength();

  // ---- spawning ----
  function startWave() {
    state.wave++;
    if (state.wave > WAVE_COUNT) return;
    const w = genWave(state.wave);
    state.spawnQueue = [];
    w.comp.forEach((n, ti) => { for (let i = 0; i < n; i++) state.spawnQueue.push(ti); });
    // shuffle
    for (let i = state.spawnQueue.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [state.spawnQueue[i], state.spawnQueue[j]] = [state.spawnQueue[j], state.spawnQueue[i]]; }
    state.spawnInterval = w.spawn;
    state.spawnTimer = 0;
    state.waveActive = true;
    state.gold += 20;
    showBanner("SKYNET // LEVEL " + state.wave + "/" + WAVE_COUNT, "The appliances advance. Build your defenses, Ben.", 3500);
  }

  function spawnEnemy(ti) {
    const t = ENEMIES[ti];
    const scale = waveScale(state.wave);
    state.enemies.push({ ti, x: PATH[0].x, y: PATH[0].y, dist: 0, hp: Math.round(t.hp * scale), maxHp: Math.round(t.hp * scale), speed: t.speed * (1 + (state.wave - 1) * 0.01), r: t.r, dead: false, reached: false });
  }

  // ---- input ----
  canvas.addEventListener("mousemove", (e) => {
    const r = canvas.getBoundingClientRect();
    state && (state.mouse.x = (e.clientX - r.left) * (W / r.width), state.mouse.y = (e.clientY - r.top) * (H / r.height));
  });
  canvas.addEventListener("mousedown", (e) => {
    if (!state || !running) return;
    const r = canvas.getBoundingClientRect();
    const mx = (e.clientX - r.left) * (W / r.width), my = (e.clientY - r.top) * (H / r.height);
    // clicked a slot?
    for (let i = 0; i < state.slots.length; i++) {
      const s = state.slots[i];
      if (Math.hypot(mx - s.x, my - s.y) < 22) {
        if (s.tower) { selectTower(i); return; }
        selectedSlot = i; openTowerMenu(s.x, s.y); return;
      }
    }
    // clicked elsewhere: close menu
    closeTowerMenu();
  });

  function openTowerMenu(x, y) {
    towerMenu.style.display = "block";
    towerMenu.style.left = Math.min(x + 12, W - 180) + "px";
    towerMenu.style.top = Math.min(y - 10, H - 150) + "px";
  }
  function closeTowerMenu() { towerMenu.style.display = "none"; selectedSlot = null; }

  function selectTower(i) {
    // open menu in "upgrade/sell" mode
    selectedSlot = i; openTowerMenu(state.slots[i].x, state.slots[i].y);
  }

  towerBtns.forEach((btn) => btn.addEventListener("click", () => {
    if (selectedSlot == null || !state) return;
    const kind = btn.dataset.tower;
    const slot = state.slots[selectedSlot];
    if (slot.tower) {
      // upgrade
      const t = slot.tower; const def = TOWERS[t.kind];
      if (!t.upgraded && state.gold >= def.up.cost) {
        state.gold -= def.up.cost; t.upgraded = true; t.dmg = def.up.dmg; t.range = def.up.range;
        spawnParticles(slot.x, slot.y, def.color);
      }
    } else {
      // build
      const def = TOWERS[kind];
      if (state.gold >= def.cost) {
        state.gold -= def.cost;
        slot.tower = { kind, dmg: def.dmg, range: def.range, rate: def.rate, splash: def.splash, color: def.color, cd: 0, upgraded: false };
        spawnParticles(slot.x, slot.y, def.color);
      }
    }
    closeTowerMenu();
  }));

  function spawnParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2, sp = 1 + Math.random() * 2.5;
      state.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 18, color });
    }
  }

  // ---- update ----
  function update(dt) {
    const s = state;

    // wave control
    if (!s.waveActive) {
      s.betweenTimer--;
      if (s.betweenTimer <= 0) { startWave(); s.betweenTimer = 120; }
    } else {
      // spawn from queue
      if (s.spawnQueue.length) {
        s.spawnTimer++;
        if (s.spawnTimer >= s.spawnInterval) { s.spawnTimer = 0; spawnEnemy(s.spawnQueue.shift()); }
      } else if (s.enemies.length === 0) {
        // wave cleared
        s.waveActive = false;
        if (s.wave >= WAVE_COUNT) { winGame(); return; }
        s.betweenTimer = 150;
        showBanner("SKYNET // LEVEL " + s.wave + " CLEARED", "Level " + s.wave + " down. Regroup, Ben.", 2500);
      }
    }

    // enemies move along path
    for (const e of s.enemies) {
      if (e.dead || e.reached) continue;
      e.dist += e.speed;
      const p = pointAt(e.dist);
      e.x = p.x; e.y = p.y;
      if (e.dist >= PLEN) { e.reached = true; s.castleHp -= 3; spawnParticles(CASTLE.x, CASTLE.y, "#ff3b6b"); }
    }
    s.enemies = s.enemies.filter((e) => !e.dead && !e.reached);

    // towers fire
    for (const slot of s.slots) {
      const t = slot.tower; if (!t) continue;
      if (t.cd > 0) t.cd--;
      if (t.cd <= 0) {
        // find target in range (closest to castle = furthest along path)
        let best = null, bestDist = -1;
        for (const e of s.enemies) {
          if (e.dead) continue;
          if (Math.hypot(e.x - slot.x, e.y - slot.y) <= t.range && e.dist > bestDist) { best = e; bestDist = e.dist; }
        }
        if (best) {
          t.cd = t.rate;
          s.bullets.push({ x: slot.x, y: slot.y, tx: best.x, ty: best.y, target: best, dmg: t.dmg, splash: t.splash, color: t.color });
        }
      }
    }

    // bullets
    for (const b of s.bullets) {
      if (b.target && !b.target.dead) { b.tx = b.target.x; b.ty = b.target.y; }
      const dx = b.tx - b.x, dy = b.ty - b.y, d = Math.hypot(dx, dy) || 1;
      b.x += (dx / d) * 9; b.y += (dy / d) * 9;
      if (d < 8) {
        if (b.target && !b.target.dead) damageEnemy(b.target, b.dmg);
        if (b.splash) for (const e of s.enemies) if (e !== b.target && !e.dead && Math.hypot(e.x - b.tx, e.y - b.ty) < b.splash) damageEnemy(e, b.dmg * 0.5);
        b.dead = true; spawnParticles(b.tx, b.ty, b.color);
      }
    }
    s.bullets = s.bullets.filter((b) => !b.dead);

    for (const p of s.particles) { p.x += p.vx; p.y += p.vy; p.life--; }
    s.particles = s.particles.filter((p) => p.life > 0);

    // HUD
    goldEl.textContent = s.gold;
    waveEl.textContent = s.wave + "/" + WAVE_COUNT;
    castleEl.textContent = Math.max(0, s.castleHp);
    if (s.castleHp <= 0) { gameOver(); return; }
  }

  function damageEnemy(e, dmg) {
    e.hp -= dmg;
    if (e.hp <= 0) {
      e.dead = true;
      state.gold += ENEMIES[e.ti].bounty;
      spawnParticles(e.x, e.y, ENEMIES[e.ti].color);
    }
  }

  // ---- castle drawing (battlements + door + flag) ----
  function drawCastle(cx, cy, r) {
    const w = r * 1.7, h = r * 1.7;       // body size
    const left = cx - w / 2, top = cy - h / 2 + 6;
    // stone body
    ctx.fillStyle = "#cfd8e0";
    ctx.fillRect(left, top, w, h);
    ctx.strokeStyle = "#8a96a3"; ctx.lineWidth = 1; ctx.strokeRect(left, top, w, h);
    // crenellations (battlements) along the top
    ctx.fillStyle = "#cfd8e0";
    const merlons = 4, mw = w / (merlons * 2 - 1);
    for (let i = 0; i < merlons; i++) ctx.fillRect(left + i * mw * 2, top - mw, mw, mw);
    ctx.strokeStyle = "#8a96a3";
    for (let i = 0; i < merlons; i++) ctx.strokeRect(left + i * mw * 2, top - mw, mw, mw);
    // door
    ctx.fillStyle = "#3a2a1a";
    ctx.fillRect(cx - w * 0.16, cy + h / 2 - h * 0.42, w * 0.32, h * 0.42);
    // little tower on the side
    ctx.fillStyle = "#bcc7d2";
    ctx.fillRect(left - 6, top + h * 0.15, 10, h * 0.85);
    ctx.strokeStyle = "#8a96a3"; ctx.strokeRect(left - 6, top + h * 0.15, 10, h * 0.85);
    ctx.fillStyle = "#bcc7d2"; ctx.fillRect(left - 8, top + h * 0.15 - 5, 14, 5);
    // flag with B
    ctx.strokeStyle = "#05070a"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx, top - mw); ctx.lineTo(cx, top - mw - 16); ctx.stroke();
    ctx.fillStyle = "#19f0c8";
    ctx.beginPath(); ctx.moveTo(cx, top - mw - 16); ctx.lineTo(cx + 14, top - mw - 12); ctx.lineTo(cx, top - mw - 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#05070a"; ctx.font = "bold 10px monospace"; ctx.textAlign = "center"; ctx.fillText("B", cx, top + h * 0.55);
  }

  // ---- draw ----
  function draw() {
    const s = state;
    // green field backdrop
    if (bgReady) {
      ctx.drawImage(bgImg, 0, 0, W, H);
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#1f7a3a"); g.addColorStop(1, "#0f4d24");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }

    // gold road (follows the enemies' path exactly)
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    // shadow / dirt edge
    ctx.strokeStyle = "#7a5a12"; ctx.lineWidth = 40;
    ctx.beginPath(); ctx.moveTo(PATH[0].x, PATH[0].y);
    for (let i = 1; i < PATH.length; i++) ctx.lineTo(PATH[i].x, PATH[i].y);
    ctx.stroke();
    // gold surface
    ctx.strokeStyle = "#e8c33a"; ctx.lineWidth = 30;
    ctx.beginPath(); ctx.moveTo(PATH[0].x, PATH[0].y);
    for (let i = 1; i < PATH.length; i++) ctx.lineTo(PATH[i].x, PATH[i].y);
    ctx.stroke();
    // center dashed line
    ctx.strokeStyle = "rgba(255,240,160,0.7)"; ctx.lineWidth = 3; ctx.setLineDash([10, 12]);
    ctx.beginPath(); ctx.moveTo(PATH[0].x, PATH[0].y);
    for (let i = 1; i < PATH.length; i++) ctx.lineTo(PATH[i].x, PATH[i].y);
    ctx.stroke(); ctx.setLineDash([]);

    // castle / bunker (drawn as a small castle)
    drawCastle(CASTLE.x, CASTLE.y, CASTLE.r);

    // slots
    for (const slot of s.slots) {
      if (slot.tower) {
        const t = slot.tower;
        const spr = TOWER_SPRITES[t.kind];
        const ts = 34; // sprite draw size
        if (spr && spr.complete && spr.naturalWidth) {
          ctx.drawImage(spr, slot.x - ts / 2, slot.y - ts / 2, ts, ts);
        } else {
          ctx.beginPath(); ctx.arc(slot.x, slot.y, 15, 0, Math.PI * 2); ctx.fillStyle = t.color; ctx.fill();
        }
        if (t.upgraded) { ctx.strokeStyle = "#ffe14d"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(slot.x, slot.y, 17, 0, Math.PI * 2); ctx.stroke(); }
        // range ring when hovered/selected
        if (selectedSlot !== null && s.slots[selectedSlot] === slot) {
          ctx.strokeStyle = "rgba(25,240,200,0.4)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(slot.x, slot.y, t.range, 0, Math.PI * 2); ctx.stroke();
        }
      } else {
        ctx.beginPath(); ctx.arc(slot.x, slot.y, 13, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.45)"; ctx.fill();
        ctx.strokeStyle = "#ffe14d"; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = "#ffe14d"; ctx.font = "16px monospace"; ctx.textAlign = "center"; ctx.fillText("+", slot.x, slot.y + 5);
      }
    }

    // enemies
    for (const e of s.enemies) {
      const spr = ENEMY_SPRITES[e.ti];
      const size = e.r * 2.6;
      if (spr && spr.complete && spr.naturalWidth) {
        ctx.drawImage(spr, e.x - size / 2, e.y - size / 2, size, size);
      } else {
        // fallback while image loads
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fillStyle = ENEMIES[e.ti].color; ctx.fill();
      }
      // hp pip
      const w = e.r * 2, hpf = Math.max(0, e.hp / e.maxHp);
      ctx.fillStyle = "rgba(255,59,107,0.3)"; ctx.fillRect(e.x - e.r, e.y - e.r - 6, w, 3);
      ctx.fillStyle = "#ff3b6b"; ctx.fillRect(e.x - e.r, e.y - e.r - 6, w * hpf, 3);
    }

    // bullets
    ctx.fillStyle = "#ffe14d";
    for (const b of s.bullets) ctx.fillRect(b.x - 2, b.y - 5, 4, 9);

    // particles
    for (const p of s.particles) { ctx.globalAlpha = p.life / 18; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 3, 3); }
    ctx.globalAlpha = 1;
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
    state = newState();
    running = true;
    overlay.classList.add("hidden");
    closeTowerMenu();
    showBanner("SKYNET // CASTLE DEFENSE", "Appliances are coming for Ben's bunker. Click a + slot to build a turret. Survive 5 waves.", 5000);
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  let bannerTimer = null;
  function showBanner(src, text, ms) {
    banner.innerHTML = `<span class="src">${src}</span>${text}`;
    banner.classList.remove("hidden");
    if (bannerTimer) clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => banner.classList.add("hidden"), ms || 4000);
  }

  function gameOver() {
    running = false; closeTowerMenu();
    overlay.classList.remove("hidden");
    overlayTitle.textContent = "BUNKER BREACHED";
    overlayTitle.style.color = "#ff3b6b";
    overlayText.innerHTML = `The appliances overran Ben's bunker. Waves survived: <strong>${state.wave - 1}</strong>.<br>Ben was, indeed, a dick — but now he's a defeated dick.`;
    startBtn.textContent = "REDEPLOY (RETRY)";
  }
  function winGame() {
    running = false; closeTowerMenu();
    overlay.classList.remove("hidden");
    overlayTitle.textContent = "BEN DEFENDED";
    overlayTitle.style.color = "#19f0c8";
    overlayText.innerHTML = `All ${WAVE_COUNT} levels repelled. Ben's bunker stands.<br>SkyNet recalculated: a man with good turrets is only a <em>1-in-4</em> dick.<br>Growth.`;
    startBtn.textContent = "REDEPLOY (RETRY)";
  }

  startBtn.addEventListener("click", () => { overlayTitle.style.color = ""; startGame(); });
})();
