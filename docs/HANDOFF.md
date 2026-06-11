# HANDOFF — GRAVEHORDE

_Last update: 2026-06-11 evening session (Claude Fable 5): Crypt Shop + weapon evolutions_

## Next session starts here

1. **Rodrigo still owes first human playtest feedback.** Now doubly relevant: the shop
   cost curve (~1550 gold total, ~50–120 earned/run) and evolved-weapon power are
   bot-balanced guesses. Knobs: `src/config.ts`, `src/data/meta.ts`, `src/data/weapons.ts`.
2. Feature shortlist (ranked): **2nd playable character** (sprites in tilemap frames
   84–112; needs a character-select + per-character starting weapon/stat spread) →
   **treasure goblin event** (Tomb Mimic frame 92; gold synergy with the shop) →
   volume sliders → touch controls.
3. `docs/setup-review.md` has tooling proposals for Rodrigo's global CC setup — only
   implement what he approves.

## State: SHIPPED ✅ (v2 — meta-progression update)

- **Live**: https://mukstoo.github.io/fable-bullet-heaven/
- **Repo**: https://github.com/mukstoo/fable-bullet-heaven (`main` = deployed, `feat/game` = working branch)
- `npm run build` green (tsc strict + vite). Verified in real Chrome via Playwright.

## What this is

Complete dark-fantasy bullet-heaven: 12-minute runs, 6 weapons × 5 levels **+ a level-6
evolution each**, 8 passives, 7 enemy types + elites + 3 bosses, level-up draft,
pickups/chests, **Crypt Shop meta-progression** (banked gold → 8 permanent upgrades incl.
a once-per-run revive), title/pause/game-over/victory/shop screens, SFX + 2 music tracks,
localStorage save. All CC0/OFL assets credited in CREDITS.md.

## This session's additions (2026-06-11 evening)

- **Crypt Shop** (`src/scenes/ShopScene.ts` + `src/data/meta.ts`): gold now banks on run
  end; 4×2 card grid, keyboard + mouse; buys persist immediately. Entry: Title `[S]` /
  GameOver `[S]`. Meta stats stack in `RunState.recompute()` before passives.
  Gravewalker's Pact = revive at half HP + repel shockwave (logic in `hurtPlayer`).
- **Weapon evolutions** (`evolution` blocks in `src/data/weapons.ts`): maxed weapon +
  matching passive + boss chest → weapon level 6 via `weaponLevelFor()`. Chest evolution
  takes priority over the random chest upgrade. Pairings: spark+power, arc+haste,
  axes+vitality, orbitals+swiftness, nova+shield, storm+echo. One-time "thirsts — slay a
  boss!" hint when eligible; HUD marks evolved icons with gold border + `E`.
- Both features Playwright-verified end-to-end (buy → persist → stats apply → revive →
  death → bank → re-enter shop; evolve → no double-evolve → evolved visuals/stats).

## How it was verified (still no human player!)

- Playwright: shop purchase loop with localStorage assertions; forced revive + death;
  forced evolutions via `__gravehorde` handle (`gs.openChest()` after setting build).
- Earlier sessions: autonomous kiting bot over the full 12-min curve (pattern in
  docs/decisions.md), 57+ FPS at 188 enemies.

## Gotchas worth remembering

- One-shot keys must be **event-driven** (`keydown-X`), never `JustDown` polling (fast
  taps wipe the latch) — documented in CLAUDE.md hard rules.
- All gameplay timing runs on `GameScene.runTime` (pausable clock), never `time`/`now()`.
- `run.gold` is **fractional** internally (gold multiplier); floor at display/bank.
- Title screen's global "click to fight" vs. shop button: object handlers fire first;
  the shop button calls `event.stopPropagation()`.

## Loose ends (cosmetic, non-blocking)

- `tmp/` holds asset-pack downloads + labeled contact sheet (gitignored, deletable).
- Playwright verify-*.jpeg screenshots in repo root are untracked debris — delete freely.
