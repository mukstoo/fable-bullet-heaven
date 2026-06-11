import type { WeaponDef, WeaponId } from '../types';

/**
 * The six auto-firing weapons. Levels are index 0 = level 1, max level 5.
 * `area`/`speed`/`pierce` are interpreted per-weapon by the weapon system.
 */
export const WEAPONS: Record<WeaponId, WeaponDef> = {
  spark: {
    id: 'spark',
    name: 'Grave Spark',
    desc: 'Hurls arcane bolts at the nearest foe.',
    icon: 'tile:107',
    levels: [
      { damage: 12, cooldownMs: 550, amount: 1, area: 0, speed: 400, pierce: 0, knockback: 60 },
      { damage: 16, cooldownMs: 520, amount: 1, area: 0, speed: 420, pierce: 0, knockback: 60 },
      { damage: 16, cooldownMs: 470, amount: 2, area: 0, speed: 440, pierce: 0, knockback: 70 },
      { damage: 24, cooldownMs: 440, amount: 2, area: 0, speed: 470, pierce: 1, knockback: 80 },
      { damage: 32, cooldownMs: 400, amount: 3, area: 0, speed: 500, pierce: 1, knockback: 90 }
    ]
  },
  arc: {
    id: 'arc',
    name: "Reaper's Arc",
    desc: 'A sweeping blade arc toward the nearest enemy.',
    icon: 'tile:104',
    levels: [
      { damage: 22, cooldownMs: 1150, amount: 1, area: 95, speed: 0, pierce: 99, knockback: 150 },
      { damage: 30, cooldownMs: 1100, amount: 1, area: 105, speed: 0, pierce: 99, knockback: 158 },
      { damage: 30, cooldownMs: 1050, amount: 2, area: 115, speed: 0, pierce: 99, knockback: 166 },
      { damage: 42, cooldownMs: 950, amount: 2, area: 130, speed: 0, pierce: 99, knockback: 180 },
      { damage: 58, cooldownMs: 850, amount: 2, area: 150, speed: 0, pierce: 99, knockback: 200 }
    ]
  },
  axes: {
    id: 'axes',
    name: 'Bone Axes',
    desc: 'Lobs heavy axes that arc overhead and pierce.',
    icon: 'tile:118',
    levels: [
      { damage: 20, cooldownMs: 1350, amount: 1, area: 0, speed: 330, pierce: 3, knockback: 120 },
      { damage: 20, cooldownMs: 1300, amount: 2, area: 0, speed: 340, pierce: 3, knockback: 120 },
      { damage: 28, cooldownMs: 1250, amount: 2, area: 0, speed: 350, pierce: 4, knockback: 130 },
      { damage: 28, cooldownMs: 1100, amount: 3, area: 0, speed: 360, pierce: 4, knockback: 140 },
      { damage: 38, cooldownMs: 1000, amount: 4, area: 0, speed: 380, pierce: 5, knockback: 150 }
    ]
  },
  orbitals: {
    id: 'orbitals',
    name: 'Spirit Blades',
    desc: 'Spectral blades orbit you, shredding what they touch.',
    icon: 'tile:105',
    levels: [
      { damage: 10, cooldownMs: 450, amount: 1, area: 74, speed: 170, pierce: 99, knockback: 55 },
      { damage: 14, cooldownMs: 450, amount: 2, area: 80, speed: 180, pierce: 99, knockback: 60 },
      { damage: 14, cooldownMs: 420, amount: 3, area: 86, speed: 195, pierce: 99, knockback: 65 },
      { damage: 20, cooldownMs: 400, amount: 3, area: 94, speed: 210, pierce: 99, knockback: 70 },
      { damage: 26, cooldownMs: 380, amount: 5, area: 104, speed: 230, pierce: 99, knockback: 78 }
    ]
  },
  nova: {
    id: 'nova',
    name: 'Unholy Nova',
    desc: 'Pulses of grave-fire scorch everything around you.',
    icon: 'gen:icon_nova',
    levels: [
      { damage: 9, cooldownMs: 950, amount: 1, area: 85, speed: 0, pierce: 99, knockback: 28 },
      { damage: 12, cooldownMs: 900, amount: 1, area: 100, speed: 0, pierce: 99, knockback: 32 },
      { damage: 15, cooldownMs: 820, amount: 1, area: 112, speed: 0, pierce: 99, knockback: 36 },
      { damage: 19, cooldownMs: 740, amount: 1, area: 126, speed: 0, pierce: 99, knockback: 40 },
      { damage: 25, cooldownMs: 650, amount: 1, area: 145, speed: 0, pierce: 99, knockback: 46 }
    ]
  },
  storm: {
    id: 'storm',
    name: 'Stormcall',
    desc: 'Lightning smites random foes from above.',
    icon: 'gen:icon_storm',
    levels: [
      { damage: 34, cooldownMs: 2100, amount: 2, area: 46, speed: 0, pierce: 99, knockback: 50 },
      { damage: 42, cooldownMs: 2000, amount: 3, area: 50, speed: 0, pierce: 99, knockback: 55 },
      { damage: 50, cooldownMs: 1900, amount: 4, area: 54, speed: 0, pierce: 99, knockback: 60 },
      { damage: 62, cooldownMs: 1750, amount: 5, area: 60, speed: 0, pierce: 99, knockback: 65 },
      { damage: 80, cooldownMs: 1600, amount: 7, area: 68, speed: 0, pierce: 99, knockback: 70 }
    ]
  }
};

export const WEAPON_MAX_LEVEL = 5;

/** Per-level human-readable upgrade blurbs for the cards */
export function weaponUpgradeBlurb(id: WeaponId, toLevel: number): string {
  const w = WEAPONS[id];
  if (toLevel <= 1) return w.desc;
  const prev = w.levels[toLevel - 2];
  const next = w.levels[toLevel - 1];
  const bits: string[] = [];
  if (next.damage !== prev.damage) bits.push(`damage ${prev.damage}→${next.damage}`);
  if (next.amount !== prev.amount) bits.push(`+${next.amount - prev.amount} ${amountNoun(id)}`);
  if (next.cooldownMs !== prev.cooldownMs) bits.push('faster');
  if (next.area !== prev.area) bits.push('bigger area');
  if (next.pierce !== prev.pierce) bits.push('more pierce');
  return bits.join(', ') || 'improved';
}

function amountNoun(id: WeaponId): string {
  switch (id) {
    case 'spark': return 'bolt';
    case 'arc': return 'swing';
    case 'axes': return 'axe';
    case 'orbitals': return 'blade';
    case 'storm': return 'strike';
    default: return 'hit';
  }
}
