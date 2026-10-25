import Phaser from 'phaser';
import { petTexture } from '../art/animate';
import { addBackdrop, makeTextures } from '../art/themes';
import { goTo, savedStep, textStyle } from '../flow';
import { BOTH_FONTS, lang, setLang, t } from '../i18n';
import { pad } from '../pad';
import { FLOW } from '../story';

interface MenuItem {
  text: Phaser.GameObjects.Text;
  label: string;
  action: () => void;
}

export class TitleScene extends Phaser.Scene {
  private pets: Phaser.GameObjects.Image[] = [];
  private menu: MenuItem[] = [];
  private selected = 0;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;

  constructor() {
    super('title');
  }

  create() {
    this.pets = [];
    this.menu = [];
    this.selected = 0;
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

    this.add.text(320, 62, 'Ricey n Ramen', textStyle(32, '#fff6c2')).setOrigin(0.5);
    this.add.text(320, 110, t('subtitle'), textStyle(12)).setOrigin(0.5);

    // A small menu that works with keys, a controller or taps.
    const saved = savedStep();
    const switchLang = () => {
      setLang(lang === 'en' ? 'zh' : 'en');
      this.scene.restart();
    };
    if (saved > 0) this.addItem(t('continue'), () => goTo(this, saved));
    this.addItem(t(saved > 0 ? 'newGame' : 'startGame'), () => goTo(this, 0));
    // The language item names the other language, in that language's own font size.
    this.addItem(t('otherLanguage'), switchLang, { fontFamily: BOTH_FONTS, fontSize: lang === 'en' ? '22px' : '10px' });
    this.highlight();

    this.keys = this.input.keyboard!.addKeys('UP,DOWN,W,S,SPACE,ENTER,Z,L,C') as Record<string, Phaser.Input.Keyboard.Key>;
    this.keys.L.once('down', switchLang);
    if (saved > 0) this.keys.C.once('down', () => goTo(this, saved));

    // The two of them pacing around the yard.
    this.pets = ['ricey', 'ramen'].map((key, i) => {
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
  }

  private addItem(label: string, action: () => void, style: Phaser.Types.GameObjects.Text.TextStyle = {}) {
    const i = this.menu.length;
    const text = this.add
      .text(320, 170 + i * 36, label, { ...textStyle(12), ...style })
      .setOrigin(0.5)
      .setPadding(10, 6)
      .setInteractive({ useHandCursor: true });
    text.on('pointerdown', () => {
      this.selected = i;
      action();
    });
    text.on('pointerover', () => {
      this.selected = i;
      this.highlight();
    });
    this.menu.push({ text, label, action });
  }

  private highlight() {
    this.menu.forEach((m, i) => {
      const on = i === this.selected;
      m.text.setText(on ? `> ${m.label} <` : m.label).setColor(on ? '#fff6c2' : '#d8f0ff').setAlpha(on ? 1 : 0.75);
    });
  }

  update(time: number) {
    this.pets[0]?.setTexture(petTexture('ricey', 'walk', time));
    this.pets[1]?.setTexture(petTexture('ramen', 'walk', time, 45));
    if (!this.menu.length) return;

    pad.poll(time);
    const jd = Phaser.Input.Keyboard.JustDown;
    const k = this.keys;
    const move = (jd(k.DOWN) || jd(k.S) || pad.pressed('down') ? 1 : 0) - (jd(k.UP) || jd(k.W) || pad.pressed('up') ? 1 : 0);
    if (move) {
      this.selected = (this.selected + move + this.menu.length) % this.menu.length;
      this.highlight();
    }
    if (jd(k.SPACE) || jd(k.ENTER) || jd(k.Z) || pad.anyPressed('a', 'start')) this.menu[this.selected].action();
  }
}
