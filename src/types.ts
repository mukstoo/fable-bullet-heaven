/** Shared type definitions for GRAVEHORDE. Pure types — no Phaser imports. */

export type WeaponId =
  | 'spark'
  | 'arc'
  | 'axes'
  | 'orbitals'
  | 'nova'
  | 'storm';

export type PassiveId =
  | 'power'
  | 'haste'
  | 'vitality'
  | 'swiftness'
  | 'lantern'
  | 'shield'
  | 'bloodpact'
  | 'echo';

export type EnemyTypeId =
  | 'imp'
  | 'skeleton'
  | 'zombie'
  | 'spider'
  | 'ghost'
  | 'cultist'
  | 'brute'
  | 'boss_colossus'
  | 'boss_witch'
  | 'boss_reaper';

/** Per-level tunables of one weapon. Index 0 = level 1. */
export interface WeaponLevel {
  damage: number;
  cooldownMs: number;
  /** projectiles per volley / blades / strikes / swings */
  amount: number;
  /** radius or arc size where it applies */
  area: number;
  /** projectile flight speed where it applies */
  speed: number;
  /** enemies a projectile can pass through (where it applies) */
  pierce: number;
  /** knockback impulse applied to enemies hit */
  knockback: number;
}

export interface WeaponDef {
  id: WeaponId;
  name: string;
  desc: string;
  /** texture key for the upgrade-card / HUD icon */
  icon: string;
  levels: WeaponLevel[]; // length = max level
}

export interface PassiveDef {
  id: PassiveId;
  name: string;
  desc: string;
  icon: string;
  maxLevel: number;
  /** applies one level of this passive onto mutable stats */
  apply: (stats: PlayerStats) => void;
}

export interface EnemyDef {
  id: EnemyTypeId;
  name: string;
  texture: string;
  hp: number;
  speed: number;
  /** contact damage per hit */
  damage: number;
  xp: number;
  /** collision/body radius in px (world scale) */
  radius: number;
  /** display scale multiplier over base sprite size */
  scale: number;
  /** 0..1 resistance to knockback (1 = immune) */
  knockbackResist: number;
  tint?: number;
  /** ranged attacker config */
  ranged?: { intervalMs: number; range: number; keepDistance: number; projSpeed: number; projDamage: number };
  /** ghosts drift through in straight lines and fade */
  drifter?: boolean;
  boss?: boolean;
}

export interface PlayerStats {
  maxHp: number;
  regenPerSec: number;
  moveSpeed: number;
  magnetRadius: number;
  armor: number;
  damageMult: number;
  cooldownMult: number; // multiplier on cooldowns (lower = faster)
  areaMult: number;
  projSpeedMult: number;
  amountBonus: number; // flat extra projectiles
}

/** One entry of the spawn timeline. Active from tStart (inclusive) until the next entry. */
export interface WavePhase {
  /** seconds into the run */
  tStart: number;
  spawnIntervalMs: number;
  maxAlive: number;
  /** weighted enemy pool */
  pool: { type: EnemyTypeId; weight: number }[];
}

export type TimedEventKind = 'ring' | 'elite' | 'boss' | 'swarm';

export interface TimedEvent {
  /** seconds into the run */
  t: number;
  kind: TimedEventKind;
  type?: EnemyTypeId;
  count?: number;
  fired?: boolean; // runtime flag
}

export interface UpgradeChoice {
  kind: 'weapon' | 'passive' | 'heal' | 'gold';
  id?: WeaponId | PassiveId;
  name: string;
  desc: string;
  icon: string;
  /** resulting level if taken (1 = new) */
  level?: number;
}

export interface RunResult {
  victory: boolean;
  timeSurvivedSec: number;
  level: number;
  kills: number;
  gold: number;
}

export interface SaveData {
  bestTimeSec: number;
  bestKills: number;
  wins: number;
  runs: number;
  muted: boolean;
}
