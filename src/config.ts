/** Central balance + tuning knobs for GRAVEHORDE. All gameplay constants live here. */

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

/** Run length and boss schedule (seconds) */
export const RUN = {
  WIN_TIME: 12 * 60, // the Reaper spawns at 12:00; killing him = victory
  BOSS_1_AT: 4 * 60,
  BOSS_2_AT: 8 * 60,
  REAPER_ENRAGE_AFTER: 90 // seconds after spawning, Reaper enrages
};

export const PLAYER = {
  BASE_HP: 100,
  BASE_SPEED: 150,
  BASE_MAGNET: 60,
  RADIUS: 11,
  /** ms of invulnerability after taking a hit */
  IFRAMES_MS: 350,
  /** how often one enemy in contact can hurt you (ms) */
  CONTACT_TICK_MS: 550,
  SCALE: 2.4
};

/** Enemy global scaling over run time */
export const DIFFICULTY = {
  /** +35% enemy HP per minute */
  HP_GROWTH_PER_MIN: 0.35,
  /** +8% enemy damage per minute */
  DMG_GROWTH_PER_MIN: 0.08,
  /** enemies farther than this from the player are recycled to the spawn ring */
  LEASH_RADIUS: 1100,
  /** spawn ring distance from player (just off-screen) */
  SPAWN_RADIUS_MIN: 580,
  SPAWN_RADIUS_MAX: 680
};

export const POOL_SIZES = {
  ENEMIES: 400,
  PLAYER_PROJECTILES: 250,
  ENEMY_PROJECTILES: 120,
  GEMS: 320,
  PICKUPS: 40,
  DAMAGE_TEXTS: 48
};

export const XP = {
  /** xp needed to go from `level` to `level+1` */
  needed(level: number): number {
    return Math.round(5 + (level - 1) * 5 + Math.pow(level - 1, 1.45));
  },
  GEM_SMALL: 1,
  GEM_MED: 5,
  GEM_BIG: 20,
  /** gems fly to the player at this speed once magnetised */
  GEM_FLY_SPEED: 480
};

export const DROPS = {
  HEAL_CHANCE: 0.012,
  MAGNET_CHANCE: 0.004,
  GOLD_CHANCE: 0.035,
  HEAL_AMOUNT: 30,
  GOLD_VALUE: 1,
  CHEST_GOLD: 25,
  CHEST_HEAL: 20
};

/** Tomb Mimic treasure event: kill it before it escapes for a gold shower */
export const MIMIC = {
  /** ms before it slips away */
  LIFETIME_MS: 10000,
  /** spawns this far from the player (screen edge — it must be SEEN fleeing) */
  SPAWN_DIST: 400,
  GOLD_COINS_MIN: 12,
  GOLD_COINS_MAX: 18
};

/** Max simultaneously-held weapons / passives */
export const BUILD_LIMITS = {
  WEAPONS: 4,
  PASSIVES: 4
};

export const COLORS = {
  BG: 0x0a0a12,
  HP_BAR: 0xd83a3a,
  HP_BAR_BG: 0x3a0f12,
  XP_BAR: 0x35c2f0,
  XP_BAR_BG: 0x0e2433,
  GOLD: 0xffd34e,
  TEXT: '#e8e3d0',
  TEXT_DIM: '#9a937c',
  ACCENT: '#8c46d8',
  DANGER: '#ff5050',
  HEAL: '#5dde6a'
};

export const FONT = 'PressStart2P, monospace';

/** depth layers */
export const DEPTH = {
  GROUND: 0,
  DECOR: 1,
  GEMS: 2,
  PICKUPS: 3,
  SHADOW: 4,
  ENEMY: 5,
  PLAYER: 6,
  PROJECTILE: 7,
  FX: 8,
  OVERLAY: 20
};
