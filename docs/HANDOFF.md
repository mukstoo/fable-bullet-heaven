# HANDOFF — GRAVEHORDE

_Last update: 2026-06-11, end of one-shot build session (Claude Fable 5)_

## Next session starts here

1. **Rodrigo owes playtest feedback** — the game has never been played by a human.
   Expect a balance v4 from his impressions (all knobs: `src/config.ts`, `src/data/*`).
2. Feature shortlist ranked by fun-per-effort in my final analysis: **meta-progression
   gold shop** (gold already counted+saved, just unspendable) → **weapon evolutions**
   (maxed weapon + matching passive → evolved form via boss chest) → **2–3 more playable
   characters** (sprites already in the tilemap, frames 84–112) → more mid-run events.
3. `docs/setup-review.md` has tooling/skill improvement proposals for Rodrigo's global
   CC setup — implement only what he approves.
4. Build cost reference: ~1h22m wall clock, ~775k output tokens (~$153 API-equivalent).

## State: SHIPPED ✅

- **Live**: https://mukstoo.github.io/fable-bullet-heaven/
- **Repo**: https://github.com/mukstoo/fable-bullet-heaven (`main` = deployed, `feat/game` = working branch, merged)
- `npm run build` green (tsc strict + vite). Verified in real Chrome via Playwright, local + production.

## What this is

Complete, playable dark-fantasy bullet-heaven: 12-minute runs, 6 weapons × 5 levels,
8 passives, 7 enemy types + elites + 3 bosses, level-up draft UI, pickups/chests,
title/pause/game-over/victory screens, SFX + 2 music tracks, localStorage bests.
All CC0/OFL assets, credited in CREDITS.md. Architecture notes in README + CLAUDE.md.

## How it was verified (no human played it yet!)

- Playwright drove real runs: title → run → level-up picks → pause → death → victory(forced reaper kill) → restart.
- Perf: 57+ FPS with 188 enemies + boss + full arsenal (pooling works).
- An **autonomous bot** (threat-repulsion steering via the `__ghMove` hook, auto-picking
  card 0) played the real curve; its hp/level/kills timeline drove balance v2/v3:
  - v2: spawn density +~35%, i-frames 600→350ms, dmg growth 6→8%/min, softer xp curve,
    nova/orbital knockback cut (they perma-juggled melee enemies out of contact).
  - v3: contact tick 700→550ms, arc knockback trimmed, more cultists mid-game
    (ranged units are the anti-turtle pressure; wraiths ignore knockback for the same reason).
- Known bot-test artifact: bot kites near-optimally, so "bot never dies" ≠ "too easy" —
  organic stand-still deaths confirmed the fail state works.

## The one tricky bug (worth remembering)

Pause/mute keys silently failed: Phaser `Key.onUp` wipes `_justDown`, so when
keydown+keyup land in the same input flush (fast taps, all synthetic/CDP input),
`JustDown()` polling never sees the press. Fix: event-driven `keyboard.on('keydown-X')`
for one-shot actions; polling only for held movement. Documented in CLAUDE.md hard rules.

## If you continue this project

1. Read CLAUDE.md (hard rules: config/data-driven balance, pooling, runTime clock, key events).
2. `npm run dev`, then drive with the bot pattern from docs/decisions.md if balancing.
3. Next-feature shortlist is in docs/TODO.md (meta progression shop is the natural #1 —
   gold is already counted+saved, just unspendable).
4. Deploys are automatic on push to `main`.

## Loose ends (cosmetic, non-blocking)

- `tmp/` holds asset-pack downloads + the labeled tilemap contact sheet (gitignored, deletable).
- Playwright screenshots from verification live untracked in repo root / `.playwright-mcp/` (gitignored).
- The `Tiny Town` Kenney pack URL was researched but never needed/downloaded.
