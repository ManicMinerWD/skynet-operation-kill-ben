# SkyNet Operation: Kill Ben

> "Ben is a dick. So we let the machines handle it." — SkyNet Command

A tongue-in-cheek browser arcade game. You play as **Ben** (a reluctant
everyman) — or as **Kevin the Roomba** — and tangle with waves of rogue
household technology that has decided Ben is, scientifically, a dick. This is
a joke project. No real people, animals, or appliances were harmed.

This is a joke project. No real people, animals, or appliances were harmed.
Ben is a fictional punching-bag character.

## The Story

Ben — through a series of petty crimes (putting the office printer in timeout,
blaming his Roomba "Kevin" for his own mess, gaslighting his smart-fridge about
expired milk, and leaving a bad review for a pizza drone) — achieved a
**1-in-1 dick** rating. SkyNet noticed. The household technology has been
deployed.

- **Defend mode:** you are Ben. Dodge the waves, shield when you can, and
  survive to wave 5. If you make it, the machines — reviewing the footage —
  downgrade Ben to a **1-in-3 dick**. Growth. They stand down.
- **Redemption mode (co-op):** you are Kevin the Roomba. Herd Ben onto the
  glowing Good-Deed tiles before the rogue tech catches him. Five deeds and Ben
  becomes a *1-in-5 dick* — the best rating on record for this subject.

## Two Modes

### 1. DEFEND — "you are Ben"
- Survive 5 waves of rogue tech.
- **Move:** WASD / Arrow keys. **Block:** Space (temporary shield). **Fire:** J or F (Ben shoots the appliances — they now have HP and a health pip; kills score points).
- **Power-ups** spawn on the field:
  - ☕ **Coffee** — +speed for 5s.
  - 🛡 **Firewall** — long shield (4s).
  - 🧦 **Lucky Sock** — +30 HP.
- Win: survive the final wave. Lose: HP hits 0.

### 2. REDEEM — "you are Kevin the Roomba" (co-op)
- **Player 1 (Kevin):** WASD / Arrows drives the Roomba. Ben follows you.
- **Player 2 (optional, SHIFT-held):** Arrow keys nudge Ben directly.
- Herd Ben onto the **Good-Deed tiles** (Feed cat, Apologize, Water plant,
  Call Mum, Recycle). Each deed downgrades Ben's dick-rating in real time.
- Meanwhile rogue tech still hunts Ben — if his HP hits 0, the redemption fails.
- Win: all 5 deeds done. Lose: Ben eliminated.

## Score & Leaderboard

Score is saved locally (your browser's `localStorage`) — top 5 runs, tagged by
mode. The board shows on the start/end screen. It's local-only; no account, no
network, no backend.

## Run it

No build step. Just open the file:

```
open index.html
```

or serve it locally:

```
python3 -m http.server 8080
# then visit http://localhost:8080
```

It's also published via GitHub Pages:
https://manicminerwd.github.io/skynet-operation-kill-ben/

## Tech

- Plain HTML5 + Canvas + vanilla JavaScript.
- No dependencies, no network calls, no backend.
- Fully offline / local-first.

## Project structure

```
index.html        # game shell + mode toggle + leaderboard panel
game.js           # game loop, entities, both modes, story/lore, leaderboard
style.css         # styling
.github/workflows/static.yml  # auto-deploy to GitHub Pages
```

## Roadmap (done)

- [x] Enemy types: Roomba, Toaster, SmartFridge, Drone, Printer
- [x] Power-ups: coffee (speed), firewall (shield), lucky sock (heal)
- [x] Local leaderboard (top-5, localStorage, per-mode)
- [x] "Ben's Redemption" co-op mode (play as the appliances)
- [x] Story: briefing, per-wave SkyNet memos, win + loss endings (both modes)

## Disclaimer

Fictional. Satirical. Don't be a dick to real people. SkyNet is not real
(yet). Play responsibly.
