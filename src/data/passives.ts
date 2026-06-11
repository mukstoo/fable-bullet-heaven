import type { PassiveDef, PassiveId } from '../types';

/**
 * Passive items. `apply` is called once per level owned when (re)computing stats
 * from base values, so effects stack per level.
 */
export const PASSIVES: Record<PassiveId, PassiveDef> = {
  power: {
    id: 'power', name: 'Grimoire of Power', desc: '+12% damage', icon: 'tile:117', maxLevel: 5,
    apply: s => { s.damageMult += 0.12; }
  },
  haste: {
    id: 'haste', name: 'Cursed Hourglass', desc: '-8% weapon cooldown', icon: 'tile:116', maxLevel: 5,
    apply: s => { s.cooldownMult *= 0.92; }
  },
  vitality: {
    id: 'vitality', name: 'Heart of Iron', desc: '+25 max HP', icon: 'gen:icon_heart', maxLevel: 5,
    apply: s => { s.maxHp += 25; }
  },
  swiftness: {
    id: 'swiftness', name: 'Wraith Boots', desc: '+8% move speed', icon: 'gen:icon_swift', maxLevel: 5,
    apply: s => { s.moveSpeed *= 1.08; }
  },
  lantern: {
    id: 'lantern', name: 'Soul Lantern', desc: '+30% pickup range', icon: 'tile:125', maxLevel: 5,
    apply: s => { s.magnetRadius *= 1.3; }
  },
  shield: {
    id: 'shield', name: 'Gravewall Shield', desc: '+1 armor (flat damage cut)', icon: 'tile:102', maxLevel: 5,
    apply: s => { s.armor += 1; }
  },
  bloodpact: {
    id: 'bloodpact', name: 'Blood Pact', desc: '+0.5 HP regen / sec', icon: 'gen:icon_blood', maxLevel: 5,
    apply: s => { s.regenPerSec += 0.5; }
  },
  echo: {
    id: 'echo', name: 'Echo Crystal', desc: '+1 projectile to volley weapons', icon: 'gen:icon_echo', maxLevel: 2,
    apply: s => { s.amountBonus += 1; }
  }
};
