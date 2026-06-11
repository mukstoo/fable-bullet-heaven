import Phaser from 'phaser';
import { COLORS, DEPTH, DROPS, GAME_HEIGHT, GAME_WIDTH, PLAYER, POOL_SIZES } from '../config';
import { F } from '../data/frames';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';
import { Arsenal } from '../systems/Arsenal';
import { Juice } from '../systems/Juice';
import { Loot } from '../systems/Loot';
import { RunState } from '../systems/RunState';
import { SpawnDirector } from '../systems/SpawnDirector';
import { Sfx } from '../systems/audio';
import { loadSave, storeSave } from '../systems/save';
import type { EnemyContext } from '../entities/Enemy';
import type { RunResult, UpgradeChoice } from '../types';

const DECOR_FRAMES = [F.GRAVE_CROSS, F.GRAVESTONE, F.SLAB_A, F.SLAB_B, F.HOLE, F.BONES];

export class GameScene extends Phaser.Scene implements EnemyContext {
  player!: Player;
  run!: RunState;
  juice!: Juice;
  loot!: Loot;
  arsenal!: Arsenal;
  spawner!: SpawnDirector;
  rng!: Phaser.Math.RandomDataGenerator;

  enemies!: Phaser.Physics.Arcade.Group;
  projectiles!: Phaser.Physics.Arcade.Group;
  enemyProjectiles!: Phaser.Physics.Arcade.Group;
  orbitalGroup!: Phaser.Physics.Arcade.Group;
  activeEnemies: Enemy[] = [];

  /** pausable run clock in ms — all cooldowns/timers compare against this */
  runTime = 0;
  runEnded = false;
  currentBoss: Enemy | null = null;
  reaperSpawned = false;

  private ground!: Phaser.GameObjects.TileSprite;
  private decor: Phaser.GameObjects.Image[] = [];
  private hpBarBg!: Phaser.GameObjects.Rectangle;
  private hpBarFill!: Phaser.GameObjects.Rectangle;
  private keys!: Record<'W' | 'A' | 'S' | 'D' | 'P' | 'M', Phaser.Input.Keyboard.Key>;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private escKey!: Phaser.Input.Keyboard.Key;
  private pendingLevelUps = 0;
  private choosingUpgrade = false;
  private regenCarry = 0;

  constructor() {
    super('Game');
  }

  create() {
    this.runTime = 0;
    this.runEnded = false;
    this.pendingLevelUps = 0;
    this.choosingUpgrade = false;
    this.regenCarry = 0;
    this.currentBoss = null;
    this.reaperSpawned = false;
    this.activeEnemies = [];
    this.rng = new Phaser.Math.RandomDataGenerator([String(Date.now())]);

    // --- world dressing ---
    this.cameras.main.setBackgroundColor(COLORS.BG);
    this.ground = this.add
      .tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'ground')
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(DEPTH.GROUND);
    this.add
      .image(0, 0, 'vignette')
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(DEPTH.OVERLAY - 1)
      .setAlpha(0.95);

    // --- player + camera ---
    this.player = new Player(this, 0, 0);
    this.run = new RunState('spark');
    this.player.stats = this.run.stats;
    this.player.hp = this.run.stats.maxHp;
    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);

    // gravestone decor scattered around, recycled as the player roams
    this.decor = [];
    for (let i = 0; i < 42; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = Phaser.Math.Between(80, 900);
      const img = this.add
        .image(Math.cos(a) * d, Math.sin(a) * d, 'tiles', Phaser.Math.RND.pick(DECOR_FRAMES))
        .setScale(2.2)
        .setDepth(DEPTH.DECOR)
        .setAlpha(0.85)
        .setTint(0x8d89b8);
      this.decor.push(img);
    }

    // --- pooled groups ---
    this.enemies = this.physics.add.group({
      classType: Enemy,
      maxSize: POOL_SIZES.ENEMIES,
      runChildUpdate: false
    });
    this.projectiles = this.physics.add.group({
      classType: Projectile,
      maxSize: POOL_SIZES.PLAYER_PROJECTILES,
      runChildUpdate: true
    });
    this.enemyProjectiles = this.physics.add.group({
      classType: Projectile,
      maxSize: POOL_SIZES.ENEMY_PROJECTILES,
      runChildUpdate: true
    });
    this.orbitalGroup = this.physics.add.group();

    // --- systems ---
    this.juice = new Juice(this);
    this.loot = new Loot(this);
    this.arsenal = new Arsenal(this);
    this.spawner = new SpawnDirector(this);

    // --- physics wiring ---
    this.physics.add.collider(this.enemies, this.enemies);
    this.physics.add.overlap(this.projectiles, this.enemies, (proj, enemy) => {
      this.onProjectileHit(proj as Projectile, enemy as Enemy);
    });
    this.physics.add.overlap(this.player, this.enemies, (_p, enemy) => {
      this.onEnemyContact(enemy as Enemy);
    });
    this.physics.add.overlap(this.player, this.enemyProjectiles, (_p, proj) => {
      this.onEnemyOrbHit(proj as Projectile);
    });
    this.physics.add.overlap(this.orbitalGroup, this.enemies, (blade, enemy) => {
      this.arsenal.orbitalHit(blade as Phaser.GameObjects.GameObject, enemy as Enemy, this.runTime);
    });

    // --- player HP bar (world space, follows player) ---
    this.hpBarBg = this.add.rectangle(0, 0, 36, 5, COLORS.HP_BAR_BG).setDepth(DEPTH.FX).setOrigin(0.5);
    this.hpBarFill = this.add.rectangle(0, 0, 34, 3, COLORS.HP_BAR).setDepth(DEPTH.FX).setOrigin(0, 0.5);

    // --- input ---
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys('W,A,S,D,P,M') as GameScene['keys'];
    this.cursors = kb.createCursorKeys();
    this.escKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // --- UI + music ---
    this.scene.launch('Hud');
    Sfx.playMusic('music_battle', 0.3);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scene.stop('Hud');
      this.scene.stop('LevelUp');
      this.scene.stop('Pause');
    });
  }

  update(_time: number, delta: number) {
    if (this.runEnded) return;
    this.runTime += delta;
    const rt = this.runTime;

    // input
    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const up = this.cursors.up.isDown || this.keys.W.isDown;
    const down = this.cursors.down.isDown || this.keys.S.isDown;
    this.player.move((right ? 1 : 0) - (left ? 1 : 0), (down ? 1 : 0) - (up ? 1 : 0), delta);

    if (Phaser.Input.Keyboard.JustDown(this.keys.M)) Sfx.toggleMute();
    if (Phaser.Input.Keyboard.JustDown(this.keys.P) || Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.scene.launch('Pause');
      this.scene.pause();
      return;
    }

    // regen
    if (this.run.stats.regenPerSec > 0 && this.player.hp < this.run.stats.maxHp) {
      this.regenCarry += this.run.stats.regenPerSec * (delta / 1000);
      if (this.regenCarry >= 1) {
        const whole = Math.floor(this.regenCarry);
        this.regenCarry -= whole;
        this.player.heal(whole);
      }
    }

    // systems
    this.spawner.update(rt);
    this.spawner.maybeEnrageReaper(rt);
    this.arsenal.update(rt, delta);
    this.loot.update(rt, delta);

    // enemies (swap-pop dead ones out of the hot array)
    const arr = this.activeEnemies;
    for (let i = arr.length - 1; i >= 0; i--) {
      const e = arr[i];
      if (!e.active) {
        arr[i] = arr[arr.length - 1];
        arr.pop();
        continue;
      }
      e.updateEnemy(rt, delta, this.player, this);
    }

    // projectile lifespans on the pausable clock + distance cull
    this.cullProjectiles(this.projectiles, rt);
    this.cullProjectiles(this.enemyProjectiles, rt);

    // ground scroll + decor recycling + hp bar follow
    const cam = this.cameras.main;
    this.ground.setTilePosition(cam.scrollX, cam.scrollY);
    this.recycleDecor();
    this.hpBarBg.setPosition(this.player.x, this.player.y - 26);
    const ratio = Phaser.Math.Clamp(this.player.hp / this.run.stats.maxHp, 0, 1);
    this.hpBarFill.setPosition(this.player.x - 17, this.player.y - 26).setScale(ratio, 1);
  }

  private cullProjectiles(group: Phaser.Physics.Arcade.Group, rt: number) {
    const children = group.getChildren() as Projectile[];
    for (const p of children) {
      if (!p.active) continue;
      if (rt - p.bornAt > p.lifespanMs) {
        p.recycle();
        continue;
      }
      const dx = p.x - this.player.x;
      const dy = p.y - this.player.y;
      if (dx * dx + dy * dy > 1200 * 1200) p.recycle();
    }
  }

  private recycleDecor() {
    for (const d of this.decor) {
      const dx = d.x - this.player.x;
      const dy = d.y - this.player.y;
      if (dx * dx + dy * dy > 1100 * 1100) {
        const a = Math.random() * Math.PI * 2;
        const dist = Phaser.Math.Between(620, 1000);
        d.setPosition(this.player.x + Math.cos(a) * dist, this.player.y + Math.sin(a) * dist);
        d.setFrame(Phaser.Math.RND.pick(DECOR_FRAMES));
      }
    }
  }

  // ------------------------------------------------------------------ combat

  private onProjectileHit(proj: Projectile, enemy: Enemy) {
    if (!proj.active || !enemy.active || proj.hits.has(enemy)) return;
    proj.hits.add(enemy);
    const body = proj.body as Phaser.Physics.Arcade.Body;
    this.juice.impact(proj.x, proj.y);
    this.damageEnemy(enemy, proj.damage, body.velocity.x, body.velocity.y, proj.knockback);
    proj.pierceLeft -= 1;
    if (proj.pierceLeft < 0) proj.recycle();
  }

  /** central damage sink — variance, numbers, kill credit, drops */
  damageEnemy(enemy: Enemy, rawDamage: number, knockX: number, knockY: number, knockForce: number) {
    if (!enemy.active || this.runEnded) return;
    const dmg = Math.max(1, Math.round(rawDamage * Phaser.Math.FloatBetween(0.92, 1.08)));
    const died = enemy.takeHit(dmg, this.runTime, knockX, knockY, knockForce);
    this.juice.damageNumber(enemy.x, enemy.y - 14, dmg, dmg >= 45 ? '#ffd34e' : '#ffffff', dmg >= 45);
    Sfx.play('hit', 0.25, Phaser.Math.Between(-150, 150));
    if (died) this.killEnemy(enemy);
  }

  private killEnemy(enemy: Enemy) {
    this.run.kills += 1;
    this.juice.deathPoof(enemy.x, enemy.y, enemy.isElite ? 0xffd34e : 0x9a6aff);
    Sfx.play('die', 0.3, Phaser.Math.Between(-100, 200));
    this.loot.dropFor(enemy);
    const wasBoss = enemy.def.boss;
    const wasReaper = enemy.def.id === 'boss_reaper';
    if (wasBoss) {
      this.loot.spawnPickup(enemy.x, enemy.y, 'chest');
      this.juice.shake(0.007, 350);
      if (this.currentBoss === enemy) this.currentBoss = null;
    }
    enemy.disableBody(true, true);
    if (wasReaper) this.endRun(true);
  }

  private onEnemyContact(enemy: Enemy) {
    if (!enemy.active || this.runEnded) return;
    if (this.runTime < enemy.nextContactAt) return;
    enemy.nextContactAt = this.runTime + PLAYER.CONTACT_TICK_MS;
    this.hurtPlayer(enemy.contactDamage);
  }

  private onEnemyOrbHit(proj: Projectile) {
    if (!proj.active || this.runEnded) return;
    proj.recycle();
    this.hurtPlayer(proj.damage);
  }

  private hurtPlayer(amount: number) {
    const final = Math.max(1, Math.round(amount - this.run.stats.armor));
    const dealt = this.player.hurt(final, this.runTime);
    if (dealt <= 0) return;
    this.juice.shake(0.005, 150);
    if (this.player.hp <= 0) this.endRun(false);
  }

  /** EnemyContext — cultists, witch and reaper shoot through this */
  fireEnemyOrb(from: Enemy, dirX: number, dirY: number, speed: number, damage: number) {
    const p = this.enemyProjectiles.get() as Projectile | null;
    if (!p) return;
    p.fire({
      kind: 'orb',
      x: from.x,
      y: from.y,
      vx: dirX * speed,
      vy: dirY * speed,
      damage: Math.round(damage * this.spawner.dmgMult(this.runTime)),
      knockback: 0,
      pierce: 0,
      runTime: this.runTime,
      texture: 'glow_orb',
      tint: from.def.id === 'boss_reaper' ? 0xb46aff : 0xff5a78,
      scale: 0.85,
      lifespanMs: 5000,
      bodyRadius: 8
    });
  }

  // ------------------------------------------------------------------- loot

  onXp(value: number) {
    const ups = this.run.addXp(value);
    if (ups > 0) {
      this.pendingLevelUps += ups;
      if (!this.choosingUpgrade) this.showLevelUp();
    }
  }

  private showLevelUp() {
    if (this.pendingLevelUps <= 0 || this.runEnded) return;
    this.pendingLevelUps -= 1;
    this.choosingUpgrade = true;
    Sfx.play('levelup', 0.6);
    const choices = this.run.buildChoices(this.rng);
    this.scene.launch('LevelUp', {
      choices,
      pick: (c: UpgradeChoice) => this.applyLevelUpChoice(c)
    });
    this.scene.pause();
  }

  private applyLevelUpChoice(c: UpgradeChoice) {
    this.scene.stop('LevelUp');
    this.scene.resume();
    this.choosingUpgrade = false;
    this.applyUpgrade(c);
    if (this.pendingLevelUps > 0) {
      this.time.delayedCall(150, () => this.showLevelUp());
    }
  }

  private applyUpgrade(c: UpgradeChoice) {
    if (c.kind === 'heal') {
      this.player.heal(40);
      this.juice.floatText(this.player.x, this.player.y - 24, '+40', COLORS.HEAL);
    } else if (c.kind === 'gold') {
      this.run.gold += 30;
      this.juice.floatText(this.player.x, this.player.y - 24, '+30 gold', '#ffd34e');
    } else {
      this.run.applyChoice(c);
      if (c.kind === 'passive' && c.id === 'vitality') this.player.heal(25);
      this.player.hp = Math.min(this.player.hp, this.run.stats.maxHp);
    }
  }

  openChest() {
    Sfx.play('chest', 0.6);
    this.juice.ringPulse(this.player.x, this.player.y, 140, 0xffd34e, 500);
    this.run.gold += DROPS.CHEST_GOLD;
    this.player.heal(DROPS.CHEST_HEAL);
    const up = this.run.randomDirectUpgrade(this.rng);
    if (up) {
      this.applyUpgrade(up);
      this.juice.floatText(
        this.player.x,
        this.player.y - 40,
        `${up.name} Lv${up.level ?? 1}`,
        '#ffd34e'
      );
    } else {
      this.juice.floatText(this.player.x, this.player.y - 40, `+${DROPS.CHEST_GOLD} gold`, '#ffd34e');
    }
  }

  onBossSpawned(e: Enemy) {
    this.currentBoss = e;
    if (e.def.id === 'boss_reaper') this.reaperSpawned = true;
  }

  // --------------------------------------------------------------- end / win

  private endRun(victory: boolean) {
    if (this.runEnded) return;
    this.runEnded = true;
    this.physics.pause();
    Sfx.stopMusic();
    Sfx.play(victory ? 'victory' : 'death', 0.7);
    if (victory) {
      this.juice.announce('DEATH IS SLAIN', '#ffd34e');
    } else {
      this.cameras.main.flash(600, 120, 0, 0);
      this.player.setTintFill(0xff2020);
    }
    this.juice.shake(victory ? 0.006 : 0.01, 500);

    const result: RunResult = {
      victory,
      timeSurvivedSec: Math.floor(this.runTime / 1000),
      level: this.run.level,
      kills: this.run.kills,
      gold: this.run.gold
    };
    const save = loadSave();
    save.runs += 1;
    if (victory) save.wins += 1;
    save.bestTimeSec = Math.max(save.bestTimeSec, result.timeSurvivedSec);
    save.bestKills = Math.max(save.bestKills, result.kills);
    storeSave(save);

    this.time.delayedCall(1400, () => {
      this.scene.stop('Hud');
      this.scene.start('GameOver', result);
    });
  }
}
