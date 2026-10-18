// On-screen controls for phones and tablets. They're plain HTML laid over the
// canvas (easier multi-touch than in-canvas buttons) and feed a shared state
// that GameScene reads alongside the keyboard and gamepad.

import { fontFamily, t } from './i18n';

export const isTouch =
  new URLSearchParams(location.search).has('touch') || window.matchMedia('(pointer: coarse)').matches;

export const touch = {
  left: false,
  right: false,
  down: false,
  jump: false,
  swap: false,
  jumpPressed: false,
  swapPressed: false,
  /** Read a "just pressed" flag and clear it. */
  consume(flag: 'jumpPressed' | 'swapPressed') {
    const v = this[flag];
    this[flag] = false;
    return v;
  },
};

let controls: HTMLElement | undefined;

const ARROW = (rotate: number) =>
  `<svg viewBox="0 0 10 10" width="26" height="26" style="transform:rotate(${rotate}deg)"><path d="M3 1 L8 5 L3 9 Z" fill="currentColor"/></svg>`;

const CSS = `
#touch { position: fixed; inset: 0; pointer-events: none; z-index: 10; font-family: "Press Start 2P", monospace; }
#touch .pad { display: none; }
#touch.show .pad { display: flex; }
#touch button, #touch .dpad { pointer-events: auto; touch-action: none; user-select: none; -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent; color: #fff; background: rgba(27, 26, 46, 0.45);
  border: 3px solid rgba(255, 246, 194, 0.7); border-radius: 50%; font: inherit; padding: 0; }
#touch .held { background: rgba(255, 246, 194, 0.45); }
#touch .left { position: absolute; left: max(16px, env(safe-area-inset-left)); bottom: max(16px, env(safe-area-inset-bottom));
  align-items: flex-end; gap: 10px; }
#touch .dpad { display: flex; width: 150px; height: 72px; border-radius: 36px; overflow: hidden; padding: 0; }
#touch .dpad span { flex: 1; display: grid; place-items: center; }
#touch .dpad span + span { border-left: 2px solid rgba(255, 246, 194, 0.4); }
#touch .down { width: 48px; height: 48px; display: grid; place-items: center; }
#touch .right { position: absolute; right: max(16px, env(safe-area-inset-right)); bottom: max(16px, env(safe-area-inset-bottom));
  align-items: flex-end; gap: 12px; }
#touch .jump { width: 84px; height: 84px; font-size: 11px; }
#touch .swap { width: 58px; height: 58px; font-size: 9px; margin-bottom: 70px; }
#touch .fs { position: absolute; bottom: max(8px, env(safe-area-inset-bottom)); left: 50%; transform: translateX(-50%);
  width: 40px; height: 40px; border-radius: 8px; font-size: 18px; display: grid; place-items: center; opacity: 0.7; }
#rotate { display: none; position: fixed; inset: 0; z-index: 20; background: #1b1a2e; color: #fff6c2;
  font-family: "Press Start 2P", monospace; font-size: 14px; line-height: 2; text-align: center; place-items: center; padding: 24px; }
@media (orientation: portrait) { #rotate.touch { display: grid; } }
`;

export function setupTouchControls() {
  if (!isTouch) return;
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.append(style);

  const rotate = document.createElement('div');
  rotate.id = 'rotate';
  rotate.className = 'touch';
  rotate.textContent = t('rotate');
  document.body.append(rotate);

  controls = document.createElement('div');
  controls.id = 'touch';
  controls.innerHTML = `
    <div class="pad left">
      <div class="dpad"><span>${ARROW(180)}</span><span>${ARROW(0)}</span></div>
      <button class="down">${ARROW(90)}</button>
    </div>
    <div class="pad right">
      <button class="swap"></button>
      <button class="jump"></button>
    </div>
    ${document.fullscreenEnabled ? '<button class="fs" aria-label="Fullscreen">&#x26F6;</button>' : ''}`;
  document.body.append(controls);

  // The d-pad tracks every finger on it, so you can slide between left and right.
  const dpad = controls.querySelector<HTMLElement>('.dpad')!;
  const fingers = new Map<number, number>();
  const updatePad = () => {
    const r = dpad.getBoundingClientRect();
    const xs = [...fingers.values()];
    touch.left = xs.some((x) => x < r.left + r.width / 2);
    touch.right = xs.some((x) => x >= r.left + r.width / 2);
    dpad.children[0].classList.toggle('held', touch.left);
    dpad.children[1].classList.toggle('held', touch.right);
  };
  dpad.addEventListener('pointerdown', (e) => {
    dpad.setPointerCapture(e.pointerId);
    fingers.set(e.pointerId, e.clientX);
    updatePad();
  });
  dpad.addEventListener('pointermove', (e) => {
    if (!fingers.has(e.pointerId)) return;
    fingers.set(e.pointerId, e.clientX);
    updatePad();
  });
  for (const ev of ['pointerup', 'pointercancel'] as const) {
    dpad.addEventListener(ev, (e) => {
      fingers.delete(e.pointerId);
      updatePad();
    });
  }

  const hold = (sel: string, onDown: () => void, onUp: () => void) => {
    const el = controls!.querySelector<HTMLElement>(sel)!;
    el.addEventListener('pointerdown', (e) => {
      el.setPointerCapture(e.pointerId);
      el.classList.add('held');
      onDown();
    });
    for (const ev of ['pointerup', 'pointercancel'] as const) {
      el.addEventListener(ev, () => {
        el.classList.remove('held');
        onUp();
      });
    }
  };
  hold('.jump', () => ((touch.jump = true), (touch.jumpPressed = true)), () => (touch.jump = false));
  hold('.swap', () => ((touch.swap = true), (touch.swapPressed = true)), () => (touch.swap = false));
  hold('.down', () => (touch.down = true), () => (touch.down = false));

  controls.querySelector('.fs')?.addEventListener('click', async () => {
    if (document.fullscreenElement) return document.exitFullscreen();
    await document.documentElement.requestFullscreen().catch(() => {});
    // Not every browser allows this, and that's fine.
    await (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape').catch(() => {});
  });

  document.addEventListener('contextmenu', (e) => e.preventDefault());
}

/** Show the movement buttons only while a level is being played. */
export function showTouchPad(show: boolean) {
  if (controls) {
    // Labels follow the language, which can change between levels.
    controls.style.fontFamily = fontFamily();
    controls.querySelector('.jump')!.textContent = t('jump');
    controls.querySelector('.swap')!.textContent = t('swap');
    const rotate = document.getElementById('rotate')!;
    rotate.textContent = t('rotate');
    rotate.style.fontFamily = fontFamily();
  }
  controls?.classList.toggle('show', show);
  Object.assign(touch, { left: false, right: false, down: false, jump: false, swap: false, jumpPressed: false, swapPressed: false });
}
