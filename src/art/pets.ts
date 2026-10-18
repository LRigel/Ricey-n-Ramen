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

/** Three rows of legs; each leg is [startColumn, width]. */
function legs(width: number, fur: string, positions: [number, number][]) {
  const rows = [0, 1, 2].map(() => Array(width).fill('.'));
  for (const [x, w] of positions) {
    for (let i = 0; i < w; i++) {
      const edge = i === 0 || i === w - 1;
      rows[0][x + i] = edge ? 'k' : fur;
      rows[1][x + i] = edge ? 'k' : fur;
      rows[2][x + i] = 'k';
    }
  }
  return rows.map((r) => r.join(''));
}

const W = 26;
const STANCES: Record<string, [number, number][]> = {
  idle: [[5, 4], [10, 3], [17, 3], [20, 4]],
  walkA: [[3, 4], [9, 3], [16, 3], [21, 4]],
  walkB: [[6, 4], [11, 3], [18, 3], [19, 4]],
  jump: [[2, 4], [7, 3], [19, 3], [22, 4]],
};

export const PET_FRAMES = ['idle', 'walkA', 'walkB', 'jump'] as const;

export const RICEY_FRAMES = Object.fromEntries(
  PET_FRAMES.map((f) => [f, [...RICEY_BODY, ...legs(W, 'w', STANCES[f])]]),
) as Record<(typeof PET_FRAMES)[number], string[]>;

// Ramen's chest is narrower than Ricey's ruff, so the front legs sit further back.
const ramenStance = (f: string) => STANCES[f].map(([x, w]) => [x > 14 ? x - 2 : x, w] as [number, number]);

export const RAMEN_FRAMES = Object.fromEntries(
  PET_FRAMES.map((f) => [f, [...RAMEN_BODY, ...legs(W, 'w', ramenStance(f))]]),
) as Record<(typeof PET_FRAMES)[number], string[]>;
