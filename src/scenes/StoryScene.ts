import Phaser from 'phaser';
import { petTexture } from '../art/animate';
import { addBackdrop } from '../art/themes';
import { goTo, textStyle } from '../flow';
import { lang, t, tr } from '../i18n';
import { pad } from '../pad';
import { STORIES, type Line, type Story } from '../story';

const PORTRAIT: Record<string, string> = { Ricey: 'ricey-idle', Ramen: 'ramen-idle', 'Nien-Nien': 'nien', Dudu: 'dudu' };
const NAME_COLOR: Record<string, string> = { Ricey: '#f6d6aa', Ramen: '#ffb070', 'Nien-Nien': '#9ad4f4', Dudu: '#d8e05a' };

export class StoryScene extends Phaser.Scene {
  private story!: Story;
  private step = 0;
  private index = -1;
  private typing?: Phaser.Time.TimerEvent;
  private full = '';
  private body!: Phaser.GameObjects.Text;
  private name!: Phaser.GameObjects.Text;
  private face!: Phaser.GameObjects.Image;
  private pets: Record<string, Phaser.GameObjects.Image> = {};
  private prop?: Phaser.GameObjects.Image;
  private finished = false;
  private clouds?: Phaser.GameObjects.TileSprite;

  constructor() {
    super('story');
  }

  init(data: { id: string; step: number }) {
    this.story = STORIES[data.id];
    this.step = data.step;
    this.index = -1;
    this.finished = false;
    this.pets = {};
    this.prop = undefined;
    this.clouds = undefined;
  }

  create() {
    const { backdrop } = this.story;
    if (backdrop === 'sky') {
      this.add.image(0, 0, 'backyard-sky').setOrigin(0).setDisplaySize(640, 360);
      this.clouds = this.add.tileSprite(0, 60, 640, 360, 'backyard-far').setOrigin(0).setAlpha(0.9);
      this.prop = this.add.image(320, 220, 'plane');
      this.tweens.add({ targets: this.prop, y: 212, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    } else {
      addBackdrop(this, backdrop, 640);
      this.add.tileSprite(0, 320, 640, 40, `${backdrop}-top`).setOrigin(0);
      this.pets.Ricey = this.add.image(230, 321, 'ricey-idle').setOrigin(0.5, 1);
      this.pets.Ramen = this.add.image(320, 321, 'ramen-idle').setOrigin(0.5, 1);
      if (this.story.prop) this.prop = this.add.image(this.story.prop === 'goal-door' ? 470 : 410, 321, this.story.prop).setOrigin(0.5, 1);
    }

    // Dialogue box along the top.
    this.add.rectangle(320, 62, 612, 96, 0x1b1a2e, 0.9).setStrokeStyle(3, 0xfff6c2);
    this.face = this.add.image(58, 62, 'ricey-idle').setScale(0.8);
    this.name = this.add.text(110, lang === 'zh' ? 18 : 26, '', textStyle(10));
    this.body = this.add.text(110, 46, '', { ...textStyle(10), wordWrap: { width: 490 }, lineSpacing: 8 });
    const more = this.add.text(608, 98, '>', textStyle(10, '#fff6c2')).setOrigin(1);
    this.tweens.add({ targets: more, alpha: 0, duration: 400, yoyo: true, repeat: -1 });

    const kb = this.input.keyboard!;
    for (const k of ['SPACE', 'ENTER', 'Z', 'X']) kb.on(`keydown-${k}`, () => this.advance());
    this.input.on('pointerdown', () => this.advance());
    this.advance();
  }

  update(time: number, dt: number) {
    pad.poll(time);
    if (pad.anyPressed('a', 'b', 'start')) this.advance();
    if (this.clouds) this.clouds.tilePositionX += dt * 0.25;
    this.pets.Ricey?.setTexture(petTexture('ricey', 'idle', time));
    this.pets.Ramen?.setTexture(petTexture('ramen', 'idle', time, 1700));
  }

  private advance() {
    if (this.finished) return goTo(this, this.step + 1);
    if (this.typing) {
      this.typing.remove();
      this.typing = undefined;
      this.body.setText(this.full);
      return;
    }
    this.index++;
    const line = this.story.lines[this.index];
    if (!line) return this.end();
    this.show(line);
  }

  private show(line: Line) {
    const narrator = line.who === '';
    this.face.setVisible(!narrator);
    if (!narrator) this.face.setTexture(PORTRAIT[line.who]).setScale(line.who === 'Nien-Nien' ? 0.5 : 0.8);
    this.name.setText(line.who).setColor(NAME_COLOR[line.who] ?? '#ffffff');
    this.body.setX(narrator ? 40 : 110).setWordWrapWidth(narrator ? 560 : 490);
    this.body.setY(narrator ? 52 : lang === 'zh' ? 54 : 46);

    this.full = tr(line.text, line.zh);
    this.body.setText('');
    let shown = 0;
    this.typing = this.time.addEvent({
      delay: 28,
      repeat: this.full.length - 1,
      callback: () => {
        this.body.setText(this.full.slice(0, ++shown));
        if (shown >= this.full.length) this.typing = undefined;
      },
    });

    const pet = this.pets[line.who];
    if (pet) this.tweens.add({ targets: pet, y: pet.y - 14, duration: 120, yoyo: true, ease: 'Quad.easeOut' });
    if (line.cue) this.cue(line.cue);
  }

  private cue(cue: NonNullable<Line['cue']>) {
    if (cue === 'ticket') {
      const t = this.add.image(320, 250, 'ticket').setScale(0.5).setAlpha(0);
      this.tweens.add({ targets: t, scale: 1.4, alpha: 1, y: 230, duration: 400, ease: 'Back.easeOut' });
    } else if (cue === 'flush') {
      this.cameras.main.shake(500, 0.004);
    } else if (cue === 'door' && this.prop) {
      const door = this.prop;
      const nien = this.add.image(door.x, 321, 'nien').setOrigin(0.5, 1).setAlpha(0);
      this.tweens.add({ targets: door, scaleX: 0.25, x: door.x + 18, duration: 300 });
      this.tweens.add({ targets: nien, alpha: 1, duration: 300, delay: 200 });
      for (const p of Object.values(this.pets)) this.tweens.add({ targets: p, y: p.y - 30, duration: 160, yoyo: true, repeat: 2 });
    }
  }

  private end() {
    if (this.story !== STORIES.ending) return goTo(this, this.step + 1);
    // The ending gets a proper "The End" card before going back to the title.
    this.finished = true;
    const scores = Object.values(this.registry.get('scores') ?? {}) as { got: number; total: number }[];
    const got = scores.reduce((n, s) => n + s.got, 0);
    const total = scores.reduce((n, s) => n + s.total, 0);
    this.add.rectangle(320, 180, 640, 360, 0x1b1a2e, 0.85);
    this.add.text(320, 120, t('theEnd'), textStyle(28, '#fff6c2')).setOrigin(0.5);
    this.add.text(320, 170, t('endLine'), textStyle(10)).setOrigin(0.5);
    if (total) this.add.text(320, 205, t('snacks', { got, total }), textStyle(10, '#d8f0ff')).setOrigin(0.5);
    this.add.text(320, 250, t('thanks'), textStyle(12)).setOrigin(0.5);
  }
}
