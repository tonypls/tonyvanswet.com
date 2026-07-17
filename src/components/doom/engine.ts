import { CELL_SIZE, parseMap } from "./map";
import type { DoorCell, GameState, Point, Sprite } from "./types";
import type { SoundFX } from "./sound";

const TWO_PI = Math.PI * 2;
const MOVE_SPEED = 155; // units per second
const ROT_SPEED = 2.6; // radians per second
const MOUSE_SENS = 0.0023;
const PLAYER_RADIUS = 12;
const FIRE_COOLDOWN = 380; // ms
const DOOR_OPEN_SPEED = 1.8; // fraction per second

const ENEMY_STATS = {
  zombieman: { speed: 48, attackRange: 420, cooldown: [1100, 2200], painChance: 0.5 },
  imp: { speed: 58, attackRange: 620, cooldown: [1700, 2800], painChance: 0.4 },
} as const;

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function distance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function cellCharAt(state: GameState, cx: number, cy: number): string {
  if (cy < 0 || cy >= state.walls.length) return "#";
  return state.walls[cy]?.[cx] ?? "#";
}

export function cellAtWorld(state: GameState, x: number, y: number): string {
  return cellCharAt(state, Math.floor(x / CELL_SIZE), Math.floor(y / CELL_SIZE));
}

export function doorAt(state: GameState, cx: number, cy: number): DoorCell | undefined {
  return state.doors.find((d) => d.x === cx && d.y === cy);
}

/** Solid for movement purposes (doors count as solid until mostly open). */
function isSolidCell(state: GameState, cx: number, cy: number): boolean {
  const ch = cellCharAt(state, cx, cy);
  if (ch === "L") return !state.armorIslandDown;
  if (ch === "D" || ch === "S") {
    const door = doorAt(state, cx, cy);
    return !door || door.open < 0.7;
  }
  return "#BTNEC".includes(ch);
}

/** Blocks hitscan / line of sight (doors block until nearly fully open). */
function blocksSightCell(state: GameState, cx: number, cy: number): boolean {
  const ch = cellCharAt(state, cx, cy);
  if (ch === "L") return !state.armorIslandDown;
  if (ch === "D" || ch === "S") {
    const door = doorAt(state, cx, cy);
    return !door || door.open < 0.85;
  }
  return "#BTNEC".includes(ch);
}

export function createInitialState(): GameState {
  const map = parseMap();
  const totalKills = map.sprites.filter((s) => s.type === "enemy").length;
  const totalItems = map.sprites.filter((s) => s.type === "item").length;
  return {
    player: {
      pos: { ...map.playerStart.pos },
      dir: map.playerStart.dir,
      health: 100,
      armor: 0,
      ammo: 50,
      hurtTimer: 0,
      attackTimer: 0,
      lastShot: 0,
      dead: false,
    },
    sprites: map.sprites,
    doors: map.doors,
    walls: map.walls,
    triggers: map.triggers,
    keys: new Set(),
    mouseDX: 0,
    lastTime: performance.now(),
    firing: false,
    won: false,
    startTime: performance.now(),
    winTime: 0,
    kills: 0,
    totalKills,
    items: 0,
    totalItems,
    secrets: 0,
    totalSecrets: map.totalSecrets,
    armorIslandDown: false,
    message: "",
    messageTimer: 0,
    flashTimer: 0,
  };
}

function setMessage(state: GameState, message: string, seconds = 2): void {
  state.message = message;
  state.messageTimer = seconds;
}

// ------------------------------------------------------------------ combat

function damagePlayer(state: GameState, amount: number, sfx: SoundFX): void {
  const p = state.player;
  if (p.dead || state.won || amount <= 0) return;
  let dmg = amount;
  if (p.armor > 0) {
    const saved = Math.min(p.armor, Math.ceil(dmg / 3));
    p.armor -= saved;
    dmg -= saved;
  }
  p.health -= dmg;
  p.hurtTimer = Math.min(0.5, p.hurtTimer + dmg * 0.03);
  if (dmg >= 4) sfx.hurt();
  if (p.health <= 0) {
    p.health = 0;
    p.dead = true;
    sfx.playerDie();
    setMessage(state, "You died. Press R to restart.", 60);
  }
}

function damageSprite(state: GameState, sprite: Sprite, amount: number, sfx: SoundFX): void {
  if (!sprite.alive) return;
  if (sprite.type === "barrel") {
    sprite.health -= amount;
    if (sprite.health <= 0) explodeBarrel(state, sprite, sfx, new Set());
    return;
  }
  if (sprite.type !== "enemy") return;
  sprite.health -= amount;
  if (sprite.health <= 0) {
    sprite.alive = false;
    sprite.state = "dead";
    state.kills++;
    sfx.enemyDie();
    if (sprite.kind === "zombieman") {
      // zombiemen drop a clip, like the real thing
      state.sprites.push({
        id: Math.max(...state.sprites.map((s) => s.id), 0) + 1,
        pos: { ...sprite.pos },
        type: "item",
        kind: "clip",
        alive: true,
        health: 0,
        dir: 0,
        state: "idle",
        stateTime: 0,
        lastAttack: 0,
      });
      state.totalItems++;
    }
    return;
  }
  const stats = ENEMY_STATS[sprite.kind as keyof typeof ENEMY_STATS];
  if (Math.random() < stats.painChance) {
    sprite.state = "pain";
    sprite.stateTime = 0;
  }
}

function explodeBarrel(state: GameState, barrel: Sprite, sfx: SoundFX, visited: Set<number>): void {
  if (visited.has(barrel.id)) return;
  visited.add(barrel.id);
  barrel.alive = false;
  sfx.explosion();
  // visual effect
  state.sprites.push({
    id: Math.max(...state.sprites.map((s) => s.id), 0) + 1,
    pos: { ...barrel.pos },
    type: "effect",
    kind: "explosion",
    alive: true,
    health: 0,
    dir: 0,
    state: "idle",
    stateTime: 0,
    lastAttack: 0,
  });
  const RADIUS = 110;
  const pd = distance(barrel.pos, state.player.pos);
  if (pd < RADIUS) damagePlayer(state, Math.round(55 * (1 - pd / RADIUS)) + 5, sfx);
  for (const s of [...state.sprites]) {
    if (!s.alive || s.id === barrel.id) continue;
    const d = distance(barrel.pos, s.pos);
    if (d >= RADIUS) continue;
    const dmg = Math.round(60 * (1 - d / RADIUS)) + 10;
    if (s.type === "barrel") explodeBarrel(state, s, sfx, visited);
    else if (s.type === "enemy") damageSprite(state, s, dmg, sfx);
  }
}

/** March a ray; returns the first enemy/barrel hit, or null if a wall came first. */
function hitscan(
  state: GameState,
  from: Point,
  dir: number,
  damage: number,
  fromPlayer: boolean,
  sfx: SoundFX,
): void {
  const step = 4;
  const cos = Math.cos(dir);
  const sin = Math.sin(dir);
  let x = from.x;
  let y = from.y;
  for (let traveled = 0; traveled < 1400; traveled += step) {
    x += cos * step;
    y += sin * step;
    const cx = Math.floor(x / CELL_SIZE);
    const cy = Math.floor(y / CELL_SIZE);
    if (blocksSightCell(state, cx, cy)) return;
    if (fromPlayer) {
      for (const s of state.sprites) {
        if (!s.alive) continue;
        if (s.type !== "enemy" && s.type !== "barrel") continue;
        if (distance({ x, y }, s.pos) < 17) {
          damageSprite(state, s, damage, sfx);
          return;
        }
      }
    } else if (distance({ x, y }, state.player.pos) < 16) {
      damagePlayer(state, damage, sfx);
      return;
    }
  }
}

export function fireWeapon(state: GameState, time: number, sfx: SoundFX): void {
  const p = state.player;
  if (p.dead || state.won) return;
  if (time - p.lastShot < FIRE_COOLDOWN) return;
  if (p.ammo <= 0) {
    sfx.switchClick();
    setMessage(state, "No ammo.", 1.5);
    p.lastShot = time;
    return;
  }
  p.ammo--;
  p.lastShot = time;
  p.attackTimer = 0.14;
  sfx.shot();
  const spread = (Math.random() - 0.5) * 0.03;
  hitscan(state, p.pos, p.dir + spread, Math.round(rand(15, 30)), true, sfx);
}

export function useAction(state: GameState, sfx: SoundFX): void {
  const p = state.player;
  if (p.dead || state.won) return;
  // look at cells within reach, in front of the player first
  const reach = CELL_SIZE * 1.4;
  const fx = p.pos.x + Math.cos(p.dir) * reach;
  const fy = p.pos.y + Math.sin(p.dir) * reach;
  const candidates = [
    { cx: Math.floor(fx / CELL_SIZE), cy: Math.floor(fy / CELL_SIZE) },
    { cx: Math.floor(p.pos.x / CELL_SIZE), cy: Math.floor(p.pos.y / CELL_SIZE) },
  ];
  for (const { cx, cy } of candidates) {
    const ch = cellCharAt(state, cx, cy);
    if (ch === "E") {
      sfx.switchClick();
      state.won = true;
      state.winTime = performance.now();
      return;
    }
    if (ch === "S") {
      const door = doorAt(state, cx, cy);
      if (door && !door.used) {
        door.used = true;
        state.secrets++;
        sfx.secret();
        setMessage(state, "A secret is revealed!");
        return;
      }
    }
  }
}

// ------------------------------------------------------------------ update

function tryMovePlayer(state: GameState, newX: number, newY: number): void {
  const p = state.player;
  const r = PLAYER_RADIUS;
  const solid = (x: number, y: number) =>
    isSolidCell(state, Math.floor(x / CELL_SIZE), Math.floor(y / CELL_SIZE));

  if (
    !solid(newX - r, p.pos.y - r) &&
    !solid(newX + r, p.pos.y - r) &&
    !solid(newX - r, p.pos.y + r) &&
    !solid(newX + r, p.pos.y + r)
  ) {
    p.pos.x = newX;
  }
  if (
    !solid(p.pos.x - r, newY - r) &&
    !solid(p.pos.x + r, newY - r) &&
    !solid(p.pos.x - r, newY + r) &&
    !solid(p.pos.x + r, newY + r)
  ) {
    p.pos.y = newY;
  }
}

/** Pickups and walkover triggers — checked every tick, even when standing still. */
function checkCellInteractions(state: GameState, sfx: SoundFX): void {
  const p = state.player;

  // pickups
  for (const s of state.sprites) {
    if (!s.alive || s.type !== "item") continue;
    if (distance(p.pos, s.pos) >= 26) continue;
    const pickUp = (msg: string, bonus = false): void => {
      s.alive = false;
      state.items++;
      state.flashTimer = 0.18;
      if (bonus) sfx.bonus();
      else sfx.pickup();
      setMessage(state, msg);
    };
    switch (s.kind) {
      case "medkit":
        if (p.health < 100) {
          p.health = Math.min(100, p.health + 25);
          pickUp("Picked up a medkit.");
        }
        break;
      case "stimpack":
        if (p.health < 100) {
          p.health = Math.min(100, p.health + 10);
          pickUp("Picked up a stimpack.");
        }
        break;
      case "clip":
        if (p.ammo < 200) {
          p.ammo = Math.min(200, p.ammo + 8);
          pickUp("Picked up a clip.");
        }
        break;
      case "greenArmor":
        if (p.armor < 100) {
          p.armor = 100;
          pickUp("Picked up the armor.");
        }
        break;
      case "megaArmor":
        if (p.armor < 200) {
          p.armor = 200;
          pickUp("Picked up the MEGAARMOR!");
        }
        break;
      case "healthBonus":
        if (p.health < 200) {
          p.health = Math.min(200, p.health + 1);
          pickUp("Picked up a health bonus.", true);
        }
        break;
      case "armorBonus":
        if (p.armor < 200) {
          p.armor = Math.min(200, p.armor + 1);
          pickUp("Picked up an armor bonus.", true);
        }
        break;
      default:
        break;
    }
  }

  // secret trigger cells: lower the megaarmor island
  if (!state.armorIslandDown) {
    const cx = Math.floor(p.pos.x / CELL_SIZE);
    const cy = Math.floor(p.pos.y / CELL_SIZE);
    if (state.triggers.some((t) => t.x === cx && t.y === cy)) {
      state.armorIslandDown = true;
      state.secrets++;
      for (const row of state.walls) {
        for (let x = 0; x < row.length; x++) {
          if (row[x] === "L") row[x] = ",";
        }
      }
      sfx.secret();
      setMessage(state, "A secret is revealed!");
    }
  }
}

function hasLineOfSight(state: GameState, from: Point, to: Point): boolean {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.ceil(dist / 8);
  for (let i = 1; i < steps; i++) {
    const x = from.x + (dx * i) / steps;
    const y = from.y + (dy * i) / steps;
    if (blocksSightCell(state, Math.floor(x / CELL_SIZE), Math.floor(y / CELL_SIZE))) return false;
  }
  return true;
}

function updateDoors(state: GameState, dtMs: number, sfx: SoundFX): void {
  for (const door of state.doors) {
    const center = { x: (door.x + 0.5) * CELL_SIZE, y: (door.y + 0.5) * CELL_SIZE };
    let near = distance(center, state.player.pos) < CELL_SIZE * 1.6;
    if (!near) {
      for (const s of state.sprites) {
        if (s.alive && s.type === "enemy" && distance(center, s.pos) < CELL_SIZE * 1.6) {
          near = true;
          break;
        }
      }
    }

    if (door.secret) {
      // secret doors only open when used, then stay open
      if (door.used && door.open < 1) {
        if (door.open === 0) sfx.door();
        door.open = Math.min(1, door.open + (DOOR_OPEN_SPEED * dtMs) / 1000);
      }
      continue;
    }

    if (near) door.timer = 4000;
    else if (door.timer > 0) door.timer -= dtMs;

    const target = near || door.timer > 0 ? 1 : 0;
    const prev = door.open;
    if (door.open < target) door.open = Math.min(target, door.open + (DOOR_OPEN_SPEED * dtMs) / 1000);
    else if (door.open > target) door.open = Math.max(target, door.open - (DOOR_OPEN_SPEED * dtMs) / 1000);
    if (prev === 0 && door.open > 0) sfx.door();
  }
}

function moveEnemy(state: GameState, sprite: Sprite, angle: number, speed: number, dt: number): void {
  const nx = sprite.pos.x + Math.cos(angle) * speed * dt;
  const ny = sprite.pos.y + Math.sin(angle) * speed * dt;
  const r = 10;
  const solid = (x: number, y: number) =>
    isSolidCell(state, Math.floor(x / CELL_SIZE), Math.floor(y / CELL_SIZE));
  if (!solid(nx - r, sprite.pos.y) && !solid(nx + r, sprite.pos.y)) sprite.pos.x = nx;
  if (!solid(sprite.pos.x, ny - r) && !solid(sprite.pos.x, ny + r)) sprite.pos.y = ny;
}

function updateEnemy(state: GameState, sprite: Sprite, time: number, dt: number, sfx: SoundFX): void {
  const p = state.player;
  const stats = ENEMY_STATS[sprite.kind as keyof typeof ENEMY_STATS];
  const dist = distance(p.pos, sprite.pos);
  const los = dist < 700 && hasLineOfSight(state, sprite.pos, p.pos);

  switch (sprite.state) {
    case "idle":
      if (los && !p.dead) sprite.state = "chase";
      break;
    case "pain":
      if (sprite.stateTime > 250) sprite.state = "chase";
      break;
    case "attack": {
      sprite.dir = Math.atan2(p.pos.y - sprite.pos.y, p.pos.x - sprite.pos.x);
      if (sprite.stateTime >= 380) {
        if (sprite.kind === "zombieman") {
          sfx.shot();
          const spread = (Math.random() - 0.5) * 0.14;
          const dmg = dist < 260 ? rand(4, 14) : rand(2, 7);
          hitscan(state, sprite.pos, sprite.dir + spread, Math.round(dmg), false, sfx);
        } else {
          sfx.fireball();
          state.sprites.push({
            id: Math.max(...state.sprites.map((s) => s.id), 0) + 1,
            pos: { ...sprite.pos },
            type: "projectile",
            kind: "fireball",
            alive: true,
            health: 0,
            dir: sprite.dir,
            state: "idle",
            stateTime: 0,
            lastAttack: 0,
          });
        }
        sprite.lastAttack = time;
        sprite.state = "chase";
      }
      break;
    }
    case "chase": {
      if (p.dead || !los) {
        if (!los) sprite.state = "idle";
        break;
      }
      sprite.dir = Math.atan2(p.pos.y - sprite.pos.y, p.pos.x - sprite.pos.x);
      if (dist > 52) moveEnemy(state, sprite, sprite.dir, stats.speed, dt);
      const cooldown = rand(stats.cooldown[0], stats.cooldown[1]);
      if (dist < stats.attackRange && time - sprite.lastAttack > cooldown) {
        sprite.state = "attack";
        sprite.stateTime = 0;
      }
      break;
    }
    default:
      break;
  }
}

function updateProjectile(state: GameState, sprite: Sprite, dt: number, sfx: SoundFX): void {
  const speed = 190;
  sprite.pos.x += Math.cos(sprite.dir) * speed * dt;
  sprite.pos.y += Math.sin(sprite.dir) * speed * dt;
  const cx = Math.floor(sprite.pos.x / CELL_SIZE);
  const cy = Math.floor(sprite.pos.y / CELL_SIZE);
  if (isSolidCell(state, cx, cy) || sprite.stateTime > 5000) {
    sprite.alive = false;
    return;
  }
  if (distance(sprite.pos, state.player.pos) < 18) {
    sprite.alive = false;
    damagePlayer(state, Math.round(rand(10, 20)), sfx);
    return;
  }
  for (const s of state.sprites) {
    if (s.alive && s.type === "barrel" && distance(sprite.pos, s.pos) < 18) {
      sprite.alive = false;
      explodeBarrel(state, s, sfx, new Set());
      return;
    }
  }
}

export function updateGame(state: GameState, time: number, sfx: SoundFX): void {
  const dt = Math.min((time - state.lastTime) / 1000, 0.1);
  state.lastTime = time;
  const dtMs = dt * 1000;
  const p = state.player;

  if (state.messageTimer > 0) state.messageTimer -= dt;
  if (state.flashTimer > 0) state.flashTimer -= dt;
  if (p.hurtTimer > 0) p.hurtTimer -= dt;
  if (p.attackTimer > 0) p.attackTimer -= dt;

  updateDoors(state, dtMs, sfx);

  if (!p.dead && !state.won) {
    // rotation: arrow keys + mouse
    let rot = 0;
    if (state.keys.has("arrowleft")) rot -= 1;
    if (state.keys.has("arrowright")) rot += 1;
    p.dir += rot * ROT_SPEED * dt + state.mouseDX * MOUSE_SENS;
    state.mouseDX = 0;
    p.dir = ((p.dir % TWO_PI) + TWO_PI) % TWO_PI;

    // movement: W/S forward, A/D strafe
    let fwd = 0;
    if (state.keys.has("w") || state.keys.has("arrowup")) fwd += 1;
    if (state.keys.has("s") || state.keys.has("arrowdown")) fwd -= 1;
    let strafe = 0;
    if (state.keys.has("a")) strafe -= 1;
    if (state.keys.has("d")) strafe += 1;
    if (fwd !== 0 || strafe !== 0) {
      const len = Math.hypot(fwd, strafe) || 1;
      const mf = (fwd / len) * MOVE_SPEED * dt;
      const ms = (strafe / len) * MOVE_SPEED * dt;
      const cos = Math.cos(p.dir);
      const sin = Math.sin(p.dir);
      tryMovePlayer(state, p.pos.x + cos * mf - sin * ms, p.pos.y + sin * mf + cos * ms);
    }
    checkCellInteractions(state, sfx);

    if (state.firing) fireWeapon(state, time, sfx);
  } else {
    state.mouseDX = 0;
  }

  for (const sprite of state.sprites) {
    sprite.stateTime += dtMs;
    if (!sprite.alive) continue;
    if (sprite.type === "enemy" && !p.dead && !state.won) updateEnemy(state, sprite, time, dt, sfx);
    else if (sprite.type === "projectile") updateProjectile(state, sprite, dt, sfx);
    else if (sprite.type === "effect" && sprite.stateTime > 450) sprite.alive = false;
  }

  // drop picked-up items, exploded barrels, dead projectiles and finished effects
  state.sprites = state.sprites.filter((s) => s.alive || (s.type === "enemy" && s.state === "dead"));
}
