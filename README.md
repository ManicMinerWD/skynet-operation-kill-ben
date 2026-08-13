# SkyNet Operation: Kill Ben — Castle Defense

> "Ben is a dick. So we let the machines handle it." — SkyNet Command

A tongue-in-cheek **castle-defense** game (Kingdom-Rush-lite) built on the same
Ben/skynet joke. Rogue household appliances march a path toward **Ben's bunker**.
You build turrets from household gear, spend gold, and survive 5 waves.

This is a joke project. No real people, animals, or appliances were harmed.
Ben is a fictional punching-bag character.

## Premise

SkyNet has deployed the appliances. They're done asking nicely. Roombas,
toasters, smart-fridges, delivery drones, and jammed printers are converging on
Ben's bunker. Your job: turn Ben's own gadgets against the siege.

## How to play

- **Build:** click a dashed **+** slot (beside the path) to open the build menu,
  then pick a turret. Click a built turret to **upgrade** it (gold cost).
- **Economy:** you start with 140 gold. Each level grants +20. Every appliance you
  destroy drops a bounty. Turrets cost gold; upgrades cost more.
- **Castle HP:** Ben's bunker has 15 HP. Each appliance that reaches the bunker
  costs 3 HP. At 0 → game over.
- **Win:** clear all **100 levels** with the bunker standing. Enemies scale up
  every level (more HP, faster, more of them, tougher types appear later).

### Turrets

| Turret | Cost | Role |
|--------|------|------|
| **Toaster Turret** | 50 | Cheap, fast fire, low damage. Great vs swarms. |
| **Fridge Mortar** | 90 | Slow, heavy splash damage. Great vs clumps. |
| **Drone Sentry** | 70 | Precise, medium damage, long range. |

Each turret upgrades once (click it again) for more damage + range.

### Enemies

Roomba (weak, fast), Toaster, SmartFridge (tanky), Drone (fast), Printer (tanky).
Later waves mix them and arrive faster.

## Controls

- **Mouse:** click slots to build/upgrade, click menu buttons to choose turrets.
- No keyboard needed. (The "Ben runs around" and "Roomba herding" modes were
  retired — this is purely a tower-defense game now.)

## Run it

No build step. Just open the file:

```
open index.html
```

or serve locally:

```
python3 -m http.server 8080
# then visit http://localhost:8080
```

Also published via GitHub Pages:
https://manicminerwd.github.io/skynet-operation-kill-ben/

## Tech

- Plain HTML5 + Canvas + vanilla JavaScript.
- No dependencies, no network calls, no backend. Fully offline / local-first.

## Project structure

```
index.html   # game shell + HUD + build menu
game.js      # castle-defense: pathing, towers, economy, waves, win/lose
style.css    # styling
.github/workflows/static.yml  # auto-deploy to GitHub Pages
```

## Disclaimer

Fictional. Satirical. Don't be a dick to real people. SkyNet is not real (yet).
