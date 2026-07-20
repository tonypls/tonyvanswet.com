export interface Point {
  x: number;
  y: number;
}

export interface Player {
  pos: Point;
  z: number; // feet height in map units (64 = one cell)
  dir: number; // radians, 0 = east
  health: number;
  armor: number;
  ammo: number;
  hurtTimer: number; // red screen flash, seconds remaining
  attackTimer: number; // muzzle flash frame time remaining
  lastShot: number; // performance.now() of last shot
  dead: boolean;
}

export type EnemyKind = "zombieman" | "imp";
export type ItemKind =
  | "medkit"
  | "stimpack"
  | "clip"
  | "greenArmor"
  | "megaArmor"
  | "healthBonus"
  | "armorBonus";
export type SpriteKind = EnemyKind | ItemKind | "barrel" | "fireball" | "explosion";

export type SpriteType = "enemy" | "item" | "barrel" | "projectile" | "effect";
export type EnemyState = "idle" | "chase" | "pain" | "attack" | "dead";

export interface Sprite {
  id: number;
  pos: Point;
  z: number; // feet height in map units (64 = one cell)
  type: SpriteType;
  kind: SpriteKind;
  alive: boolean;
  health: number;
  dir: number;
  state: EnemyState;
  stateTime: number; // ms spent in current state
  lastAttack: number; // performance.now() of last attack
}

export interface DoorCell {
  x: number; // cell coords
  y: number;
  axis: "ns" | "ew"; // passage axis: ns = player walks north/south through it
  secret: boolean;
  open: number; // 0 = closed, 1 = fully open
  timer: number; // ms until it starts closing again
  used: boolean; // secret doors: opened once, stays open
}

export interface Trigger {
  x: number; // cell coords
  y: number;
  action: "lower" | "secret"; // lower = drop the imp platform, secret = count a secret
  secretId: number; // cells sharing an id fire (and are consumed) together
  used: boolean;
}

export interface GameState {
  player: Player;
  sprites: Sprite[];
  doors: DoorCell[];
  walls: string[][]; // mutable: secret areas lower walls
  floorH: number[][]; // per-cell floor heights, map units (L/K cells overridden
  ceilH: number[][]; // by platformH/liftH — see cellFloorH in engine.ts)
  triggers: Trigger[]; // walkover cells: secrets + the imp-platform lowerer
  keys: Set<string>;
  mouseDX: number;
  lastTime: number;
  firing: boolean;
  won: boolean;
  startTime: number;
  winTime: number;
  kills: number;
  totalKills: number;
  items: number;
  totalItems: number;
  secrets: number;
  totalSecrets: number;
  platformH: number; // imp platform (L cells): 96 raised, -48 lowered
  liftH: number; // the east-balcony lift (K cell): 104 up, -48 down
  liftState: "up" | "lowering" | "down" | "raising";
  liftTimer: number; // ms remaining in the "down" wait before raising
  message: string;
  messageTimer: number; // seconds
  flashTimer: number; // pickup flash, seconds
}

export interface ParsedMap {
  walls: string[][];
  width: number;
  height: number;
  playerStart: { pos: Point; dir: number };
  sprites: Sprite[];
  doors: DoorCell[];
  triggers: Trigger[];
  totalSecrets: number;
  floorH: number[][];
  ceilH: number[][];
}
