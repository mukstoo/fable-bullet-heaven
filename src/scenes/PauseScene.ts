import Phaser from 'phaser';
import { FONT, GAME_HEIGHT, GAME_WIDTH } from '../config';
import { WEAPONS } from '../data/weapons';
import { PASSIVES } from '../data/passives';
import { Sfx } from '../systems/audio';
import type { GameScene } from './GameScene';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  create() {
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x06060e, 0.75).setOrigin(0).setInteractive();

    this.add
      .text(GAME_WIDTH / 2, 110, 'PAUSED', {
        fontFamily: FONT,
        fontSize: '30px',
        color: '#e8e3d0',
        stroke: '#8c46d8',
        strokeThickness: 6
      })
      .setOrigin(0.5);

    // current build summary
    const gs = this.scene.get('Game') as GameScene;
    const lines: string[] = ['— YOUR BUILD —', ''];
    for (const [id, lvl] of gs.run.weapons) lines.push(`${WEAPONS[id].name}  LV${lvl}`);
    if (gs.run.passives.size > 0) lines.push('');
    for (const [id, lvl] of gs.run.passives) lines.push(`${PASSIVES[id].name}  LV${lvl}`);
    this.add
      .text(GAME_WIDTH / 2, 175, lines.join('\n'), {
        fontFamily: FONT,
        fontSize: '10px',
        color: '#b8b09a',
        align: 'center',
        lineSpacing: 7
      })
      .setOrigin(0.5, 0);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 92, '[P/ESC] resume   [R] restart   [Q] quit to title   [M] mute', {
        fontFamily: FONT,
        fontSize: '10px',
        color: '#9a937c'
      })
      .setOrigin(0.5);

    const kb = this.input.keyboard!;
    kb.on('keydown-P', () => this.resumeGame());
    kb.on('keydown-ESC', () => this.resumeGame());
    kb.on('keydown-R', () => this.restart());
    kb.on('keydown-Q', () => this.quitToTitle());
    kb.on('keydown-M', () => Sfx.toggleMute());
    this.input.on('pointerdown', () => this.resumeGame());
  }

  private resumeGame() {
    Sfx.play('uiclick', 0.3);
    this.scene.resume('Game');
    this.scene.stop();
  }

  private restart() {
    Sfx.play('choose', 0.4);
    const game = this.scene.get('Game');
    this.scene.stop();
    game.scene.restart();
  }

  private quitToTitle() {
    Sfx.play('uiclick', 0.3);
    Sfx.stopMusic();
    this.scene.stop('Game');
    this.scene.start('Title');
  }
}
