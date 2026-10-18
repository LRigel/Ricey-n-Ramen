import Phaser from 'phaser';
import { LEVEL_1 } from './levels';
import { makeTextures, TILE } from './sprites';

type Body = Phaser.Physics.Arcade.Body;

interface PetDef {
  key: 'ricey' | 'ramen';
  name: string;
  speed: number;
  jump: number;
  hitW: number;
  hitH: number;
  canClimb: boolean;
  canDash: boolean;
  hint: string;
}

const RICEY: PetDef = {
  key: 'ricey', name: 'Ricey', speed: 200, jump: 620, hitW: 40, hitH: 36,
  canClimb: true, canDash: false, hint: 'Walk into a wall to climb it',
};
const RAMEN: PetDef = {
  key: 'ramen', name: 'Ramen', speed: 260, jump: 540, hitW: 44, hitH: 30,
  canClimb: false, canDash: true, hint: 'X: dash (once per jump)',
};

const COYOTE = 0.1; // seconds you can still jump after walking off a ledge
const JUMP_BUFFER = 0.12; // seconds a jump press is remembered before landing
const CLIMB_SPEED = 170;
const DASH_SPEED = 650;
const DASH_TIME = 0.2;
const TRAIL_SPACING = 3; // px between recorded leader positions
const FOLLOW_GAP = 20; // samples the follower stays behind (~60px)

class Pet {
  hb: Phaser.Physics.Arcade.Image; // invisible hitbox carrying the physics body
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

  constructor(scene: Phaser.Scene, public def: PetDef) {
    const key = `hb-${def.key}`;
    if (!scene.textures.exists(key)) scene.textures.createCanvas(key, def.hitW, def.hitH);
    this.hb = scene.physics.add.image(0, 0, key).setVisible(false);
    this.body.setMaxVelocity(1000, 900);
    this.view = scene.add.image(0, 0, def.key).setOrigin(0.5, 1);
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

interface Controls {
  x: number;
  jumpHeld: boolean;
  jumpPressed: boolean;
  dashPressed: boolean;
  swapPressed: boolean;
}

export class GameScene extends Phaser.Scene {
  private pets!: Pet[];
  private leaderIdx = 0;
  private trail: { x: number; y: number }[] = [];
  private respawn = { x: 0, y: 0 };
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private padPrev = { a: false, x: false, y: false };
  private collected = 0;
  private totalTreats = 0;
  private won = false;
  private levelW = 0;
  private levelH = 0;
  private hud!: { name: Phaser.GameObjects.Text; hint: Phaser.GameObjects.Text; treats: Phaser.GameObjects.Text; face: Phaser.GameObjects.Image };

  constructor() {
    super('game');
  }

  private get leader() {
    return this.pets[this.leaderIdx];
  }

  private get follower() {
    return this.pets[1 - this.leaderIdx];
  }

  create() {
    if (!this.textures.exists('ricey')) makeTextures(this);
    this.leaderIdx = 0;
    this.collected = 0;
    this.won = false;

    const map = LEVEL_1.map;
    this.levelW = Math.max(...map.map((r) => r.length)) * TILE;
    this.levelH = map.length * TILE;

    this.add.image(120, 60, 'cloud').setScrollFactor(0.1);
    this.add.image(420, 90, 'cloud').setScrollFactor(0.15);
    this.add.image(700, 40, 'cloud').setScrollFactor(0.1);
    this.add.tileSprite(0, this.levelH - 200 - 2 * TILE, this.levelW, 200, 'hills').setOrigin(0).setScrollFactor(0.4, 1);

    const solids = this.physics.add.staticGroup();
    const hazards = this.physics.add.staticGroup();
    const treats = this.physics.add.staticGroup();
    const checkpoints = this.physics.add.staticGroup();
    let goal!: Phaser.Physics.Arcade.Image;
    const solidAt = this.solidAt;

    map.forEach((row, ty) => {
      [...row].forEach((ch, tx) => {
        const x = tx * TILE + TILE / 2;
        const y = ty * TILE + TILE / 2;
        const floor = (ty + 1) * TILE;
        switch (ch) {
          case '#':
            solids.create(x, y, solidAt(tx, ty - 1) ? 'dirt' : 'grass');
            break;
          case '=':
            solids.create(x, y, 'crate');
            break;
          case '^': {
            const t = hazards.create(x, y, 'thorns') as Phaser.Physics.Arcade.Image;
            (t.body as Phaser.Physics.Arcade.StaticBody).setSize(TILE - 8, TILE - 12).setOffset(4, 12);
            break;
          }
          case 'o': {
            const t = treats.create(x, y, 'treat') as Phaser.Physics.Arcade.Image;
            this.tweens.add({ targets: t, y: y - 4, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: tx * 40 });
            this.totalTreats = treats.getLength();
            break;
          }
          case 'C':
            checkpoints.create(x, floor - 20, 'flag');
            break;
          case 'G':
            goal = this.physics.add.staticImage(x, floor - 16, 'bowl');
            break;
          case 'P':
            this.respawn = { x, y: floor };
            break;
        }
      });
    });

    this.pets = [new Pet(this, RICEY), new Pet(this, RAMEN)];
    for (const pet of this.pets) {
      this.physics.add.collider(pet.hb, solids);
      this.physics.add.overlap(pet.hb, hazards, () => this.die());
      this.physics.add.overlap(pet.hb, treats, (_p, t) => this.collect(t as Phaser.Physics.Arcade.Image));
      this.physics.add.overlap(pet.hb, checkpoints, (_p, c) => this.checkpoint(c as Phaser.Physics.Arcade.Image));
      this.physics.add.overlap(pet.hb, goal, () => this.win());
    }
    this.treatGroup = treats;
    this.resetPets();

    this.physics.world.setBounds(0, -200, this.levelW, this.levelH + 400);
    for (const pet of this.pets) pet.hb.setCollideWorldBounds(true);
    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.levelW, this.levelH);
    cam.startFollow(this.leader.hb, true, 0.12, 0.12);
    cam.setDeadzone(80, 60);

    this.keys = this.input.keyboard!.addKeys('LEFT,RIGHT,A,D,SPACE,Z,W,UP,X,J,C,SHIFT,K,R') as Record<string, Phaser.Input.Keyboard.Key>;

    const font = { fontFamily: '"Press Start 2P", monospace', fontSize: '10px', color: '#ffffff', stroke: '#1b1a2e', strokeThickness: 4 };
    this.hud = {
      face: this.add.image(28, 26, 'ricey').setScale(0.6).setScrollFactor(0).setDepth(100),
      name: this.add.text(56, 14, '', { ...font, fontSize: '12px' }).setScrollFactor(0).setDepth(100),
      hint: this.add.text(56, 32, '', font).setScrollFactor(0).setDepth(100),
      treats: this.add.text(626, 14, '', { ...font, fontSize: '12px' }).setOrigin(1, 0).setScrollFactor(0).setDepth(100),
    };
    this.add.text(320, 340, 'Arrows/WASD move   Space jump   C swap', font).setOrigin(0.5).setScrollFactor(0).setDepth(100).setAlpha(0.8);
    const title = this.add.text(320, 120, LEVEL_1.name, { ...font, fontSize: '20px' }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    this.tweens.add({ targets: title, alpha: 0, delay: 1800, duration: 600, onComplete: () => title.destroy() });
    this.refreshHud();
  }

  private treatGroup!: Phaser.Physics.Arcade.StaticGroup;

  private solidAt = (tx: number, ty: number) => '#='.includes(LEVEL_1.map[ty]?.[tx] ?? '.');

  /** Is there a solid tile right beside the body on side `dir`? */
  private wallBeside(b: Body, dir: number) {
    const tx = Math.floor((dir > 0 ? b.right + 2 : b.left - 2) / TILE);
    for (let ty = Math.floor(b.top / TILE); ty <= Math.floor((b.bottom - 1) / TILE); ty++) {
      if (this.solidAt(tx, ty)) return true;
    }
    return false;
  }

  /** Put both pets at the respawn point, follower trailing behind. */
  private resetPets() {
    const { x, y } = this.respawn;
    this.trail = [];
    for (let i = FOLLOW_GAP; i >= 0; i--) this.trail.push({ x: x - i * TRAIL_SPACING, y });
    const leader = this.leader;
    const follower = this.follower;
    leader.body.enable = true;
    leader.placeFeet(x, y);
    leader.body.reset(leader.hb.x, leader.hb.y);
    leader.body.setAllowGravity(true);
    leader.dashT = 0;
    follower.body.enable = false;
    follower.placeFeet(this.trail[0].x, y);
    for (const pet of this.pets) pet.facing = 1;
  }

  private readControls(): Controls {
    const k = this.keys;
    const pad = this.input.gamepad?.pad1;
    const stickX = pad ? pad.leftStick.x : 0;
    const left = k.LEFT.isDown || k.A.isDown || !!pad?.left || stickX < -0.4;
    const right = k.RIGHT.isDown || k.D.isDown || !!pad?.right || stickX > 0.4;
    const padA = !!pad?.A;
    const padX = !!pad?.X;
    const padY = !!(pad?.Y || pad?.L1 || pad?.R1);
    const jd = Phaser.Input.Keyboard.JustDown;
    const c: Controls = {
      x: (right ? 1 : 0) - (left ? 1 : 0),
      jumpHeld: k.SPACE.isDown || k.Z.isDown || k.W.isDown || k.UP.isDown || padA,
      jumpPressed: jd(k.SPACE) || jd(k.Z) || jd(k.W) || jd(k.UP) || (padA && !this.padPrev.a),
      dashPressed: jd(k.X) || jd(k.J) || (padX && !this.padPrev.x),
      swapPressed: jd(k.C) || jd(k.SHIFT) || jd(k.K) || (padY && !this.padPrev.y),
    };
    this.padPrev = { a: padA, x: padX, y: padY };
    return c;
  }

  update(time: number, deltaMs: number) {
    const dt = Math.min(deltaMs / 1000, 1 / 30);
    const input = this.readControls();

    if (this.won) {
      if (input.jumpPressed) this.scene.restart();
      this.updateViews(time);
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.R)) return this.die();
    if (input.swapPressed && this.leader.dashT <= 0) this.swap();

    this.moveLeader(this.leader, input, dt);
    this.recordTrail();
    this.moveFollower(this.follower);

    if (this.leader.feet.y > this.levelH + 40) this.die();
    this.updateViews(time);
  }

  private moveLeader(pet: Pet, input: Controls, dt: number) {
    const b = pet.body;
    const def = pet.def;
    const onGround = b.blocked.down;

    if (onGround) {
      pet.coyote = COYOTE;
      pet.dashReady = true;
      if (!pet.wasGrounded && pet.lastVy > 250) pet.squash(1.25, 0.75);
    } else {
      pet.coyote -= dt;
    }
    pet.buffer = input.jumpPressed ? JUMP_BUFFER : pet.buffer - dt;
    pet.wasGrounded = onGround;
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
    if (def.canClimb && input.x && this.wallBeside(b, input.x)) {
      b.setVelocity(0, -CLIMB_SPEED);
      pet.jumpCut = true; // don't let the variable-jump cut kill the climb
    }

    if (pet.buffer > 0 && pet.coyote > 0) {
      b.setVelocityY(-def.jump);
      pet.buffer = 0;
      pet.coyote = 0;
      pet.jumpCut = false;
      pet.squash(0.8, 1.2);
    }
    if (!input.jumpHeld && b.velocity.y < -150 && !pet.jumpCut) {
      b.setVelocityY(b.velocity.y * 0.45);
      pet.jumpCut = true;
    }

    if (def.canDash && input.dashPressed && pet.dashReady) {
      pet.dashT = DASH_TIME;
      pet.dashReady = false;
      b.setAllowGravity(false);
      b.setVelocity(pet.facing * DASH_SPEED, 0);
      pet.squash(1.3, 0.8);
    }
  }

  private recordTrail() {
    const f = this.leader.feet;
    const last = this.trail[this.trail.length - 1];
    if (Phaser.Math.Distance.Between(f.x, f.y, last.x, last.y) < TRAIL_SPACING) return;
    this.trail.push(f);
    if (this.trail.length > 200) this.trail.shift();
  }

  private moveFollower(pet: Pet) {
    const target = this.trail[Math.max(0, this.trail.length - 1 - FOLLOW_GAP)];
    const before = pet.feet;
    const x = Phaser.Math.Linear(before.x, target.x, 0.35);
    const y = Phaser.Math.Linear(before.y, target.y, 0.35);
    pet.placeFeet(x, y);
    const dx = x - before.x;
    pet.moving = Math.abs(dx) + Math.abs(y - before.y) > 0.4;
    if (Math.abs(dx) > 0.3) pet.facing = Math.sign(dx);
    else if (!pet.moving) {
      const toLeader = this.leader.hb.x - x;
      if (Math.abs(toLeader) > 8) pet.facing = Math.sign(toLeader);
    }
    // The follower picks up any treats it walks past too.
    for (const t of this.treatGroup.getChildren() as Phaser.Physics.Arcade.Image[]) {
      if (Phaser.Math.Distance.Between(t.x, t.y, pet.hb.x, pet.hb.y) < 26) this.collect(t);
    }
  }

  private swap() {
    const old = this.leader;
    const next = this.follower;
    // Hand the follower's path to the new follower, reversed, so the old
    // leader walks toward the new one instead of teleporting.
    const tail = this.trail.slice(-(FOLLOW_GAP + 1)).reverse();
    tail[tail.length - 1] = next.feet;
    this.trail = tail;

    old.body.setVelocity(0, 0);
    old.body.setAllowGravity(true);
    old.dashT = 0;
    old.body.enable = false;

    next.body.enable = true;
    next.body.reset(next.hb.x, next.hb.y - 2);
    next.wasGrounded = true;
    next.dashReady = true;
    this.leaderIdx = 1 - this.leaderIdx;

    this.cameras.main.startFollow(next.hb, true, 0.12, 0.12);
    next.squash(0.8, 1.2);
    const pop = this.add
      .text(next.hb.x, next.hb.y - 40, `${next.def.name}!`, { fontFamily: '"Press Start 2P", monospace', fontSize: '10px', color: '#fff6c2', stroke: '#1b1a2e', strokeThickness: 4 })
      .setOrigin(0.5)
      .setDepth(50);
    this.tweens.add({ targets: pop, y: pop.y - 24, alpha: 0, duration: 700, onComplete: () => pop.destroy() });
    this.refreshHud();
  }

  private collect(t: Phaser.Physics.Arcade.Image) {
    if (!t.active) return;
    this.collected++;
    this.treatGroup.remove(t);
    t.body!.enable = false;
    this.tweens.killTweensOf(t);
    this.tweens.add({ targets: t, y: t.y - 30, alpha: 0, scale: 1.6, duration: 300, onComplete: () => t.destroy() });
    this.refreshHud();
  }

  private checkpoint(c: Phaser.Physics.Arcade.Image) {
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
    const font = { fontFamily: '"Press Start 2P", monospace', color: '#ffffff', stroke: '#1b1a2e', strokeThickness: 5 };
    this.add.text(320, 130, 'Dinner time!', { ...font, fontSize: '22px' }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    this.add.text(320, 170, `Treats ${this.collected}/${this.totalTreats}`, { ...font, fontSize: '12px' }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    this.add.text(320, 200, 'Press Space to play again', { ...font, fontSize: '10px' }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
  }

  private updateViews(time: number) {
    for (const pet of this.pets) {
      const isLeader = pet === this.leader;
      const walking = isLeader ? pet.body.blocked.down && Math.abs(pet.body.velocity.x) > 20 : pet.moving;
      const bob = walking && !this.won ? -Math.abs(Math.sin(time * 0.02)) * 3 : 0;
      const f = pet.feet;
      if (!this.won) pet.view.setPosition(f.x, f.y + 1 + bob);
      pet.view.setFlipX(pet.facing < 0).setDepth(isLeader ? 10 : 9);
    }
  }

  private afterimage(pet: Pet) {
    const ghost = this.add.image(pet.view.x, pet.view.y, pet.def.key).setOrigin(0.5, 1).setFlipX(pet.view.flipX).setAlpha(0.4).setTint(0xfff1c2).setDepth(8);
    this.tweens.add({ targets: ghost, alpha: 0, duration: 200, onComplete: () => ghost.destroy() });
  }

  private refreshHud() {
    const def = this.leader.def;
    this.hud.face.setTexture(def.key);
    this.hud.name.setText(`${def.name}  (C to swap)`);
    this.hud.hint.setText(def.hint);
    this.hud.treats.setText(`Treats ${this.collected}/${this.totalTreats}`);
  }
}

function approach(v: number, target: number, step: number) {
  return v < target ? Math.min(v + step, target) : Math.max(v - step, target);
}
