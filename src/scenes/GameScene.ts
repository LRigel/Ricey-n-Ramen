import Phaser from 'phaser';
import { petTexture, type PetState } from '../art/animate';
import { addBackdrop, THEMES, TILE, type Theme, type ThemeId } from '../art/themes';
import { goTo, textStyle } from '../flow';
import { LEVELS, type LevelDef } from '../levels';
import { lang, t, tr } from '../i18n';
import { isTouch, showTouchPad, touch } from '../touch';

type Body = Phaser.Physics.Arcade.Body;
type Img = Phaser.Physics.Arcade.Image;

interface PetDef {
  key: 'ricey' | 'ramen';
  name: string;
  speed: number;
  jump: number;
  hitW: number;
  hitH: number;
  canClimb: boolean;
  canDash: boolean;
  hint: 'climbHint' | 'dashHint';
}

const RICEY: PetDef = {
  key: 'ricey', name: 'Ricey', speed: 200, jump: 620, hitW: 42, hitH: 40,
  canClimb: true, canDash: false, hint: 'climbHint',
};
const RAMEN: PetDef = {
  key: 'ramen', name: 'Ramen', speed: 260, jump: 540, hitW: 46, hitH: 36,
  canClimb: false, canDash: true, hint: 'dashHint',
};

const COYOTE = 0.1; // seconds you can still jump after walking off a ledge
const JUMP_BUFFER = 0.12; // seconds a jump press is remembered before landing
const CLIMB_SPEED = 170;
const DASH_SPEED = 650;
const DASH_TIME = 0.2;
const STOMP_BOUNCE = 420;
const TRAIL_SPACING = 3; // px between recorded leader positions
const FOLLOW_GAP = 22; // samples the follower stays behind (~66px)
const TAIL_OFFSET = 8; // sprites include a tail, so shift them back over the hitbox
const DASH_GROUND_CHECK = 28; // px: a jump pressed this close above the ground is a buffered jump, not a dash

class Pet {
  hb: Img; // invisible hitbox carrying the physics body
  view: Phaser.GameObjects.Image;
  facing = 1;
  coyote = 0;
  buffer = 0;
  dashT = 0;
  dashReady = true;
  jumpCut = false;
  wasGrounded = true;
  lastVy = 0;
  moving = false;
  airborne = false;
  climbing = false;
  vy = 0; // vertical speed this frame (followers have no body to read it from)
  seed = Math.random() * 5000;

  constructor(scene: Phaser.Scene, public def: PetDef) {
    const key = `hb-${def.key}`;
    if (!scene.textures.exists(key)) scene.textures.createCanvas(key, def.hitW, def.hitH);
    this.hb = scene.physics.add.image(0, 0, key).setVisible(false);
    this.body.setMaxVelocity(1000, 900);
    this.view = scene.add.image(0, 0, `${def.key}-idle`).setOrigin(0.5, 1);
  }

  get body() {
    return this.hb.body as Body;
  }

  get feet() {
    return { x: this.hb.x, y: this.hb.y + this.hb.height / 2 };
  }

  placeFeet(x: number, y: number) {
    this.hb.setPosition(x, y - this.hb.height / 2);
  }

  squash(sx: number, sy: number) {
    this.view.scene.tweens.add({ targets: this.view, scaleX: sx, scaleY: sy, duration: 70, yoyo: true, ease: 'Quad.easeOut' });
  }
}

interface Enemy {
  img: Img;
  kind: 'walker' | 'bird';
  dir: number;
  x0: number;
  y0: number;
  t: number;
  alive: boolean;
}

interface Controls {
  x: number;
  down: boolean;
  jumpHeld: boolean;
  jumpPressed: boolean;
  swapPressed: boolean;
}

/** A point on the leader's path; followers replay these, climbing included. */
interface TrailPoint {
  x: number;
  y: number;
  climb: boolean;
}

export class GameScene extends Phaser.Scene {
  private level!: LevelDef;
  private levelIdx = 0;
  private step = 0;
  private theme!: Theme;
  private pets!: Pet[];
  private leaderIdx = 0;
  private trail: TrailPoint[] = [];
  private respawn = { x: 0, y: 0 };
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private padPrev = { a: false, y: false };
  private collected = 0;
  private totalPickups = 0;
  private pickups!: Phaser.Physics.Arcade.StaticGroup;
  private enemies: Enemy[] = [];
  private dropT = 0; // time left falling through ledges
  private won = false;
  private levelW = 0;
  private levelH = 0;
  private hud!: { name: Phaser.GameObjects.Text; hint: Phaser.GameObjects.Text; pickups: Phaser.GameObjects.Text; face: Phaser.GameObjects.Image };

  constructor() {
    super('game');
  }

  init(data: { level: number; step: number }) {
    this.levelIdx = data.level ?? 0;
    this.step = data.step ?? 0;
    this.level = LEVELS[this.levelIdx];
    this.theme = THEMES[this.level.theme];
    this.leaderIdx = 0;
    this.collected = 0;
    this.enemies = [];
    this.dropT = 0;
    this.won = false;
  }

  private get leader() {
    return this.pets[this.leaderIdx];
  }

  private get follower() {
    return this.pets[1 - this.leaderIdx];
  }

  private solidAt = (tx: number, ty: number) => '#='.includes(this.level.map[ty]?.[tx] ?? '.');
  private standableAt = (tx: number, ty: number) => '#=-'.includes(this.level.map[ty]?.[tx] ?? '.');

  create() {
    const map = this.level.map;
    const id: ThemeId = this.level.theme;
    this.levelW = Math.max(...map.map((r) => r.length)) * TILE;
    this.levelH = map.length * TILE;
    addBackdrop(this, id, this.levelW);
    showTouchPad(true);
    this.events.once('shutdown', () => showTouchPad(false));

    const solids = this.physics.add.staticGroup();
    const ledges = this.physics.add.staticGroup();
    const hazards = this.physics.add.staticGroup();
    const checkpoints = this.physics.add.staticGroup();
    this.pickups = this.physics.add.staticGroup();
    let goal!: Img;

    map.forEach((row, ty) => {
      [...row].forEach((ch, tx) => {
        const x = tx * TILE + TILE / 2;
        const y = ty * TILE + TILE / 2;
        const floor = (ty + 1) * TILE;
        switch (ch) {
          case '#':
            solids.create(x, y, this.solidAt(tx, ty - 1) ? `${id}-fill` : `${id}-top`);
            break;
          case '=':
            solids.create(x, y, `${id}-block`);
            break;
          case '-': {
            const l = ledges.create(x, ty * TILE + 6, `${id}-ledge`) as Img;
            const lb = l.body as Phaser.Physics.Arcade.StaticBody;
            lb.checkCollision.down = lb.checkCollision.left = lb.checkCollision.right = false;
            break;
          }
          case '^': {
            const t = hazards.create(x, y, `${id}-hazard`) as Img;
            (t.body as Phaser.Physics.Arcade.StaticBody).setSize(TILE - 8, TILE - 14).setOffset(4, 14);
            break;
          }
          case 'o': {
            const t = this.pickups.create(x, y, this.theme.collectible) as Img;
            this.tweens.add({ targets: t, y: y - 4, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: tx * 40 });
            break;
          }
          case 'C':
            checkpoints.create(x, floor - 20, 'flag');
            break;
          case 'G': {
            const tex = this.textures.get(this.theme.goal).getSourceImage();
            goal = this.physics.add.staticImage(x, floor - tex.height / 2, this.theme.goal);
            break;
          }
          case 'E':
            if (this.theme.enemy) this.addEnemy('walker', this.theme.enemy, x, floor);
            break;
          case 'B':
            if (this.theme.bird) this.addEnemy('bird', `${this.theme.bird}-0`, x, y);
            break;
          case 'P':
            this.respawn = { x, y: floor };
            break;
        }
      });
    });
    this.totalPickups = this.pickups.getLength();

    this.pets = [new Pet(this, RICEY), new Pet(this, RAMEN)];
    for (const pet of this.pets) {
      this.physics.add.collider(pet.hb, solids);
      this.physics.add.collider(pet.hb, ledges, undefined, () => this.dropT <= 0);
      this.physics.add.overlap(pet.hb, hazards, () => this.die());
      this.physics.add.overlap(pet.hb, this.pickups, (_p, t) => this.collect(t as Img));
      this.physics.add.overlap(pet.hb, checkpoints, (_p, c) => this.checkpoint(c as Img));
      this.physics.add.overlap(pet.hb, goal, () => this.win());
      for (const e of this.enemies) this.physics.add.overlap(pet.hb, e.img, () => this.touchEnemy(e));
    }
    for (const e of this.enemies) {
      if (e.kind !== 'walker') continue;
      this.physics.add.collider(e.img, solids);
      this.physics.add.collider(e.img, ledges);
    }
    this.resetPets();

    this.physics.world.setBounds(0, -200, this.levelW, this.levelH + 400);
    for (const pet of this.pets) pet.hb.setCollideWorldBounds(true);
    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.levelW, this.levelH);
    cam.startFollow(this.leader.hb, true, 0.12, 0.12);
    cam.setDeadzone(80, 60);

    this.keys = this.input.keyboard!.addKeys('LEFT,RIGHT,DOWN,A,D,S,SPACE,Z,W,UP,C,SHIFT,K,R') as Record<string, Phaser.Input.Keyboard.Key>;

    const font = textStyle(10);
    const zh = lang === 'zh'; // Chinese text is taller, so the HUD lines spread out
    this.hud = {
      face: this.add.image(30, 26, 'ricey-idle').setScale(0.55).setScrollFactor(0).setDepth(100),
      name: this.add.text(62, zh ? 6 : 14, '', textStyle(12)).setScrollFactor(0).setDepth(100),
      hint: this.add.text(62, zh ? 34 : 32, '', font).setScrollFactor(0).setDepth(100),
      pickups: this.add.text(626, 14, '', textStyle(12)).setOrigin(1, 0).setScrollFactor(0).setDepth(100),
    };
    if (this.levelIdx === 0 && !isTouch) {
      this.add.text(320, 342, t('controls'), font).setOrigin(0.5).setScrollFactor(0).setDepth(100).setAlpha(0.85);
    }
    const title = this.add.text(320, 110, tr(this.level.name, this.level.zh.name), textStyle(20)).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    const sub = this.add.text(320, 142, tr(this.level.country, this.level.zh.country), textStyle(10, '#fff6c2')).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    this.tweens.add({ targets: [title, sub], alpha: 0, delay: 1800, duration: 600, onComplete: () => (title.destroy(), sub.destroy()) });
    this.refreshHud();
  }

  private addEnemy(kind: Enemy['kind'], key: string, x: number, y: number) {
    const img = this.physics.add.image(x, y, key);
    const body = img.body as Body;
    if (kind === 'walker') {
      img.setY(y - img.height / 2);
      body.setSize(img.width - 6, img.height - 4).setOffset(3, 4);
    } else {
      body.setAllowGravity(false);
      body.moves = false; // birds are positioned directly in update()
      body.setSize(img.width - 8, img.height - 6);
    }
    this.enemies.push({ img, kind, dir: -1, x0: x, y0: img.y, t: Math.random() * 3, alive: true });
  }

  /** Put both pets at the respawn point, follower trailing behind. */
  private resetPets() {
    const { x, y } = this.respawn;
    this.trail = [];
    for (let i = FOLLOW_GAP; i >= 0; i--) this.trail.push({ x: x - i * TRAIL_SPACING, y, climb: false });
    const leader = this.leader;
    leader.body.enable = true;
    leader.placeFeet(x, y);
    leader.body.reset(leader.hb.x, leader.hb.y);
    leader.body.setAllowGravity(true);
    leader.dashT = 0;
    this.follower.body.enable = false;
    this.follower.placeFeet(this.trail[0].x, y);
    for (const pet of this.pets) {
      pet.facing = 1;
      pet.climbing = false;
    }
  }

  private readControls(): Controls {
    const k = this.keys;
    const pad = this.input.gamepad?.pad1;
    const stickX = pad ? pad.leftStick.x : 0;
    const left = k.LEFT.isDown || k.A.isDown || !!pad?.left || stickX < -0.4 || touch.left;
    const right = k.RIGHT.isDown || k.D.isDown || !!pad?.right || stickX > 0.4 || touch.right;
    const padA = !!pad?.A;
    const padY = !!(pad?.Y || pad?.L1 || pad?.R1);
    const jd = Phaser.Input.Keyboard.JustDown;
    const c: Controls = {
      x: (right ? 1 : 0) - (left ? 1 : 0),
      down: k.DOWN.isDown || k.S.isDown || !!pad?.down || (pad ? pad.leftStick.y > 0.5 : false) || touch.down,
      jumpHeld: k.SPACE.isDown || k.Z.isDown || k.W.isDown || k.UP.isDown || padA || touch.jump,
      jumpPressed: jd(k.SPACE) || jd(k.Z) || jd(k.W) || jd(k.UP) || (padA && !this.padPrev.a) || touch.consume('jumpPressed'),
      swapPressed: jd(k.C) || jd(k.SHIFT) || jd(k.K) || (padY && !this.padPrev.y) || touch.consume('swapPressed'),
    };
    this.padPrev = { a: padA, y: padY };
    return c;
  }

  update(time: number, deltaMs: number) {
    const dt = Math.min(deltaMs / 1000, 1 / 30);
    const input = this.readControls();

    if (this.won) {
      if (input.jumpPressed) this.finishLevel();
      this.updateViews(time);
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.R)) return this.die();
    if (input.swapPressed && this.leader.dashT <= 0) this.swap();

    this.dropT -= dt;
    this.moveLeader(this.leader, input, dt);
    this.recordTrail();
    this.moveFollower(this.follower);
    this.moveEnemies(time, dt);

    if (this.leader.feet.y > this.levelH + 40) this.die();
    this.updateViews(time);
  }

  private moveLeader(pet: Pet, input: Controls, dt: number) {
    const b = pet.body;
    const def = pet.def;
    const onGround = b.blocked.down || b.touching.down;

    if (onGround) {
      pet.coyote = COYOTE;
      pet.dashReady = true;
      if (!pet.wasGrounded && pet.lastVy > 250) {
        pet.squash(1.25, 0.75);
        this.puff(pet.feet.x, pet.feet.y, 4);
      }
    } else {
      pet.coyote -= dt;
    }
    pet.buffer = input.jumpPressed ? JUMP_BUFFER : pet.buffer - dt;
    pet.wasGrounded = onGround;
    pet.airborne = !onGround;
    pet.lastVy = b.velocity.y;

    if (pet.dashT > 0) {
      pet.dashT -= dt;
      if (Math.random() < 0.6) this.afterimage(pet);
      if (pet.dashT > 0 && !b.blocked.left && !b.blocked.right) return;
      pet.dashT = 0;
      b.setAllowGravity(true);
      b.setVelocityX(pet.facing * def.speed);
    }

    const accel = onGround ? 2400 : 1500;
    b.setVelocityX(approach(b.velocity.x, input.x * def.speed, accel * dt));
    if (input.x) pet.facing = input.x;

    // Climbing uses a tile lookup rather than blocked.left/right: pushing into
    // the wall while moving up makes Arcade separate on Y and snag the body.
    pet.climbing = def.canClimb && !!input.x && this.wallBeside(b, input.x);
    if (pet.climbing) {
      b.setVelocity(0, -CLIMB_SPEED);
      pet.jumpCut = true; // don't let the variable-jump cut kill the climb
      pet.airborne = true;
    }

    // Down + jump while standing on a ledge drops through it.
    if (input.down && pet.buffer > 0 && onGround && this.onLedge(b)) {
      this.dropT = 0.25;
      pet.buffer = 0;
    }

    // Ramen's dash: press jump again while airborne (but not just before
    // landing, where the press should stay a buffered jump).
    const dashNow = def.canDash && pet.buffer > 0 && pet.coyote <= 0 && pet.dashReady && !onGround && !this.nearGround(b);
    if (dashNow) {
      pet.dashT = DASH_TIME;
      pet.dashReady = false;
      pet.buffer = 0;
      b.setAllowGravity(false);
      b.setVelocity(pet.facing * DASH_SPEED, 0);
      pet.squash(1.3, 0.8);
      this.puff(pet.feet.x - pet.facing * 20, pet.hb.y, 3);
    }

    if (pet.buffer > 0 && pet.coyote > 0) {
      b.setVelocityY(-def.jump);
      pet.buffer = 0;
      pet.coyote = 0;
      pet.jumpCut = false;
      pet.squash(0.8, 1.2);
      this.puff(pet.feet.x, pet.feet.y, 3);
    }
    if (!input.jumpHeld && b.velocity.y < -150 && !pet.jumpCut) {
      b.setVelocityY(b.velocity.y * 0.45);
      pet.jumpCut = true;
    }
    pet.vy = b.velocity.y;
  }

  /** Is there a solid tile right beside the body on side `dir`? */
  private wallBeside(b: Body, dir: number) {
    const tx = Math.floor((dir > 0 ? b.right + 2 : b.left - 2) / TILE);
    for (let ty = Math.floor(b.top / TILE); ty <= Math.floor((b.bottom - 1) / TILE); ty++) {
      if (this.solidAt(tx, ty)) return true;
    }
    return false;
  }

  /** Is there something to land on just below a falling body? */
  private nearGround(b: Body) {
    if (b.velocity.y <= 0) return false;
    const ty = Math.floor((b.bottom + DASH_GROUND_CHECK) / TILE);
    return this.standableAt(Math.floor(b.left / TILE), ty) || this.standableAt(Math.floor(b.right / TILE), ty);
  }

  private onLedge(b: Body) {
    const ty = Math.floor((b.bottom + 2) / TILE);
    const row = this.level.map[ty] ?? '';
    return row[Math.floor(b.left / TILE)] === '-' || row[Math.floor(b.right / TILE)] === '-';
  }

  private recordTrail() {
    const f = this.leader.feet;
    const last = this.trail[this.trail.length - 1];
    if (Phaser.Math.Distance.Between(f.x, f.y, last.x, last.y) < TRAIL_SPACING) return;
    this.trail.push({ ...f, climb: this.leader.climbing });
    if (this.trail.length > 200) this.trail.shift();
  }

  private moveFollower(pet: Pet) {
    const target = this.trail[Math.max(0, this.trail.length - 1 - FOLLOW_GAP)];
    const before = pet.feet;
    const x = Phaser.Math.Linear(before.x, target.x, 0.35);
    const y = Phaser.Math.Linear(before.y, target.y, 0.35);
    pet.placeFeet(x, y);
    const dx = x - before.x;
    const dy = y - before.y;
    pet.moving = Math.abs(dx) + Math.abs(dy) > 0.4;
    pet.airborne = Math.abs(dy) > 1;
    pet.climbing = target.climb && dy < -0.5;
    pet.vy = dy;
    if (pet.climbing) {
      // Face the wall being climbed.
      const tx = Math.floor(x / TILE);
      const ty = Math.floor((y - 8) / TILE);
      if (this.solidAt(tx + 1, ty)) pet.facing = 1;
      else if (this.solidAt(tx - 1, ty)) pet.facing = -1;
    } else if (Math.abs(dx) > 0.3) pet.facing = Math.sign(dx);
    else if (!pet.moving) {
      const toLeader = this.leader.hb.x - x;
      if (Math.abs(toLeader) > 8) pet.facing = Math.sign(toLeader);
    }
    // The follower picks up any snacks it walks past too.
    for (const t of this.pickups.getChildren() as Img[]) {
      if (Phaser.Math.Distance.Between(t.x, t.y, pet.hb.x, pet.hb.y) < 28) this.collect(t);
    }
  }

  private moveEnemies(time: number, dt: number) {
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const b = e.img.body as Body;
      if (e.kind === 'walker') {
        // Turn around at walls and at ledge edges.
        const aheadX = e.dir > 0 ? b.right + 2 : b.left - 2;
        const ground = this.standableAt(Math.floor(aheadX / TILE), Math.floor((b.bottom + 4) / TILE));
        if ((e.dir < 0 && b.blocked.left) || (e.dir > 0 && b.blocked.right) || (b.blocked.down && !ground)) e.dir *= -1;
        b.setVelocityX(e.dir * 60);
        e.img.setFlipX(e.dir < 0);
      } else {
        e.t += dt;
        const x = e.x0 + Math.sin(e.t * 1.2) * TILE * 3;
        e.img.setPosition(x, e.y0 + Math.sin(e.t * 3.1) * 10);
        e.img.setFlipX(Math.cos(e.t * 1.2) < 0);
        e.img.setTexture(`${this.theme.bird}-${Math.floor(time / 140) % 2}`);
      }
    }
  }

  private touchEnemy(e: Enemy) {
    if (!e.alive || this.won) return;
    const pet = this.leader;
    const b = pet.body;
    const stomp = b.velocity.y > 50 && b.bottom < (e.img.body as Body).top + 14;
    if (!stomp && pet.dashT <= 0) return this.die();
    e.alive = false;
    (e.img.body as Body).enable = false;
    this.tweens.add({ targets: e.img, angle: 180, y: e.img.y + 200, alpha: 0, duration: 600, ease: 'Quad.easeIn', onComplete: () => e.img.destroy() });
    if (stomp) {
      b.setVelocityY(-STOMP_BOUNCE);
      pet.jumpCut = false;
      pet.squash(1.2, 0.8);
    }
  }

  private swap() {
    const old = this.leader;
    const next = this.follower;
    // Hand the follower's path to the new follower, reversed, so the old
    // leader walks toward the new one instead of teleporting.
    const tail = this.trail.slice(-(FOLLOW_GAP + 1)).reverse();
    tail[tail.length - 1] = { ...next.feet, climb: false };
    this.trail = tail;

    old.body.setVelocity(0, 0);
    old.body.setAllowGravity(true);
    old.dashT = 0;
    old.climbing = false;
    old.body.enable = false;

    next.body.enable = true;
    next.body.reset(next.hb.x, next.hb.y - 2);
    next.wasGrounded = true;
    next.dashReady = true;
    this.leaderIdx = 1 - this.leaderIdx;

    this.cameras.main.startFollow(next.hb, true, 0.12, 0.12);
    next.squash(0.8, 1.2);
    const pop = this.add.text(next.hb.x, next.hb.y - 44, `${next.def.name}!`, textStyle(10, '#fff6c2')).setOrigin(0.5).setDepth(50);
    this.tweens.add({ targets: pop, y: pop.y - 24, alpha: 0, duration: 700, onComplete: () => pop.destroy() });
    this.refreshHud();
  }

  private collect(t: Img) {
    if (!t.active || !t.body?.enable) return;
    this.collected++;
    this.pickups.remove(t);
    t.body.enable = false;
    this.tweens.killTweensOf(t);
    this.tweens.add({ targets: t, y: t.y - 30, alpha: 0, scale: 1.6, duration: 300, onComplete: () => t.destroy() });
    this.refreshHud();
  }

  private checkpoint(c: Img) {
    if (c.texture.key === 'flag-on') return;
    c.setTexture('flag-on');
    this.respawn = { x: c.x, y: c.y + 20 };
    this.tweens.add({ targets: c, scaleY: 1.2, duration: 100, yoyo: true });
  }

  private die() {
    if (this.won) return;
    this.cameras.main.flash(200, 255, 120, 120);
    this.cameras.main.shake(150, 0.006);
    this.resetPets();
  }

  private win() {
    if (this.won) return;
    this.won = true;
    this.leader.body.setVelocity(0, 0);
    for (const [i, pet] of this.pets.entries()) {
      this.tweens.add({ targets: pet.view, y: '-=18', duration: 220, yoyo: true, repeat: -1, delay: i * 150, ease: 'Quad.easeOut' });
    }
    const scores = this.registry.get('scores') ?? {};
    scores[this.levelIdx] = { got: this.collected, total: this.totalPickups };
    this.registry.set('scores', scores);

    this.add.rectangle(320, 165, 440, 120, 0x1b1a2e, 0.85).setScrollFactor(0).setDepth(99).setStrokeStyle(3, 0xfff6c2);
    this.add.text(320, 130, tr(this.level.clear, this.level.zh.clear), textStyle(12)).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    this.add.text(320, 165, `${t(this.theme.collectibleName)} ${this.collected}/${this.totalPickups}`, textStyle(10, '#fff6c2')).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    this.add.text(320, 198, t(isTouch ? 'nextTouch' : 'next'), textStyle(10)).setOrigin(0.5).setScrollFactor(0).setDepth(100);
  }

  private finishLevel() {
    goTo(this, this.step + 1);
  }

  private updateViews(time: number) {
    for (const pet of this.pets) {
      const isLeader = pet === this.leader;
      const walking = isLeader ? !pet.airborne && Math.abs(pet.body.velocity.x) > 20 : pet.moving && !pet.airborne;
      let state: PetState = 'idle';
      if (pet.climbing) state = 'climb';
      else if (pet.dashT > 0) state = 'rise';
      else if (pet.airborne) state = pet.vy < 0 ? 'rise' : 'fall';
      else if (walking) state = 'walk';
      if (this.won) state = 'idle';

      pet.view.setTexture(petTexture(pet.def.key, state, time, pet.seed));
      pet.view.setFlipX(pet.facing < 0).setDepth(isLeader ? 10 : 9);
      if (this.won) continue;
      const f = pet.feet;
      if (state === 'climb') {
        // Turn to face up the wall, paws against it.
        pet.view.setOrigin(0.5, 0.5).setAngle(pet.facing > 0 ? -90 : 90);
        pet.view.setPosition(f.x - pet.facing * 4, pet.hb.y);
      } else {
        pet.view.setOrigin(0.5, 1).setAngle(0);
        pet.view.setPosition(f.x - pet.facing * TAIL_OFFSET, f.y + 1);
      }
    }
  }

  private puff(x: number, y: number, n: number) {
    for (let i = 0; i < n; i++) {
      const d = this.add.image(x + (i - (n - 1) / 2) * 10, y - 4, 'dust').setAlpha(0.8).setDepth(11);
      this.tweens.add({ targets: d, x: d.x + (i - (n - 1) / 2) * 8, y: d.y - 8, alpha: 0, scale: 0.4, duration: 350, onComplete: () => d.destroy() });
    }
  }

  private afterimage(pet: Pet) {
    const ghost = this.add.image(pet.view.x, pet.view.y, pet.view.texture.key).setOrigin(0.5, 1).setFlipX(pet.view.flipX).setAlpha(0.4).setTint(0xfff1c2).setDepth(8);
    this.tweens.add({ targets: ghost, alpha: 0, duration: 200, onComplete: () => ghost.destroy() });
  }

  private refreshHud() {
    const def = this.leader.def;
    this.hud.face.setTexture(`${def.key}-idle`);
    this.hud.name.setText(isTouch ? def.name : `${def.name}  ${t('swapHint')}`);
    this.hud.hint.setText(t(def.hint));
    this.hud.pickups.setText(`${t(this.theme.collectibleName)} ${this.collected}/${this.totalPickups}`);
  }
}

function approach(v: number, target: number, step: number) {
  return v < target ? Math.min(v + step, target) : Math.max(v - step, target);
}
