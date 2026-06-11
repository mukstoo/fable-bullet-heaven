# Decisions log

## 2026-06-11 — initial one-shot build (Claude Fable 5)

- **Stack: Phaser 3.90 + TS strict + Vite 7.** Phaser 4.1 exists but 3.x is the
  battle-tested line the `phaser-game` skill targets; 3.90 is the latest 3.x. Vite 8 was
  freshly released → pinned Vite 7 (stable) to de-risk a one-shot. TS 6 exists → same call, ^5.9.
- **Repo name = folder name (`fable-bullet-heaven`), game has its own title (GRAVEHORDE).**
  Keeps provenance obvious; the game can be renamed without touching the repo.
- **Art: Kenney "Tiny Dungeon" (CC0) + procedural glow.** No skeleton sprite in the pack, so
  the bestiary leans rats/oozes/wraiths instead. Bullets/gems/FX/icons are generated at boot
  (canvas radial gradients + Graphics) — they look better glowing than static pixels, and they
  dodge licensing entirely. Asset URLs researched+verified by a Sonnet subagent (see CREDITS.md).
- **Frame indices mapped by eye** from a labeled contact sheet (PIL upscale, tmp/) and
  centralized in `src/data/frames.ts`.
- **12-minute run** (VS does 30) — right scope for a one-shot demo; bosses at 4/8/12,
  victory = killing the 12:00 Reaper, who enrages 90s after spawning to prevent stalling.
- **One pausable run-clock** (`GameScene.runTime`) for all gameplay timing. Phaser's `time`
  keeps flowing during scene pause; mixing clocks desyncs cooldowns vs. level-up pauses.
- **Pooling everywhere; loot has no physics bodies** — gems/pickups use distance checks in one
  pass (cheaper than 300 arcade bodies and good enough).
- **Enemy separation via a single self-collider** on the enemy group: acceptable at the
  ~240-alive cap (57+ FPS measured with 188 + boss).
- **Event-driven one-shot keys.** Phaser `Key.onUp` clears the `_justDown` latch, so
  keydown+keyup arriving in one input flush (fast taps, automated input) make
  `JustDown()` polling drop the press. Movement stays polled (held keys are fine).
  Found via instrumented Playwright probes against `node_modules/phaser` source.
- **Test hooks**: `window.__gravehorde` (game handle) + `window.__ghMove` (move override).
  Used by the autonomous playtest bot (threat-repulsion + gem-attraction steering installed
  via Playwright `evaluate`, auto-picks upgrade card 0, logs hp/level/kills/fps every 5s).
- **Git: worked on `feat/game`, merged to `main` for Pages deploys.** User pre-authorized
  pushes in the kickoff prompt.

## Known trade-offs (deliberate)

- Single playable character; no meta-progression shop (gold is score for now) — time-boxed.
- No mobile/touch controls — desktop keyboard game.
- `LevelUpScene` receives a `pick` callback via scene data — simple, works; an event bus
  would be cleaner if scenes multiply.
