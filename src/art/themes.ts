import Phaser from 'phaser';
import { canvasTexture, gradient, paint, pixelTexture, rect, rng } from './draw';
import { RAMEN_FRAMES, RAMEN_PAL, RICEY_FRAMES, RICEY_PAL } from './pets';
import type { UiKey } from '../i18n';
import { SPRITES } from './props';

export const TILE = 32;
export const PIXEL = 3;
const VIEW_W = 640;
const VIEW_H = 360;

type Ctx = CanvasRenderingContext2D;

export type ThemeId = 'backyard' | 'bush' | 'market' | 'jiufen' | 'taipei' | 'house';

export interface Theme {
  sky: [string, string];
  collectible: string; // sprite key
  collectibleName: UiKey;
  enemy?: string; // ground patrol sprite key
  bird?: string; // flying patrol sprite key prefix
  goal: string;
  top(ctx: Ctx): void;
  fill(ctx: Ctx): void;
  block(ctx: Ctx): void;
  ledge(ctx: Ctx): void; // one-way platform, drawn in the top 12px
  hazard(ctx: Ctx): void;
  far(ctx: Ctx): void; // slow parallax layer, 640x360, ground line at y=320
  near(ctx: Ctx): void; // faster parallax layer
}

const speckle = (ctx: Ctx, color: string, seed: number, y0 = 10, n = 6, size = 4) => {
  const r = rng(seed);
  for (let i = 0; i < n; i++) rect(ctx, color, Math.floor(r() * 7) * 4, y0 + Math.floor(r() * ((32 - y0) / 4)) * 4, size, size);
};

const spikes = (ctx: Ctx, color: string, tip: string, y0: number) => {
  for (let i = 0; i < 4; i++) {
    const x = i * 8;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, TILE);
    ctx.lineTo(x + 4, y0);
    ctx.lineTo(x + 8, TILE);
    ctx.fill();
    rect(ctx, tip, x + 3, y0, 2, 3);
  }
};

const lanternString = (ctx: Ctx, y: number, sag: number, color: string, spacing: number) => {
  ctx.strokeStyle = '#2a1a1a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x <= VIEW_W; x += 8) ctx.lineTo(x, y + Math.sin((x / VIEW_W) * Math.PI * 2) * sag);
  ctx.stroke();
  for (let x = spacing / 2; x < VIEW_W; x += spacing) {
    const ly = y + Math.sin((x / VIEW_W) * Math.PI * 2) * sag;
    rect(ctx, '#2a1a1a', x - 1, ly, 2, 6);
    rect(ctx, color, x - 7, ly + 6, 14, 16);
    rect(ctx, '#ffd24a', x - 5, ly + 9, 10, 10);
    rect(ctx, color, x - 3, ly + 11, 6, 6);
    rect(ctx, '#ffd24a', x - 2, ly + 22, 4, 4);
  }
};

export const THEMES: Record<ThemeId, Theme> = {
  backyard: {
    sky: ['#7cc4f0', '#cdeefc'],
    collectible: 'treat',
    collectibleName: 'treats',
    goal: 'goal-gate',
    top(ctx) {
      this.fill(ctx);
      rect(ctx, '#5fb347', 0, 0, TILE, 10);
      rect(ctx, '#3f8a32', 0, 10, TILE, 2);
      rect(ctx, '#3f8a32', 4, 12, 4, 2);
      rect(ctx, '#3f8a32', 20, 12, 4, 2);
      rect(ctx, '#8fd76a', 0, 0, TILE, 2);
    },
    fill(ctx) {
      rect(ctx, '#7a4e2d', 0, 0, TILE, TILE);
      speckle(ctx, '#5f3a20', 3, 0);
    },
    block(ctx) {
      rect(ctx, '#3a2214', 0, 0, TILE, TILE);
      rect(ctx, '#c08a4a', 2, 2, 28, 28);
      rect(ctx, '#9a6a34', 2, 14, 28, 4);
      rect(ctx, '#9a6a34', 14, 2, 4, 28);
    },
    ledge(ctx) {
      rect(ctx, '#3a2214', 0, 0, TILE, 10);
      rect(ctx, '#b07a44', 0, 2, TILE, 6);
    },
    hazard(ctx) {
      spikes(ctx, '#2f5a2a', '#c94a6a', 8);
    },
    far(ctx) {
      ctx.fillStyle = '#9fd3a8';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.ellipse(i * 200 + 60, 320, 160, 120, 0, Math.PI, 0);
        ctx.fill();
      }
      const r = rng(7);
      for (let i = 0; i < 3; i++) {
        const x = r() * 560;
        const y = 30 + r() * 80;
        rect(ctx, '#ffffff', x, y + 10, 64, 20);
        rect(ctx, '#ffffff', x + 12, y, 28, 12);
      }
    },
    near(ctx) {
      // Paling fence with a rotary clothesline poking over it.
      for (let x = 0; x < VIEW_W; x += 12) {
        rect(ctx, '#9b8b74', x, 236, 10, 84);
        rect(ctx, '#b5a58c', x, 236, 3, 84);
      }
      rect(ctx, '#7a6c58', 0, 250, VIEW_W, 4);
      rect(ctx, '#7a6c58', 0, 300, VIEW_W, 4);
      rect(ctx, '#8a8f96', 418, 150, 4, 90);
      rect(ctx, '#8a8f96', 360, 150, 120, 3);
      ctx.strokeStyle = '#c8ccd0';
      ctx.beginPath();
      ctx.moveTo(360, 152);
      ctx.lineTo(420, 180);
      ctx.lineTo(480, 152);
      ctx.stroke();
      rect(ctx, '#e2508f', 384, 154, 12, 16);
      rect(ctx, '#4a8ad6', 440, 154, 14, 20);
    },
  },

  bush: {
    sky: ['#f4a261', '#fde4b0'],
    collectible: 'treat',
    collectibleName: 'treats',
    bird: 'magpie',
    goal: 'goal-sign',
    top(ctx) {
      this.fill(ctx);
      rect(ctx, '#d8b45a', 0, 0, TILE, 8);
      rect(ctx, '#b89440', 0, 8, TILE, 2);
      for (let x = 2; x < TILE; x += 6) rect(ctx, '#e8cc78', x, 0, 2, 4);
    },
    fill(ctx) {
      rect(ctx, '#b5542f', 0, 0, TILE, TILE);
      speckle(ctx, '#923f20', 11, 0);
    },
    block(ctx) {
      rect(ctx, '#5a4a3e', 0, 0, TILE, TILE);
      rect(ctx, '#9a8a7a', 2, 2, 28, 28);
      rect(ctx, '#b6a696', 4, 4, 12, 6);
      rect(ctx, '#7a6a5a', 18, 20, 10, 8);
    },
    ledge(ctx) {
      rect(ctx, '#4a3a2e', 0, 0, TILE, 10);
      rect(ctx, '#d8d0c0', 0, 2, TILE, 6);
      rect(ctx, '#a89a88', 6, 4, 8, 2);
      rect(ctx, '#7d8f4e', 22, -2, 8, 4);
    },
    hazard(ctx) {
      spikes(ctx, '#9aa04a', '#d8d070', 6);
      spikes(ctx, '#7a8a3a', '#d8d070', 14);
    },
    far(ctx) {
      ctx.fillStyle = '#9aa7c7';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(i * 240 + 100, 320, 220, 110, 0, Math.PI, 0);
        ctx.fill();
      }
      ctx.fillStyle = '#d9a066';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.ellipse(i * 180 + 20, 320, 150, 60, 0, Math.PI, 0);
        ctx.fill();
      }
      ctx.fillStyle = '#fff3c4';
      ctx.beginPath();
      ctx.arc(480, 90, 28, 0, Math.PI * 2);
      ctx.fill();
    },
    near(ctx) {
      // Gum trees: pale trunks, olive canopies.
      const r = rng(5);
      for (let x = 30; x < VIEW_W; x += 150 + r() * 40) {
        const h = 160 + r() * 60;
        rect(ctx, '#e8e2d4', x, 320 - h, 10, h);
        rect(ctx, '#c8c0ae', x + 7, 320 - h, 3, h);
        rect(ctx, '#e8e2d4', x - 14, 320 - h + 30, 16, 4);
        ctx.fillStyle = '#7d8f4e';
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.ellipse(x + 5 + (i - 1.5) * 22, 320 - h - 4 + (i % 2) * 10, 26, 16, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
  },

  market: {
    sky: ['#141433', '#3a2a5a'],
    collectible: 'dumpling',
    collectibleName: 'dumplings',
    enemy: 'scooter',
    goal: 'goal-lantern',
    top(ctx) {
      this.fill(ctx);
      rect(ctx, '#8a8496', 0, 0, TILE, 6);
      rect(ctx, '#a8a2b4', 0, 0, TILE, 2);
    },
    fill(ctx) {
      rect(ctx, '#4b4656', 0, 0, TILE, TILE);
      for (let y = 0; y < TILE; y += 8) {
        rect(ctx, '#3a3644', 0, y, TILE, 2);
        rect(ctx, '#3a3644', (y / 8) % 2 ? 4 : 20, y, 2, 8);
      }
    },
    block(ctx) {
      rect(ctx, '#2a1a12', 0, 0, TILE, TILE);
      rect(ctx, '#c8463a', 2, 2, 28, 28);
      rect(ctx, '#e8b04a', 2, 12, 28, 6);
      rect(ctx, '#a83a2e', 4, 4, 4, 4);
    },
    ledge(ctx) {
      for (let x = 0; x < TILE; x += 8) {
        rect(ctx, '#e8e2d4', x, 0, 4, 10);
        rect(ctx, '#d23b3b', x + 4, 0, 4, 10);
      }
      rect(ctx, '#2a1a1a', 0, 10, TILE, 2);
    },
    hazard(ctx) {
      // Hot grill: dark tray with glowing coals and little flames.
      rect(ctx, '#2a2a33', 0, 14, TILE, 18);
      rect(ctx, '#ff6a2a', 2, 16, 28, 6);
      rect(ctx, '#ffd24a', 6, 18, 4, 2);
      rect(ctx, '#ffd24a', 20, 18, 4, 2);
      for (const x of [4, 14, 24]) {
        rect(ctx, '#ff8a3a', x, 6, 4, 10);
        rect(ctx, '#ffd24a', x + 1, 10, 2, 6);
      }
    },
    far(ctx) {
      const r = rng(21);
      for (let x = 0; x < VIEW_W; ) {
        const w = 50 + r() * 60;
        const h = 120 + r() * 140;
        rect(ctx, '#241d45', x, 320 - h, w, h);
        for (let wy = 320 - h + 12; wy < 300; wy += 18) {
          for (let wx = x + 8; wx < x + w - 10; wx += 14) if (r() < 0.45) rect(ctx, '#f6d36b', wx, wy, 6, 8);
        }
        x += w + 6;
      }
    },
    near(ctx) {
      lanternString(ctx, 40, 18, '#d8262a', 64);
      const r = rng(9);
      for (let x = 20; x < VIEW_W; x += 120) {
        const c = ['#e2508f', '#3ab0a0', '#e8b04a', '#4a8ad6'][Math.floor(r() * 4)];
        rect(ctx, '#1a1a2a', x, 170, 70, 26);
        rect(ctx, c, x + 3, 173, 64, 20);
        rect(ctx, '#ffffff', x + 12, 179, 12, 8);
        rect(ctx, '#ffffff', x + 30, 179, 12, 8);
        rect(ctx, '#ffffff', x + 48, 179, 8, 8);
      }
    },
  },

  jiufen: {
    sky: ['#f08a5d', '#6b4a8a'],
    collectible: 'bubbletea',
    collectibleName: 'bubbletea',
    bird: 'bluemagpie',
    goal: 'goal-sign',
    top(ctx) {
      this.fill(ctx);
      rect(ctx, '#b8b2a6', 0, 0, TILE, 8);
      rect(ctx, '#d0cabe', 0, 0, TILE, 2);
      rect(ctx, '#6f8f4f', 0, 8, 6, 2);
    },
    fill(ctx) {
      rect(ctx, '#7d776c', 0, 0, TILE, TILE);
      rect(ctx, '#6a645a', 0, 15, TILE, 2);
      rect(ctx, '#6a645a', 15, 0, 2, 15);
      rect(ctx, '#6a645a', 6, 17, 2, 15);
    },
    block(ctx) {
      rect(ctx, '#2a1a12', 0, 0, TILE, TILE);
      rect(ctx, '#8a4a2a', 2, 2, 28, 28);
      rect(ctx, '#6b3a20', 2, 9, 28, 2);
      rect(ctx, '#6b3a20', 2, 20, 28, 2);
    },
    ledge(ctx) {
      rect(ctx, '#2a2a36', 0, 0, TILE, 12);
      for (let x = 0; x < TILE; x += 6) rect(ctx, '#4a4a5a', x, 2, 4, 8);
    },
    hazard(ctx) {
      rect(ctx, '#3a3030', 0, 20, TILE, 12);
      const r = rng(4);
      for (let i = 0; i < 8; i++) rect(ctx, r() < 0.5 ? '#ff6a2a' : '#ffb03a', Math.floor(r() * 7) * 4, 20 + Math.floor(r() * 2) * 4, 6, 4);
      rect(ctx, 'rgba(255,255,255,0.35)', 8, 6, 3, 10);
      rect(ctx, 'rgba(255,255,255,0.35)', 20, 2, 3, 12);
    },
    far(ctx) {
      rect(ctx, '#4a6a9a', 0, 250, VIEW_W, 70);
      ctx.fillStyle = '#4a3b6b';
      ctx.beginPath();
      ctx.moveTo(0, 260);
      for (let x = 0; x <= VIEW_W; x += 40) ctx.lineTo(x, 200 + Math.sin(x / 70) * 40 + Math.cos(x / 23) * 10);
      ctx.lineTo(VIEW_W, 260);
      ctx.fill();
    },
    near(ctx) {
      // Teahouse facades with tiled roofs and lanterns.
      for (let x = 0; x < VIEW_W; x += 160) {
        rect(ctx, '#5a2e22', x + 10, 170, 130, 150);
        rect(ctx, '#2a2a36', x, 160, 150, 14);
        rect(ctx, '#f6c86b', x + 30, 200, 24, 30);
        rect(ctx, '#f6c86b', x + 90, 200, 24, 30);
        rect(ctx, '#3a1a12', x + 41, 200, 2, 30);
        rect(ctx, '#3a1a12', x + 101, 200, 2, 30);
      }
      lanternString(ctx, 120, 10, '#d8262a', 40);
    },
  },

  taipei: {
    sky: ['#2a2a5a', '#f08a7a'],
    collectible: 'pineapplecake',
    collectibleName: 'pineapplecakes',
    enemy: 'monkey',
    bird: 'bluemagpie',
    goal: 'dudu',
    top(ctx) {
      this.fill(ctx);
      rect(ctx, '#9a968c', 0, 0, TILE, 8);
      rect(ctx, '#b8b4a8', 0, 0, TILE, 2);
      rect(ctx, '#5f8a3a', 0, 8, TILE, 3);
      rect(ctx, '#5f8a3a', 6, 11, 4, 2);
      rect(ctx, '#5f8a3a', 22, 11, 4, 2);
    },
    fill(ctx) {
      rect(ctx, '#4a3a2a', 0, 0, TILE, TILE);
      speckle(ctx, '#3a2c1e', 17, 0);
      rect(ctx, '#5a4632', 4, 14, 12, 2);
    },
    block(ctx) {
      rect(ctx, '#3a3a40', 0, 0, TILE, TILE);
      rect(ctx, '#7a7a84', 2, 2, 28, 28);
      rect(ctx, '#9a9aa4', 4, 4, 14, 6);
      rect(ctx, '#5a5a64', 16, 20, 12, 8);
    },
    ledge(ctx) {
      // Wooden boardwalk.
      rect(ctx, '#3a2214', 0, 0, TILE, 12);
      for (let x = 0; x < TILE; x += 8) rect(ctx, '#a8743e', x + 1, 2, 6, 7);
    },
    hazard(ctx) {
      spikes(ctx, '#2f5a2a', '#e04a4a', 8);
      spikes(ctx, '#3f6a32', '#e04a4a', 16);
    },
    far(ctx) {
      // Taipei skyline with Taipei 101 rising above it, lights coming on.
      const r = rng(31);
      for (let x = 0; x < VIEW_W; ) {
        const w = 30 + r() * 50;
        const h = 50 + r() * 90;
        rect(ctx, '#3a3466', x, 320 - h, w, h);
        for (let wy = 320 - h + 8; wy < 312; wy += 12) {
          for (let wx = x + 5; wx < x + w - 6; wx += 9) if (r() < 0.35) rect(ctx, '#ffd98a', wx, wy, 4, 5);
        }
        x += w + 4;
      }
      const cx = 430;
      rect(ctx, '#2c2850', cx - 22, 250, 44, 70); // base
      for (let i = 0; i < 8; i++) {
        // Eight stacked segments, each flaring out at the top like the real tower.
        const y = 250 - (i + 1) * 22;
        ctx.fillStyle = '#2c2850';
        ctx.beginPath();
        ctx.moveTo(cx - 16, y + 22);
        ctx.lineTo(cx - 22, y);
        ctx.lineTo(cx + 22, y);
        ctx.lineTo(cx + 16, y + 22);
        ctx.fill();
        rect(ctx, '#7fd0c0', cx - 14, y + 4, 28, 2);
      }
      rect(ctx, '#2c2850', cx - 10, 50, 20, 26);
      rect(ctx, '#2c2850', cx - 2, 18, 4, 34);
      rect(ctx, '#ff6a6a', cx - 2, 16, 4, 4);
    },
    near(ctx) {
      // Forest on the slopes of Elephant Mountain.
      const r = rng(13);
      ctx.fillStyle = '#2f4a2a';
      for (let x = -20; x < VIEW_W + 40; x += 34) {
        ctx.beginPath();
        ctx.ellipse(x, 300 + r() * 12, 30 + r() * 12, 40 + r() * 20, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#3c5c32';
      for (let x = 0; x < VIEW_W; x += 52) {
        ctx.beginPath();
        ctx.ellipse(x + r() * 20, 312, 26, 22, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },

  house: {
    sky: ['#f4e7d2', '#e8d6ba'],
    collectible: 'treat',
    collectibleName: 'treats',
    enemy: 'vacuum',
    goal: 'goal-door',
    top(ctx) {
      rect(ctx, '#8a5a34', 0, 0, TILE, TILE);
      rect(ctx, '#c08a54', 0, 0, TILE, 8);
      rect(ctx, '#d8a46a', 0, 0, TILE, 2);
      rect(ctx, '#9a6a3a', 20, 0, 2, 8);
    },
    fill(ctx) {
      rect(ctx, '#8a5a34', 0, 0, TILE, TILE);
      rect(ctx, '#7a4a28', 0, 15, TILE, 2);
    },
    block(ctx) {
      rect(ctx, '#7a5a34', 0, 0, TILE, TILE);
      rect(ctx, '#d2a36b', 2, 2, 28, 28);
      rect(ctx, '#e8d8a8', 12, 2, 8, 28);
      rect(ctx, '#b8884e', 2, 2, 28, 3);
    },
    ledge(ctx) {
      rect(ctx, '#5a3a20', 0, 0, TILE, 10);
      rect(ctx, '#a87a4a', 0, 2, TILE, 5);
    },
    hazard(ctx) {
      // Toy blocks: ouch.
      rect(ctx, '#2a2a33', 0, 16, 16, 16);
      rect(ctx, '#e04a4a', 2, 18, 12, 12);
      rect(ctx, '#2a2a33', 14, 20, 16, 12);
      rect(ctx, '#4a8ad6', 16, 22, 12, 8);
      rect(ctx, '#2a2a33', 8, 6, 14, 12);
      rect(ctx, '#f0c04c', 10, 8, 10, 8);
    },
    far(ctx) {
      for (let x = 0; x < VIEW_W; x += 32) rect(ctx, 'rgba(160,120,80,0.10)', x, 0, 12, 320);
      rect(ctx, '#d8c4a4', 0, 296, VIEW_W, 24);
    },
    near(ctx) {
      // Window with curtains and a framed photo of the pets.
      rect(ctx, '#ffffff', 80, 90, 140, 110);
      rect(ctx, '#9ad4f4', 88, 98, 124, 94);
      rect(ctx, '#ffffff', 148, 98, 4, 94);
      rect(ctx, '#e2508f', 66, 84, 30, 130);
      rect(ctx, '#e2508f', 204, 84, 30, 130);
      rect(ctx, '#5a3a20', 400, 110, 96, 72);
      rect(ctx, '#f8f0e0', 406, 116, 84, 60);
      paint(ctx, RICEY_FRAMES.idle, RICEY_PAL, 1.5, 412, 140);
      paint(ctx, RAMEN_FRAMES.idle, RAMEN_PAL, 1.5, 450, 144);
    },
  },
};

export function makeTextures(scene: Phaser.Scene) {
  for (const [f, rows] of Object.entries(RICEY_FRAMES)) pixelTexture(scene, `ricey-${f}`, rows, RICEY_PAL, PIXEL);
  for (const [f, rows] of Object.entries(RAMEN_FRAMES)) pixelTexture(scene, `ramen-${f}`, rows, RAMEN_PAL, PIXEL);
  pixelTexture(scene, 'dust', ['.ww.', 'wwww', 'wwww', '.ww.'], { w: '#ffffff' }, PIXEL);
  for (const [key, s] of Object.entries(SPRITES)) pixelTexture(scene, key, s.rows, s.pal, s.scale);

  for (const [id, t] of Object.entries(THEMES)) {
    canvasTexture(scene, `${id}-sky`, 4, VIEW_H, (ctx) => gradient(ctx, t.sky[0], t.sky[1], 4, VIEW_H));
    canvasTexture(scene, `${id}-top`, TILE, TILE, (ctx) => t.top(ctx));
    canvasTexture(scene, `${id}-fill`, TILE, TILE, (ctx) => t.fill(ctx));
    canvasTexture(scene, `${id}-block`, TILE, TILE, (ctx) => t.block(ctx));
    canvasTexture(scene, `${id}-ledge`, TILE, 12, (ctx) => t.ledge(ctx));
    canvasTexture(scene, `${id}-hazard`, TILE, TILE, (ctx) => t.hazard(ctx));
    canvasTexture(scene, `${id}-far`, VIEW_W, VIEW_H, (ctx) => t.far(ctx));
    canvasTexture(scene, `${id}-near`, VIEW_W, VIEW_H, (ctx) => t.near(ctx));
  }
}

/**
 * Sky plus two parallax layers. Their ground line meets the level's ground
 * (two tiles up from the bottom) when the camera is at the bottom. Tall levels
 * also scroll the layers slowly upward, so the scenery rises as you climb.
 */
export function addBackdrop(scene: Phaser.Scene, theme: ThemeId, width: number, levelH = 12 * TILE) {
  scene.add.image(0, 0, `${theme}-sky`).setOrigin(0).setDisplaySize(VIEW_W, VIEW_H).setScrollFactor(0).setDepth(-10);
  const groundY = levelH - 2 * TILE;
  const maxScroll = Math.max(0, levelH - VIEW_H);
  const tall = maxScroll > 2 * TILE;
  const layer = (key: string, fx: number, fy: number, depth: number) =>
    scene.add
      .tileSprite(0, groundY - 320 - maxScroll * (1 - fy), width, VIEW_H, key)
      .setOrigin(0)
      .setScrollFactor(fx, fy)
      .setDepth(depth);
  layer(`${theme}-far`, 0.2, tall ? 0.3 : 1, -9);
  layer(`${theme}-near`, 0.5, tall ? 0.6 : 1, -8);
}
