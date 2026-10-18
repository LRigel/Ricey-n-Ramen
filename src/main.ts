import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { StoryScene } from './scenes/StoryScene';
import { TitleScene } from './scenes/TitleScene';
import { setupTouchControls } from './touch';

const start = () => {
  setupTouchControls();
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: 640,
    height: 360,
    backgroundColor: '#8ecbf0',
    pixelArt: true,
    roundPixels: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { gamepad: true },
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 1400 } } },
    scene: [TitleScene, StoryScene, GameScene],
  });
  // Handy for debugging from the browser console and for automated playtests.
  (window as unknown as { game: Phaser.Game }).game = game;
};

// Wait briefly for the pixel font so text doesn't render in the fallback first.
Promise.race([document.fonts.load('16px "Press Start 2P"'), new Promise((r) => setTimeout(r, 1500))]).then(start);
