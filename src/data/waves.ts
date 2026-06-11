import type { TimedEvent, WavePhase } from '../types';
import { RUN } from '../config';

/**
 * Spawn timeline. Each phase is active from tStart until the next one.
 * Weights pick which enemy spawns; spawnInterval + maxAlive set the pressure.
 */
export const WAVE_PHASES: WavePhase[] = [
  { tStart: 0,   spawnIntervalMs: 800, maxAlive: 35,  pool: [{ type: 'skeleton', weight: 7 }, { type: 'imp', weight: 3 }] },
  { tStart: 45,  spawnIntervalMs: 650, maxAlive: 55,  pool: [{ type: 'skeleton', weight: 6 }, { type: 'imp', weight: 5 }] },
  { tStart: 90,  spawnIntervalMs: 540, maxAlive: 75,  pool: [{ type: 'skeleton', weight: 5 }, { type: 'imp', weight: 4 }, { type: 'zombie', weight: 3 }] },
  { tStart: 150, spawnIntervalMs: 460, maxAlive: 100, pool: [{ type: 'imp', weight: 4 }, { type: 'zombie', weight: 4 }, { type: 'spider', weight: 3 }] },
  { tStart: 210, spawnIntervalMs: 410, maxAlive: 125, pool: [{ type: 'zombie', weight: 4 }, { type: 'spider', weight: 4 }, { type: 'skeleton', weight: 3 }, { type: 'cultist', weight: 2 }] },
  { tStart: 270, spawnIntervalMs: 370, maxAlive: 145, pool: [{ type: 'spider', weight: 4 }, { type: 'ghost', weight: 3 }, { type: 'zombie', weight: 3 }, { type: 'cultist', weight: 2 }] },
  { tStart: 330, spawnIntervalMs: 330, maxAlive: 165, pool: [{ type: 'ghost', weight: 4 }, { type: 'spider', weight: 3 }, { type: 'cultist', weight: 3 }, { type: 'brute', weight: 1 }] },
  { tStart: 420, spawnIntervalMs: 295, maxAlive: 190, pool: [{ type: 'ghost', weight: 4 }, { type: 'zombie', weight: 4 }, { type: 'cultist', weight: 3 }, { type: 'brute', weight: 2 }] },
  { tStart: 510, spawnIntervalMs: 270, maxAlive: 215, pool: [{ type: 'spider', weight: 4 }, { type: 'ghost', weight: 4 }, { type: 'brute', weight: 2 }, { type: 'cultist', weight: 3 }] },
  { tStart: 600, spawnIntervalMs: 245, maxAlive: 235, pool: [{ type: 'ghost', weight: 4 }, { type: 'brute', weight: 3 }, { type: 'spider', weight: 4 }, { type: 'cultist', weight: 3 }] },
  { tStart: 660, spawnIntervalMs: 225, maxAlive: 250, pool: [{ type: 'brute', weight: 3 }, { type: 'ghost', weight: 4 }, { type: 'imp', weight: 4 }, { type: 'cultist', weight: 3 }] },
  /* after the Reaper spawns the pressure eases off slightly so the duel is readable */
  { tStart: RUN.WIN_TIME, spawnIntervalMs: 450, maxAlive: 130, pool: [{ type: 'ghost', weight: 4 }, { type: 'brute', weight: 2 }, { type: 'spider', weight: 3 }] }
];

/** One-off scripted moments. kind 'ring' = circle of enemies closing in. */
export const TIMED_EVENTS: TimedEvent[] = [
  { t: 60, kind: 'ring', type: 'imp', count: 28 },
  { t: 120, kind: 'elite', type: 'zombie' },
  { t: 180, kind: 'elite', type: 'spider' },
  { t: RUN.BOSS_1_AT, kind: 'boss', type: 'boss_colossus' },
  { t: 300, kind: 'ring', type: 'spider', count: 32 },
  { t: 330, kind: 'elite', type: 'cultist' },
  { t: 390, kind: 'elite', type: 'brute' },
  { t: 450, kind: 'swarm', type: 'imp', count: 48 },
  { t: RUN.BOSS_2_AT, kind: 'boss', type: 'boss_witch' },
  { t: 540, kind: 'elite', type: 'ghost' },
  { t: 600, kind: 'ring', type: 'ghost', count: 28 },
  { t: 630, kind: 'elite', type: 'brute' },
  { t: 690, kind: 'swarm', type: 'spider', count: 44 },
  { t: RUN.WIN_TIME, kind: 'boss', type: 'boss_reaper' }
];

/** fresh copy for a new run (events carry a runtime `fired` flag) */
export function freshEvents(): TimedEvent[] {
  return TIMED_EVENTS.map(e => ({ ...e, fired: false }));
}
