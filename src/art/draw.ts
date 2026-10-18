import Phaser from 'phaser';

export type Palette = Record<string, string>;

/** Paint a character map ('.' = transparent) onto a canvas context. */
export function paint(ctx: CanvasRenderingContext2D, rows: string[], pal: Palette, scale: number, ox = 0, oy = 0) {
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const color = pal[ch];
      if (!color) return;
      ctx.fillStyle = color;
      ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale);
    });
  });
}

export function pixelTexture(scene: Phaser.Scene, key: string, rows: string[], pal: Palette, scale: number) {
  const w = Math.max(...rows.map((r) => r.length));
  canvasTexture(scene, key, w * scale, rows.length * scale, (ctx) => paint(ctx, rows, pal, scale));
}

export function canvasTexture(scene: Phaser.Scene, key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, w, h)!;
  draw(tex.getContext());
  tex.refresh();
}

/** Deterministic pseudo-random numbers so textures look the same every run. */
export function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

export function rect(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function gradient(ctx: CanvasRenderingContext2D, top: string, bottom: string, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}
