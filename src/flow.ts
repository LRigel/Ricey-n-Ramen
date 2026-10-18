import Phaser from 'phaser';
import { FLOW } from './story';

const SAVE_KEY = 'ricey-n-ramen:step';

export function savedStep(): number {
  try {
    return Number(localStorage.getItem(SAVE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function save(step: number) {
  try {
    localStorage.setItem(SAVE_KEY, String(step));
  } catch {
    // Private mode or blocked storage: the game still works, it just won't remember.
  }
}

/** Start whatever comes at `step` in the story; past the end goes back to the title. */
export function goTo(scene: Phaser.Scene, step: number) {
  const s = FLOW[step];
  if (!s) {
    save(0);
    scene.scene.start('title');
    return;
  }
  if (step === 0) scene.registry.set('pickups', { got: 0, total: 0 });
  save(step);
  if ('story' in s) scene.scene.start('story', { id: s.story, step });
  else scene.scene.start('game', { level: s.level, step });
}

export const FONT = '"Press Start 2P", monospace';

export function textStyle(size: number, color = '#ffffff'): Phaser.Types.GameObjects.Text.TextStyle {
  return { fontFamily: FONT, fontSize: `${size}px`, color, stroke: '#1b1a2e', strokeThickness: Math.max(3, size / 3) };
}
