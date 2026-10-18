import Phaser from 'phaser';
import { petTexture } from '../art/animate';
import { addBackdrop, makeTextures } from '../art/themes';
import { goTo, savedStep, textStyle } from '../flow';
import { FLOW } from '../story';
import { isTouch } from '../touch';

export class TitleScene extends Phaser.Scene {
  private pets: Phaser.GameObjects.Image[] = [];

  constructor() {
    super('title');
  }

  update(time: number) {
    this.pets[0]?.setTexture(petTexture('ricey', 'walk', time));
    this.pets[1]?.setTexture(petTexture('ramen', 'walk', time, 45));
  }

  create() {
    this.pets = [];
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
    const prompt = this.add.text(320, 190, isTouch ? 'Tap to start' : 'Press Space to start', textStyle(12)).setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.3, duration: 600, yoyo: true, repeat: -1 });
    const resume = saved > 0 ? this.add.text(320, 222, isTouch ? 'Tap here to continue' : 'C to continue', textStyle(10, '#d8f0ff')).setOrigin(0.5) : undefined;

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
    this.pets = pets;

    const kb = this.input.keyboard!;
    const start = () => goTo(this, 0);
    kb.once('keydown-SPACE', start);
    kb.once('keydown-ENTER', start);
    this.input.gamepad?.once('down', start);
    if (resume) {
      const cont = () => goTo(this, saved);
      kb.once('keydown-C', cont);
      // With a save, taps need a target: the continue line resumes, anywhere else starts over.
      resume.setPadding(12).setInteractive().once('pointerdown', cont);
      this.input.on('pointerdown', (_p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
        if (!over.includes(resume)) start();
      });
    } else {
      this.input.once('pointerdown', start);
    }
  }
}
