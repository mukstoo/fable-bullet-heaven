import Phaser from 'phaser';
import { DEPTH } from '../config';
import { F } from '../data/frames';
import { WEAPONS } from '../data/weapons';
import { Sfx } from './audio';
import type { WeaponId, WeaponLevel } from '../types';
import type { Enemy } from '../entities/Enemy';
import type { Projectile } from '../entities/Projectile';
import type { GameScene } from '../scenes/GameScene';

/** per-enemy re-hit gate map carried by each orbital blade */
interface OrbitalBlade extends Phaser.Physics.Arcade.Sprite {
  hitGates: Map<object, number>;
}

/**
 * Runs every owned weapon off the pausable run-clock: cooldowns, targeting,
 * projectile spawning, sector/aura/lightning damage, and the orbital blades.
 */
export class Arsenal {
  private gs: GameScene;
  private nextFireAt = new Map<WeaponId, number>();
  private blades: OrbitalBlade[] = [];
  private bladeKey = '';
  private orbitalAngle = 0;
  private auraGlow?: Phaser.GameObjects.Image;

  constructor(gs: GameScene) {
    this.gs = gs;
  }

  update(runTime: number, delta: number) {
    const { run } = this.gs;
    for (const [id, lvl] of run.weapons) {
      if (id === 'orbitals') continue; // continuous, handled below
      const L = WEAPONS[id].levels[lvl - 1];
      const due = this.nextFireAt.get(id) ?? 0;
      if (runTime < due) continue;
      const fired = this.fire(id, L, runTime);
      const cd = L.cooldownMs * run.stats.cooldownMult;
      this.nextFireAt.set(id, runTime + (fired ? cd : 180));
    }
    this.updateOrbitals(runTime, delta);
    this.updateAura();
  }

  private fire(id: WeaponId, L: WeaponLevel, runTime: number): boolean {
    switch (id) {
      case 'spark': return this.fireSpark(L, runTime);
      case 'axes': return this.fireAxes(L, runTime);
      case 'arc': return this.fireArc(L, runTime);
      case 'nova': return this.fireNova(L, runTime);
      case 'storm': return this.fireStorm(L, runTime);
      default: return false;
    }
  }

  // ---- spark: aimed bolts at the nearest enemy ----
  private fireSpark(L: WeaponLevel, runTime: number): boolean {
    const { player, run } = this.gs;
    const target = this.nearestEnemy(player.x, player.y, 720);
    if (!target) return false;
    const base = Math.atan2(target.y - player.y, target.x - player.x);
    const amount = L.amount + run.stats.amountBonus;
    const speed = L.speed * run.stats.projSpeedMult;
    for (let i = 0; i < amount; i++) {
      const spread = amount === 1 ? 0 : (i - (amount - 1) / 2) * 0.11;
      const a = base + spread;
      const p = this.gs.projectiles.get() as Projectile | null;
      if (!p) break;
      p.fire({
        kind: 'bolt',
        x: player.x, y: player.y - 6,
        vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
        damage: L.damage * run.stats.damageMult,
        knockback: L.knockback,
        pierce: L.pierce,
        runTime,
        texture: 'bolt',
        tint: 0x7fd4ff,
        scale: 1.7,
        lifespanMs: 1900,
        bodyRadius: 5
      });
    }
    return true;
  }

  // ---- axes: lobbed overhead, gravity arcs, pierce ----
  private fireAxes(L: WeaponLevel, runTime: number): boolean {
    const { player, run } = this.gs;
    const amount = L.amount + run.stats.amountBonus;
    for (let i = 0; i < amount; i++) {
      const p = this.gs.projectiles.get() as Projectile | null;
      if (!p) break;
      const dir = player.flipX ? -1 : 1;
      const vx = dir * Phaser.Math.Between(40, 170) * (i % 2 === 0 ? 1 : -0.7);
      const vy = -(L.speed * run.stats.projSpeedMult) * Phaser.Math.FloatBetween(0.92, 1.08);
      p.fire({
        kind: 'axe',
        x: player.x + Phaser.Math.Between(-8, 8), y: player.y - 10,
        vx, vy,
        damage: L.damage * run.stats.damageMult,
        knockback: L.knockback,
        pierce: L.pierce,
        runTime,
        texture: 'tiles',
        frame: F.AXE,
        scale: 2.3,
        lifespanMs: 2900,
        spin: 11,
        gravityY: 780,
        bodyRadius: 12
      });
    }
    Sfx.play('axe', 0.3, Phaser.Math.Between(-100, 100));
    return true;
  }

  // ---- arc: melee sector sweep(s) ----
  private fireArc(L: WeaponLevel, _runTime: number): boolean {
    const { player } = this.gs;
    const target = this.nearestEnemy(player.x, player.y, 9999);
    const baseAngle = target
      ? Math.atan2(target.y - player.y, target.x - player.x)
      : (player.flipX ? Math.PI : 0);
    this.swingArc(baseAngle, L);
    if (L.amount >= 2) {
      this.gs.time.delayedCall(150, () => {
        if (this.gs.runEnded) return;
        this.swingArc(baseAngle + Math.PI, L);
      });
    }
    return true;
  }

  private swingArc(angle: number, L: WeaponLevel) {
    const { player, run, juice } = this.gs;
    const radius = L.area * run.stats.areaMult;
    juice.slashFlash(player.x, player.y, angle, radius);
    Sfx.play('swing', 0.4, Phaser.Math.Between(-150, 150));
    const halfWindow = 0.96; // ~±55°
    for (const e of this.gs.activeEnemies) {
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist > radius + e.def.radius) continue;
      const diff = Math.abs(Phaser.Math.Angle.Wrap(Math.atan2(dy, dx) - angle));
      if (diff > halfWindow) continue;
      this.gs.damageEnemy(e, L.damage * run.stats.damageMult, dx, dy, L.knockback);
    }
  }

  // ---- nova: radial pulse around the player ----
  private fireNova(L: WeaponLevel, _runTime: number): boolean {
    const { player, run, juice } = this.gs;
    const radius = L.area * run.stats.areaMult;
    juice.ringPulse(player.x, player.y, radius, 0xff8c2e, 380);
    Sfx.play('nova', 0.22);
    for (const e of this.gs.activeEnemies) {
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      if (dx * dx + dy * dy > (radius + e.def.radius) * (radius + e.def.radius)) continue;
      this.gs.damageEnemy(e, L.damage * run.stats.damageMult, dx, dy, L.knockback);
    }
    return true;
  }

  // ---- storm: lightning on random visible enemies ----
  private fireStorm(L: WeaponLevel, _runTime: number): boolean {
    const { run, juice } = this.gs;
    const view = this.gs.cameras.main.worldView;
    const candidates = this.gs.activeEnemies.filter(e =>
      e.x > view.x - 40 && e.x < view.right + 40 && e.y > view.y - 40 && e.y < view.bottom + 40
    );
    if (candidates.length === 0) return false;
    const strikes = Math.min(L.amount + run.stats.amountBonus, candidates.length);
    Phaser.Utils.Array.Shuffle(candidates);
    const splash = L.area * run.stats.areaMult;
    for (let i = 0; i < strikes; i++) {
      const t = candidates[i];
      juice.lightningStrike(t.x, t.y, splash);
      for (const e of this.gs.activeEnemies) {
        const dx = e.x - t.x;
        const dy = e.y - t.y;
        if (dx * dx + dy * dy > splash * splash) continue;
        this.gs.damageEnemy(e, L.damage * run.stats.damageMult, dx, dy, L.knockback);
      }
    }
    Sfx.play('zap', 0.4, Phaser.Math.Between(-100, 100));
    return true;
  }

  // ---- orbitals: continuous spinning blades ----
  private updateOrbitals(_runTime: number, delta: number) {
    const { run, player } = this.gs;
    const lvl = run.weapons.get('orbitals');
    if (!lvl) return;
    const L = WEAPONS.orbitals.levels[lvl - 1];
    const count = L.amount + run.stats.amountBonus;
    const key = `${lvl}:${count}`;
    if (key !== this.bladeKey) this.rebuildBlades(count);

    this.orbitalAngle += Phaser.Math.DegToRad(L.speed) * (delta / 1000);
    const radius = L.area * run.stats.areaMult;
    for (let i = 0; i < this.blades.length; i++) {
      const a = this.orbitalAngle + (i / this.blades.length) * Math.PI * 2;
      const b = this.blades[i];
      b.setPosition(player.x + Math.cos(a) * radius, player.y + Math.sin(a) * radius);
      b.setRotation(a + Math.PI / 2);
    }
  }

  private rebuildBlades(count: number) {
    for (const b of this.blades) b.destroy();
    this.blades = [];
    for (let i = 0; i < count; i++) {
      const b = this.gs.orbitalGroup.create(this.gs.player.x, this.gs.player.y, 'tiles', F.DAGGER) as OrbitalBlade;
      b.setScale(2.1).setDepth(DEPTH.PROJECTILE).setTint(0xb0e8ff);
      const body = b.body as Phaser.Physics.Arcade.Body;
      body.setCircle(5, 3, 3);
      body.moves = false;
      b.hitGates = new Map();
      this.blades.push(b);
    }
    const lvl = this.gs.run.weapons.get('orbitals') ?? 1;
    this.bladeKey = `${lvl}:${count}`;
  }

  /** overlap callback from GameScene: blade × enemy with per-enemy re-hit gate */
  orbitalHit(bladeObj: Phaser.GameObjects.GameObject, enemy: Enemy, runTime: number) {
    const blade = bladeObj as OrbitalBlade;
    const lvl = this.gs.run.weapons.get('orbitals');
    if (!lvl || !blade.hitGates) return;
    const gate = blade.hitGates.get(enemy) ?? 0;
    if (runTime < gate) return;
    const L = WEAPONS.orbitals.levels[lvl - 1];
    blade.hitGates.set(enemy, runTime + L.cooldownMs * this.gs.run.stats.cooldownMult);
    if (blade.hitGates.size > 300) blade.hitGates.clear();
    this.gs.damageEnemy(
      enemy,
      L.damage * this.gs.run.stats.damageMult,
      enemy.x - this.gs.player.x,
      enemy.y - this.gs.player.y,
      L.knockback
    );
  }

  /** soft persistent glow while nova is owned */
  private updateAura() {
    const lvl = this.gs.run.weapons.get('nova');
    if (!lvl) {
      this.auraGlow?.setVisible(false);
      return;
    }
    const L = WEAPONS.nova.levels[lvl - 1];
    const radius = L.area * this.gs.run.stats.areaMult;
    if (!this.auraGlow) {
      this.auraGlow = this.gs.add.image(0, 0, 'soft_circle').setDepth(DEPTH.SHADOW).setAlpha(0.1).setTint(0xff7a3c);
    }
    this.auraGlow.setVisible(true).setPosition(this.gs.player.x, this.gs.player.y);
    this.auraGlow.setScale((radius * 2) / 96);
  }

  private nearestEnemy(x: number, y: number, maxDist: number): Enemy | null {
    let best: Enemy | null = null;
    let bestD = maxDist * maxDist;
    for (const e of this.gs.activeEnemies) {
      const dx = e.x - x;
      const dy = e.y - y;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }

  /** wipe transient visuals on run end */
  destroyVisuals() {
    for (const b of this.blades) b.destroy();
    this.blades = [];
    this.auraGlow?.destroy();
    this.auraGlow = undefined;
  }
}
