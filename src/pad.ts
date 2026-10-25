// Gamepad input via the standard Gamepad API mapping (Xbox-style layout:
// A bottom, B right, X left, Y top). Scenes call poll() once per frame, then
// ask held() / pressed(). In the Android app the controller is read natively
// (MainActivity.java) and arrives through window.__nativePad instead.

const BUTTONS = { a: 0, b: 1, x: 2, y: 3, lb: 4, rb: 5, select: 8, start: 9, up: 12, down: 13, left: 14, right: 15 } as const;
const STICK = 0.5;

export type PadButton = keyof typeof BUTTONS;

let now = new Set<string>();
let prev = new Set<string>();
let lastPoll = -1;
const activeListeners: (() => void)[] = [];

// Native controller state from the Android app. Presses are also latched until
// the next poll, so a tap shorter than one frame still counts.
const nativeHeld = new Set<string>();
const nativeTapped = new Set<string>();
let nativeAxes = [0, 0, 0, 0];
(window as unknown as { __nativePad: object }).__nativePad = {
  button(name: string, down: boolean) {
    if (down) {
      nativeHeld.add(name);
      nativeTapped.add(name);
    } else nativeHeld.delete(name);
  },
  axes(x: number, y: number, hatX: number, hatY: number) {
    nativeAxes = [x, y, hatX, hatY];
  },
};

function addStick(set: Set<string>, x: number, y: number) {
  if (x < -STICK) set.add('left');
  if (x > STICK) set.add('right');
  if (y < -STICK) set.add('up');
  if (y > STICK) set.add('down');
}

export const pad = {
  /** True once any controller input has been seen this session. */
  active: false,

  /** Read every connected controller. Safe to call more than once per frame. */
  poll(time: number) {
    if (time === lastPoll) return;
    lastPoll = time;
    prev = now;
    now = new Set();
    for (const gp of navigator.getGamepads?.() ?? []) {
      if (!gp) continue;
      for (const [name, i] of Object.entries(BUTTONS)) if (gp.buttons[i]?.pressed) now.add(name);
      addStick(now, gp.axes[0] ?? 0, gp.axes[1] ?? 0); // the left stick counts as the d-pad
    }
    for (const b of [...nativeHeld, ...nativeTapped]) now.add(b);
    nativeTapped.clear();
    addStick(now, nativeAxes[0], nativeAxes[1]);
    addStick(now, nativeAxes[2], nativeAxes[3]);
    if (now.size && !this.active) {
      this.active = true;
      activeListeners.forEach((fn) => fn());
    }
  },

  held: (b: PadButton) => now.has(b),
  pressed: (b: PadButton) => now.has(b) && !prev.has(b),
  anyPressed: (...bs: PadButton[]) => bs.some((b) => now.has(b) && !prev.has(b)),

  /** Run `fn` the first time a controller is used (e.g. to hide touch buttons). */
  onActive(fn: () => void) {
    activeListeners.push(fn);
  },
};
