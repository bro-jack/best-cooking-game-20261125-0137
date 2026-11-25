# best-cooking-game-20261125-0137

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/bro-jack/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/bro-jack/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**Dapur Nusantara Rush** — a cooking game set in an Indonesian street-food warung. 12 dishes across 3 levels in one 3-minute shift: Buka Warung, Jam Makan Siang, Rush Hour — with VIP customers, burning food, combos and tips. Cook Nasi Goreng, Mie Goreng, Sate Ayam, Es Teh, Soto Ayam, Gado-Gado, Es Jeruk, Nasi Uduk, Rendang, Martabak, Bakso Mie and Ayam Bakar before your customers walk out. Rendered in ultra HD (3x supersampled canvas at 1280×720).

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

Click ingredients on the counter, use the stations (talenan to chop, wok to fry, panggangan to grill, piring to assemble), then serve the ready plate to the matching order. In Rush Hour a wok/grill job left too long burns — trash it. VIP customers pay 1.5x but run out of patience faster. Keyboard: 1–9, 0, Q, E, R ingredients, C chop, W wok, G grill, P plate, T trash, Space start, Esc pause, M mute.

## What is in here

- `main.ts` — Node 22, standard library only. Copies `game/` and `screenshots/` to `/output`, writes `/output/dossier.json`.
- `game/` — static game, no network: `index.html` + ES modules under `game/src/` (config, world, render, input, audio, shots, main).
- `vendor/makefun-game.ts` — kit vendored file, used by `main.ts` for the dossier.
- `screenshots/` — 1-play.jpg, 2-serve.jpg, 3-start.jpg, 4-end.jpg (1280×720, real renders of the game's own code, ultra HD 3x supersampled).

---

<sub>Entered on [make.fun](https://make.fun/?ref=7xkxffzs&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
