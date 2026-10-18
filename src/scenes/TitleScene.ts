import Phaser from 'phaser';
import { addBackdrop, makeTextures } from '../art/themes';
import { goTo, savedStep, textStyle } from '../flow';
import { FLOW } from '../story';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('title');
  }

  create() {
    if (!this.textures.exists('ricey-idle')) makeTextures(this);
    if (!this.registry.has('scores')) this.registry.set('scores', {});

    // ?step=N jumps straight to a point in the story (handy for testing).
    const param = new URLSearchParams(location.search).get('step');
    if (param !== null && !this.registry.get('jumped')) {
      this.registry.set('jumped', true);
      return goTo(this, Math.min(Number(param) || 0, FLOW.length - 1));
    }

    addBackdrop(this, 'backyard', 640);
    this.add.tileSprite(0, 320, 640, 40, 'backyard-top').setOrigin(0);

    this.add.text(320, 70, 'Ricey n Ramen', textStyle(32, '#fff6c2')).setOrigin(0.5);
    this.add.text(320, 118, 'The Search for Nien-Nien', textStyle(12)).setOrigin(0.5);

    const saved = savedStep();
    const prompt = this.add.text(320, 190, 'Press Space to start', textStyle(12)).setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });
    if (saved > 0) this.add.text(320, 218, 'C to continue', textStyle(10, '#d8f0ff')).setOrigin(0.5);

    // The two of them pacing around the yard.
    const pets = ['ricey', 'ramen'].map((key, i) => {
      const img = this.add.image(250 + i * 110, 321, `${key}-idle`).setOrigin(0.5, 1);
      this.tweens.add({
        targets: img,
        x: img.x + 60,
        duration: 1800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: i * 400,
        onYoyo: () => img.setFlipX(true),
        onRepeat: () => img.setFlipX(false),
      });
      return img;
    });
    this.time.addEvent({
      delay: 140,
      loop: true,
      callback: () => pets.forEach((p, i) => p.setTexture(`${['ricey', 'ramen'][i]}-${this.time.now % 280 < 140 ? 'walkA' : 'walkB'}`)),
    });

    const kb = this.input.keyboard!;
    const start = () => goTo(this, 0);
    kb.once('keydown-SPACE', start);
    kb.once('keydown-ENTER', start);
    this.input.once('pointerdown', start);
    if (saved > 0) kb.once('keydown-C', () => goTo(this, saved));
    this.input.gamepad?.once('down', start);
  }
}
