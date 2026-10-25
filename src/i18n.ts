// English and Traditional Chinese (Taiwan). Interface text lives here; story
// lines and level names carry their own `zh` next to the English.

export type Lang = 'en' | 'zh';

const KEY = 'ricey-n-ramen:lang';

function initialLang(): Lang {
  const param = new URLSearchParams(location.search).get('lang');
  if (param) return param.startsWith('zh') ? 'zh' : 'en';
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'en' || saved === 'zh') return saved;
  } catch {
    // Storage blocked: fall through to the browser language.
  }
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export let lang: Lang = initialLang();
document.documentElement.lang = lang === 'zh' ? 'zh-Hant-TW' : 'en';

export function setLang(next: Lang) {
  lang = next;
  document.documentElement.lang = next === 'zh' ? 'zh-Hant-TW' : 'en';
  try {
    localStorage.setItem(KEY, next);
  } catch {
    // Not remembered between visits, but works for this one.
  }
}

/** Make sure the font for `l` has downloaded before drawing text with it. */
export function loadFont(l: Lang = lang): Promise<unknown> {
  const face = l === 'zh' ? '11px "Cubic 11"' : '16px "Press Start 2P"';
  return Promise.race([document.fonts.load(face), new Promise((r) => setTimeout(r, 2500))]);
}

export const fontFamily = () => (lang === 'zh' ? '"Cubic 11", "Press Start 2P", monospace' : '"Press Start 2P", monospace');

/**
 * Cubic 11 is drawn on an 11px grid, so sizes snap to multiples of 11 to stay
 * crisp. Chinese needs 22px to be as readable as the 10px English font.
 */
export const fontSize = (px: number) => (lang === 'en' ? px : px <= 12 ? 22 : px <= 24 ? 33 : 44);

/** Font stack that can draw both scripts, for text like the language button. */
export const BOTH_FONTS = '"Press Start 2P", "Cubic 11", monospace';

/** Pick the current language from an English string and its translation. */
export const tr = (en: string, zh?: string) => (lang === 'zh' && zh ? zh : en);

const UI = {
  subtitle: ['The Search for Nien-Nien', '尋找 Nien-Nien'],
  startGame: ['Start', '開始遊戲'],
  newGame: ['New game', '重新開始'],
  continue: ['Continue', '繼續遊戲'],
  otherLanguage: ['中文', 'English'],
  swapHint: ['(C to swap)', '（按 C 換角）'],
  swapHintPad: ['(Y to swap)', '（按 Y 換角）'],
  climbHint: ['Walk into a wall to climb it', '走向牆壁就能爬上去'],
  dashHint: ['Jump again in mid-air to dash', '空中再跳一次可以衝刺'],
  controls: ['Arrows/WASD move   Space jump   C swap', '方向鍵/WASD 移動　空白鍵 跳　C 換角'],
  controlsPad: ['D-pad move   A jump   Y swap   Start pause', '十字鍵 移動　A 跳　Y 換角　Start 暫停'],
  next: ['Press Space', '按空白鍵繼續'],
  nextTouch: ['Tap JUMP', '點「跳」繼續'],
  nextPad: ['Press A', '按 A 繼續'],
  paused: ['PAUSED', '暫停'],
  pauseHelp: ['P: resume   Q: quit to title', 'P：繼續　Q：回到標題'],
  pauseHelpPad: ['Start: resume   B: quit to title', 'Start：繼續　B：回到標題'],
  treats: ['Treats', '零食'],
  dumplings: ['Dumplings', '小籠包'],
  bubbletea: ['Bubble tea', '珍珠奶茶'],
  pineapplecakes: ['Pineapple cakes', '鳳梨酥'],
  theEnd: ['THE END', '完'],
  endLine: ['Nien-Nien was in the bathroom all along.', '原來 Nien-Nien 一直都在廁所裡。'],
  snacks: ['Snacks found: {got}/{total}', '找到的點心：{got}/{total}'],
  thanks: ['Thanks for playing!', '謝謝遊玩！'],
  jump: ['JUMP', '跳'],
  swap: ['SWAP', '換'],
  rotate: ['Turn your phone sideways to play', '請把手機轉成橫向來玩'],
} satisfies Record<string, [string, string]>;

export type UiKey = keyof typeof UI;

export function t(key: UiKey, vars: Record<string, string | number> = {}) {
  const s = UI[key][lang === 'zh' ? 1 : 0];
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}
