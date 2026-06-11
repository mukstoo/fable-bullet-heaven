import Phaser from 'phaser';
import { BUILD_LIMITS, PLAYER, XP } from '../config';
import { WEAPONS, WEAPON_MAX_LEVEL, weaponUpgradeBlurb } from '../data/weapons';
import { PASSIVES } from '../data/passives';
import type { PassiveId, PlayerStats, UpgradeChoice, WeaponId } from '../types';

/** Everything a single run accumulates: build, xp, kills, gold, derived stats. */
export class RunState {
  readonly stats: PlayerStats = {
    maxHp: PLAYER.BASE_HP,
    regenPerSec: 0,
    moveSpeed: PLAYER.BASE_SPEED,
    magnetRadius: PLAYER.BASE_MAGNET,
    armor: 0,
    damageMult: 1,
    cooldownMult: 1,
    areaMult: 1,
    projSpeedMult: 1,
    amountBonus: 0
  };

  readonly weapons = new Map<WeaponId, number>();
  readonly passives = new Map<PassiveId, number>();

  level = 1;
  xp = 0;
  xpNeeded = XP.needed(1);
  kills = 0;
  gold = 0;

  constructor(startingWeapon: WeaponId = 'spark') {
    this.weapons.set(startingWeapon, 1);
    this.recompute();
  }

  /** add xp; returns how many level-ups it produced */
  addXp(value: number): number {
    this.xp += value;
    let ups = 0;
    while (this.xp >= this.xpNeeded) {
      this.xp -= this.xpNeeded;
      this.level += 1;
      this.xpNeeded = XP.needed(this.level);
      ups += 1;
    }
    return ups;
  }

  recompute() {
    const s = this.stats;
    s.maxHp = PLAYER.BASE_HP;
    s.regenPerSec = 0;
    s.moveSpeed = PLAYER.BASE_SPEED;
    s.magnetRadius = PLAYER.BASE_MAGNET;
    s.armor = 0;
    s.damageMult = 1;
    s.cooldownMult = 1;
    s.areaMult = 1;
    s.projSpeedMult = 1;
    s.amountBonus = 0;
    for (const [id, lvl] of this.passives) {
      const def = PASSIVES[id];
      for (let i = 0; i < lvl; i++) def.apply(s);
    }
  }

  /** three distinct weighted choices for the level-up screen */
  buildChoices(rng: Phaser.Math.RandomDataGenerator): UpgradeChoice[] {
    const pool: { choice: UpgradeChoice; weight: number }[] = [];

    for (const def of Object.values(WEAPONS)) {
      const owned = this.weapons.get(def.id);
      if (owned !== undefined && owned < WEAPON_MAX_LEVEL) {
        pool.push({
          weight: 10,
          choice: {
            kind: 'weapon', id: def.id, name: def.name, icon: def.icon,
            level: owned + 1, desc: weaponUpgradeBlurb(def.id, owned + 1)
          }
        });
      } else if (owned === undefined && this.weapons.size < BUILD_LIMITS.WEAPONS) {
        pool.push({
          weight: 6,
          choice: { kind: 'weapon', id: def.id, name: def.name, icon: def.icon, level: 1, desc: def.desc }
        });
      }
    }
    for (const def of Object.values(PASSIVES)) {
      const owned = this.passives.get(def.id);
      if (owned !== undefined && owned < def.maxLevel) {
        pool.push({
          weight: 9,
          choice: { kind: 'passive', id: def.id, name: def.name, icon: def.icon, level: owned + 1, desc: def.desc }
        });
      } else if (owned === undefined && this.passives.size < BUILD_LIMITS.PASSIVES) {
        pool.push({
          weight: 5,
          choice: { kind: 'passive', id: def.id, name: def.name, icon: def.icon, level: 1, desc: def.desc }
        });
      }
    }

    const picks: UpgradeChoice[] = [];
    while (picks.length < 3 && pool.length > 0) {
      const total = pool.reduce((a, p) => a + p.weight, 0);
      let roll = rng.frac() * total;
      let idx = 0;
      for (let i = 0; i < pool.length; i++) {
        roll -= pool[i].weight;
        if (roll <= 0) {
          idx = i;
          break;
        }
      }
      picks.push(pool[idx].choice);
      pool.splice(idx, 1);
    }
    // build is fully maxed — offer consolations
    while (picks.length < 3) {
      picks.push(
        picks.length % 2 === 0
          ? { kind: 'heal', name: 'Grave Feast', desc: 'Restore 40 HP', icon: 'tile:115' }
          : { kind: 'gold', name: 'Blood Tithe', desc: '+30 gold', icon: 'gen:coin' }
      );
    }
    return picks;
  }

  /** returns true when the choice changed the build (weapon/passive) */
  applyChoice(c: UpgradeChoice): boolean {
    if (c.kind === 'weapon' && c.id) {
      this.weapons.set(c.id as WeaponId, c.level ?? 1);
      return true;
    }
    if (c.kind === 'passive' && c.id) {
      this.passives.set(c.id as PassiveId, c.level ?? 1);
      this.recompute();
      return true;
    }
    return false;
  }

  /** random still-available upgrade (boss chest reward); null if everything is maxed */
  randomDirectUpgrade(rng: Phaser.Math.RandomDataGenerator): UpgradeChoice | null {
    const choices = this.buildChoices(rng).filter(c => c.kind === 'weapon' || c.kind === 'passive');
    return choices.length ? choices[rng.between(0, choices.length - 1)] : null;
  }
}
