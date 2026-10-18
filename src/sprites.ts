import Phaser from 'phaser';

// Placeholder pixel art, drawn from character maps. Each character in a row is
// one pixel; '.' is transparent. These get replaced once we have real sprite
// sheets based on photos of Ricey and Ramen.

type Palette = Record<string, string>;

export const PIXEL = 3; // on-screen size of one art pixel

const RICEY_PAL: Palette = {
  k: '#2b1d14', // outline
  b: '#8a6a4f', // tabby base
  d: '#5a4130', // stripes
  w: '#f1e3cf', // cream chest / paws
  e: '#1a1a1a',
  p: '#e89aa0',
};

// Maine Coon: ear tufts, big fluffy striped tail.
const RICEY = [
  '..............k...k...',
  '.............kdk.kdk..',
  '..kkk........kbbkbbk..',
  '.kbdbk.......kbbbbbbk.',
  'kbdbdbk......kbebbebk.',
  'kbbdbbk......kbbbpbbk.',
  '.kbbdbk.kkkkkkwbwwwbk.',
  '..kbbbkkbbdbbdbkwwwk..',
  '...kbbbbbdbbdbbdbbk...',
  '....kbbbbbbbbbbbbbbk..',
  '....kbbbbbbbbbbbbbbk..',
  '....kwbbbwbbbbbwbbwk..',
  '....kwk.kwk...kwk.kwk.',
  '....kk..kk....kk...kk.',
];

const RAMEN_PAL: Palette = {
  k: '#3a2214',
  o: '#d9803a', // red sesame-ish shiba orange
  w: '#f6ead8', // urajiro (white markings)
  e: '#111111',
  p: '#222222',
};

// Shiba Inu: pointy ears, curled tail, white cheeks and chest.
const RAMEN = [
  '..............k...k...',
  '.............kok.kok..',
  '..kkk........kooooook.',
  '.kowwk.......koeooeok.',
  '.kow.kk......kowwwwpk.',
  '..kwwok.kkkkkkwwwwwwk.',
  '...kooookooooooowwwk..',
  '....kooooooooooooowk..',
  '....kooooooooooooowk..',
  '....kwooooooooooowwk..',
  '....kwk.kwk...kwk.kwk.',
  '....kk..kk....kk...kk.',
];

const TREAT = [
  '..kkkk..',
  '.kyyyyk.',
  'kyyrryyk',
  'kyrrrryk',
  'kyyrryyk',
  '.kyyyyk.',
  '..kkkk..',
];

const BOWL = [
  '...kkkkkkkk...',
  '..kfffffffk...',
  '.kfbfbfbffbk..',
  'kkkkkkkkkkkkk.',
  'krrrrrrrrrrrk.',
  'krrwwwrrrrrrk.',
  '.krrrrrrrrrk..',
  '..kkkkkkkkk...',
];

const FLAG = [
  'kk......',
  'kffff...',
  'kfffff..',
  'kffff...',
  'kk......',
  'kk......',
  'kk......',
  'kk......',
  'kk......',
  'kk......',
];

const MISC_PAL: Palette = {
  k: '#2a1a12',
  y: '#f2c25c',
  r: '#c2452f',
  w: '#ffffff',
  f: '#8c5a2b',
  b: '#e7c27a',
};

function pixelTexture(scene: Phaser.Scene, key: string, rows: string[], pal: Palette, scale = PIXEL) {
  const w = Math.max(...rows.map((r) => r.length));
  const tex = scene.textures.createCanvas(key, w * scale, rows.length * scale)!;
  const ctx = tex.getContext();
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const color = pal[ch];
      if (!color) return;
      ctx.fillStyle = color;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    });
  });
  tex.refresh();
}

function canvasTexture(scene: Phaser.Scene, key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const tex = scene.textures.createCanvas(key, w, h)!;
  draw(tex.getContext());
  tex.refresh();
}

export const TILE = 32;

export function makeTextures(scene: Phaser.Scene) {
  pixelTexture(scene, 'ricey', RICEY, RICEY_PAL);
  pixelTexture(scene, 'ramen', RAMEN, RAMEN_PAL);
  pixelTexture(scene, 'treat', TREAT, MISC_PAL);
  pixelTexture(scene, 'bowl', BOWL, MISC_PAL, 4);
  pixelTexture(scene, 'flag', FLAG, MISC_PAL, 4);
  pixelTexture(scene, 'flag-on', FLAG, { ...MISC_PAL, f: '#4fbf6a' }, 4);

  const speck = (ctx: CanvasRenderingContext2D, color: string, seed: number) => {
    ctx.fillStyle = color;
    for (let i = 0; i < 6; i++) {
      const x = (seed * 7 + i * 13) % 28;
      const y = 10 + ((seed * 5 + i * 11) % 20);
      ctx.fillRect(x, y, 4, 4);
    }
  };

  canvasTexture(scene, 'grass', TILE, TILE, (ctx) => {
    ctx.fillStyle = '#7a4e2d';
    ctx.fillRect(0, 0, TILE, TILE);
    speck(ctx, '#5f3a20', 1);
    ctx.fillStyle = '#5fb347';
    ctx.fillRect(0, 0, TILE, 10);
    ctx.fillStyle = '#3f8a32';
    ctx.fillRect(0, 10, TILE, 2);
    ctx.fillRect(4, 12, 4, 2);
    ctx.fillRect(20, 12, 4, 2);
    ctx.fillStyle = '#8fd76a';
    ctx.fillRect(0, 0, TILE, 2);
  });

  canvasTexture(scene, 'dirt', TILE, TILE, (ctx) => {
    ctx.fillStyle = '#7a4e2d';
    ctx.fillRect(0, 0, TILE, TILE);
    speck(ctx, '#5f3a20', 3);
  });

  canvasTexture(scene, 'crate', TILE, TILE, (ctx) => {
    ctx.fillStyle = '#3a2214';
    ctx.fillRect(0, 0, TILE, TILE);
    ctx.fillStyle = '#c08a4a';
    ctx.fillRect(2, 2, TILE - 4, TILE - 4);
    ctx.fillStyle = '#9a6a34';
    ctx.fillRect(2, 14, TILE - 4, 4);
    ctx.fillRect(14, 2, 4, TILE - 4);
  });

  canvasTexture(scene, 'thorns', TILE, TILE, (ctx) => {
    ctx.fillStyle = '#2f5a2a';
    for (let i = 0; i < 4; i++) {
      const x = i * 8;
      ctx.beginPath();
      ctx.moveTo(x, TILE);
      ctx.lineTo(x + 4, 8);
      ctx.lineTo(x + 8, TILE);
      ctx.fill();
    }
    ctx.fillStyle = '#c94a6a';
    ctx.fillRect(6, 18, 4, 4);
    ctx.fillRect(22, 14, 4, 4);
  });

  canvasTexture(scene, 'hills', 640, 200, (ctx) => {
    ctx.fillStyle = '#9fd3a8';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(i * 200 + 60, 200, 160, 120, 0, Math.PI, 0);
      ctx.fill();
    }
  });

  canvasTexture(scene, 'cloud', 96, 40, (ctx) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(16, 16, 64, 20);
    ctx.fillRect(28, 6, 28, 12);
    ctx.fillRect(52, 10, 20, 8);
  });
}
