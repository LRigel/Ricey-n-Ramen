// Pixel art for Ricey and Ramen, drawn from photos of the real pets.
// Each string is one row of pixels; '.' is transparent. Bodies are shared and
// the legs are generated, so each pet gets idle / walk A / walk B / jump frames.

import type { Palette } from './draw';

// Ricey: cream-apricot long-haired Maine Coon, green eyes, ear tufts,
// big pale plume tail, fluffy chest ruff.
export const RICEY_PAL: Palette = {
  k: '#7a4a2a', // outline (warm, not black, to keep the fluff soft)
  b: '#e9b47e', // apricot base
  l: '#f6d6aa', // light fur / tail plume
  d: '#cf8f58', // shading
  w: '#fcefd9', // cream ruff, belly and paws
  g: '#86b25a', // green eyes
  e: '#2a1a10',
  p: '#e8948c', // nose / inner ear
};

const RICEY_BODY = [
  '.................k....k...',
  '..kkk...........kpk..kpk..',
  '.kllbk.........kbbbkkbbbk.',
  'kllbbk.........kbbbbbbbbbk',
  'klbbdk.........kbbgebbgebk',
  'kbbdbk.........kblbbpbblbk',
  '.kbbdk.........kwwlwwlwwk.',
  '..kbbdkkkkkkkkkkkwwwwwwk..',
  '...kbdllbbbbbbbbbbwwwwwk..',
  '....kbdbbbbdbbbbdbbbwwwk..',
  '....kbbdbbbbdbbbbdbbbwwk..',
  '....kbbbbbbbbbbbbbbbbbbk..',
  '....kdbbbbbbbbbbbbbbbbbk..',
  '....kddwwbbbbbbbbbwwbbdk..',
];

// Ramen: red Shiba Inu, white cheeks/chest/socks, curled tail,
// pink harness with a gold bone tag.
export const RAMEN_PAL: Palette = {
  k: '#5a2e14',
  o: '#d9853f', // red shiba coat
  d: '#b8682c',
  w: '#fbeedd', // urajiro
  e: '#1a1a1a',
  p: '#f0b0a0',
  h: '#e2508f', // pink harness
  y: '#f0c04c', // gold tag
};

const RAMEN_BODY = [
  '.................k...k....',
  '................kpk.kpk...',
  '....kkk.........kopkkpok..',
  '...kowwk........kooooooook',
  '...kwwok........koeoooeook',
  '....kook........kowwewwook',
  '....kook........kwwwwwwwk.',
  '....kokkkkkkkkkhwwwwwk....',
  '....kooooooooooohwwwwk....',
  '....koooooooooohhwwywk....',
  '....kdooooooooohhwwwwk....',
  '....kddooooooooohwwwwk....',
  '....kwddoooooooodwwwk.....',
];

/** Rows of legs (3 standing, more when dangling); each leg is [startColumn, width]. */
function legs(width: number, fur: string, positions: [number, number][], height = 3) {
  const rows = Array.from({ length: height }, () => Array(width).fill('.'));
  for (const [x, w] of positions) {
    for (let i = 0; i < w; i++) {
      const edge = i === 0 || i === w - 1;
      for (let y = 0; y < height - 1; y++) rows[y][x + i] = edge ? 'k' : fur;
      rows[height - 1][x + i] = 'k';
    }
  }
  return rows.map((r) => r.join(''));
}

/** Move the pixels inside a box by (dx, dy); used to sway tails. */
function shiftBox(rows: string[], x0: number, x1: number, y0: number, y1: number, dx: number, dy: number) {
  const grid = rows.map((r) => [...r]);
  const out = rows.map((r) => [...r]);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out[y][x] = '.';
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const ch = grid[y][x];
      if (ch !== '.' && out[y + dy]?.[x + dx] !== undefined) out[y + dy][x + dx] = ch;
    }
  }
  return out.map((r) => r.join(''));
}

/** Close the eyes on one row by turning eye pixels into outline. */
const blink = (rows: string[], row: number, eyes: string) =>
  rows.map((r, y) => (y === row ? [...r].map((c) => (eyes.includes(c) ? 'k' : c)).join('') : r));

const W = 26;
type Stance = { legs: [number, number][]; height?: number };
const STANCES: Record<string, Stance> = {
  idle: { legs: [[5, 4], [10, 3], [17, 3], [20, 4]] },
  walk1: { legs: [[3, 4], [10, 3], [16, 3], [22, 4]] },
  walk2: { legs: [[5, 4], [8, 3], [18, 3], [20, 4]] },
  walk3: { legs: [[7, 4], [4, 3], [20, 3], [16, 4]] },
  walk4: { legs: [[6, 4], [9, 3], [17, 3], [21, 4]] },
  rise: { legs: [[2, 4], [7, 3], [19, 3], [22, 4]] },
  fall: { legs: [[5, 4], [10, 3], [17, 3], [20, 4]], height: 4 },
};

interface PetArt {
  body: string[];
  tail: [x0: number, x1: number, y0: number, y1: number, dx: number, dy: number];
  eyeRow: number;
  eyes: string;
  frontShift: number; // Ramen's chest is narrower, so the front legs sit further back
}

const ART: Record<'ricey' | 'ramen', PetArt> = {
  ricey: { body: RICEY_BODY, tail: [0, 5, 0, 5, 1, 0], eyeRow: 4, eyes: 'ge', frontShift: 0 },
  ramen: { body: RAMEN_BODY, tail: [2, 7, 1, 6, 0, -1], eyeRow: 4, eyes: 'e', frontShift: -2 },
};

/**
 * Every frame for a pet, keyed `${stance}-${tail}` (tail 0 = rest, 1 = swayed),
 * plus `blink-${tail}` and a plain `idle` used for portraits.
 */
function buildFrames(pet: PetArt) {
  const frames: Record<string, string[]> = {};
  const tails = [pet.body, shiftBox(pet.body, ...pet.tail)];
  for (const [name, st] of Object.entries(STANCES)) {
    const positions = st.legs.map(([x, w]) => [x > 14 ? x + pet.frontShift : x, w] as [number, number]);
    tails.forEach((body, t) => (frames[`${name}-${t}`] = [...body, ...legs(W, 'w', positions, st.height)]));
  }
  tails.forEach((_, t) => (frames[`blink-${t}`] = blink(frames[`idle-${t}`], pet.eyeRow, pet.eyes)));
  frames.idle = frames['idle-0'];
  return frames;
}

export const RICEY_FRAMES = buildFrames(ART.ricey);
export const RAMEN_FRAMES = buildFrames(ART.ramen);
