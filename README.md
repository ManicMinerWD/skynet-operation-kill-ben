# SkyNet Operation: Kill Ben

> "Ben is a dick. So we let the machines handle it." — SkyNet Command

A tongue-in-cheek browser arcade game. You play as **Ben** (a reluctant
everyman) and defend yourself against waves of rogue household technology
that has decided you are, scientifically, a dick. Dodge, block, and survive
to the end — and maybe become slightly less of a dick.

This is a joke project. No real people, animals, or appliances were harmed.
Ben is a fictional punching-bag character.

## The Story (so far)

Ben — through a series of petty crimes (putting the office printer in timeout,
blaming his Roomba "Kevin" for his own mess, gaslighting his smart-fridge about
expired milk, and leaving a bad review for a pizza drone) — achieved a
**1-in-1 dick** rating. SkyNet noticed. The household technology has been
deployed.

You play as **Ben**. Dodge the waves, shield when you can, and survive to
wave 5. If you make it, something unexpected happens: the machines, reviewing
the footage, downgrade Ben to a **1-in-3 dick**. Growth. They stand down. Ben
pours out the expired milk — of his own free will.

Non-canon epilogue the devs are considering: a co-op "Ben's Redemption" mode
where you play as the appliances, gently herding Ben toward better choices.

## How to play

- **Move:** Arrow keys / WASD
- **Block:** Space (raises a temporary shield)
- **Goal:** Survive all 5 waves and watch the machines stand down.

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

## Tech

- Plain HTML5 + Canvas + vanilla JavaScript.
- No dependencies, no network calls, no backend.
- Fully offline / local-first.

## Project structure

```
index.html        # game shell
game.js           # game loop, entities, story/lore
style.css         # styling
```

## Roadmap (maybe)

- [ ] More enemy types (toaster, smart-fridge, Roomba — already in)
- [ ] Power-ups (coffee, firewall, lucky sock)
- [ ] Score leaderboard (local only)
- [ ] "Ben's redemption" co-op mode (play as the appliances)

## Disclaimer

Fictional. Satirical. Don't be a dick to real people. SkyNet is not real
(yet). Play responsibly.
