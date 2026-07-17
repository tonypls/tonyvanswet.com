export interface Point {
  x: number;
  y: number;
}

export interface Player {
  pos: Point;
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

export interface GameState {
  player: Player;
  sprites: Sprite[];
  doors: DoorCell[];
  walls: string[][]; // mutable: secret areas lower walls
  triggers: Point[]; // walkover cells that lower the megaArmor island
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
  armorIslandDown: boolean;
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
  triggers: Point[];
  totalSecrets: number;
}
