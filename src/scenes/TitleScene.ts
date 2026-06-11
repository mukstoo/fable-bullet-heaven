import Phaser from 'phaser';
import { FONT, GAME_HEIGHT, GAME_WIDTH } from '../config';
import { F } from '../data/frames';
import { Sfx } from '../systems/audio';
import { loadSave } from '../systems/save';

export class TitleScene extends Phaser.Scene {
  private starting = false;

  constructor() {
    super('Title');
  }

  create() {
    this.starting = false;

    const ground = this.add
      .tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'ground')
      .setOrigin(0)
      .setTileScale(2)
      .setAlpha(0.5);
    this.tweens.add({
      targets: ground,
      tilePositionX: 400,
      tilePositionY: 200,
      duration: 60000,
      repeat: -1
    });
    this.add.image(0, 0, 'vignette').setOrigin(0).setAlpha(1);

    // ominous cast
    const knight = this.add.image(GAME_WIDTH / 2, 295, 'tiles', F.PLAYER).setScale(6);
    this.tweens.add({
      targets: knight,
      scaleY: { from: 6, to: 6.25 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });
    const monsters = [
      { f: F.BAT, x: -170, y: -30 },
      { f: F.GHOST, x: 175, y: -20 },
      { f: F.SPIDER, x: -230, y: 40 },
      { f: F.SLIME, x: 230, y: 50 },
      { f: F.RAT, x: -120, y: 60 },
      { f: F.ACOLYTE, x: 130, y: 65 }
    ];
    monsters.forEach((m, i) => {
      const img = this.add
        .image(GAME_WIDTH / 2 + m.x, 295 + m.y, 'tiles', m.f)
        .setScale(3)
        .setAlpha(0.75)
        .setTint(0xaa90d8);
      this.tweens.add({
        targets: img,
        y: img.y - 8,
        duration: 1100 + i * 130,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut'
      });
    });

    // title
    this.add
      .text(GAME_WIDTH / 2, 110, 'GRAVEHORDE', {
        fontFamily: FONT,
        fontSize: '52px',
        color: '#e8e3d0',
        stroke: '#8c46d8',
        strokeThickness: 10
      })
      .setOrigin(0.5)
      .setShadow(0, 6, '#000000', 0, true, true);
    this.add
      .text(GAME_WIDTH / 2, 158, 'they rise. you reap.', {
        fontFamily: FONT,
        fontSize: '12px',
        color: '#9a937c'
      })
      .setOrigin(0.5);

    // start prompt
    const prompt = this.add
      .text(GAME_WIDTH / 2, 408, 'CLICK or press ENTER to fight', {
        fontFamily: FONT,
        fontSize: '14px',
        color: '#9be8ff'
      })
      .setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.35, duration: 650, yoyo: true, repeat: -1 });

    this.add
      .text(
        GAME_WIDTH / 2,
        448,
        'WASD / arrows to move — your arsenal fires itself\nsurvive 12 minutes, slay what comes at the end',
        {
          fontFamily: FONT,
          fontSize: '9px',
          color: '#9a937c',
          align: 'center',
          lineSpacing: 6
        }
      )
      .setOrigin(0.5);

    const save = loadSave();
    if (save.runs > 0) {
      const mm = String(Math.floor(save.bestTimeSec / 60)).padStart(2, '0');
      const ss = String(save.bestTimeSec % 60).padStart(2, '0');
      this.add
        .text(
          GAME_WIDTH / 2,
          492,
          `best ${mm}:${ss}  ·  kills ${save.bestKills}  ·  wins ${save.wins}  ·  runs ${save.runs}`,
          { fontFamily: FONT, fontSize: '8px', color: '#6a6450' }
        )
        .setOrigin(0.5);
    }

    this.add
      .text(GAME_WIDTH - 6, GAME_HEIGHT - 14, 'art: kenney.nl · music: cynicmusic · [M]ute', {
        fontFamily: FONT,
        fontSize: '7px',
        color: '#55503e'
      })
      .setOrigin(1, 0);

    Sfx.playMusic('music_title', 0.35);

    const kb = this.input.keyboard!;
    kb.on('keydown-ENTER', () => this.startGame());
    kb.on('keydown-SPACE', () => this.startGame());
    kb.on('keydown-M', () => Sfx.toggleMute());
    this.input.on('pointerdown', () => this.startGame());
  }

  private startGame() {
    if (this.starting) return;
    this.starting = true;
    Sfx.play('choose', 0.6);
    this.cameras.main.fadeOut(350, 6, 6, 14);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('Game');
    });
  }
}
