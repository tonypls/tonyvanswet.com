// Custom E1M1 "Hangar" layout for the mini DOOM engine.
// Grid legend:
//   #  tech wall (STARTAN style)     B  brown wall          C  computer wall
//   T  tech wall with light panels   N  EXIT sign wall      E  exit switch (use to finish)
//   D  sliding door                  S  secret door (use to open)
//   L  lowering wall (secret armor island, drops when a trigger cell is stepped on)
//   .  concrete floor                ,  dark floor          :  metal walkway
//   ~  nukage pool (walkable)        t  floor + secret trigger
// Entities: P player, z zombieman, i imp, o barrel, m medkit, s stimpack,
//           a ammo clip, A green armor, X megaarmor, h health bonus, b armor bonus
//
// col:  0         1         2         3         4         5
//       0123456789012345678901234567890123456789012345678901
const MAP_STRINGS = [
  "####################################################", // 0
  "####################################################", // 1
  "####################################################", // 2
  "##.......#####T..........o..T##.a.....s.....z....###", // 3
  "##....z..#####Tbo~~~::~~~~..T##....CCC...CCC.....###", // 4
  "##.......D,,,,D..~~:~~:~~~..T##....CCC...CCC..a..###", // 5
  "##.P.....D,,,,D..::~~~~:~~::D,D........z.........###", // 6
  "##.....z.#####T..~~~~~~~::::D,D..................###", // 7
  "##.......#####T..~~~~~~~~~.bT##.......CCC....i...###", // 8
  "##############T..~~~~~~~~~..T##..A....CCC......m.###", // 9
  "###############.......z.....T##.....z............###", // 10
  "############################################..######", // 11
  "############################################..######", // 12
  "############################################DD######", // 13
  "#h#..............................................###", // 14
  "#.S..............................................###", // 15
  "#bS.................z............................###", // 16
  "#h#............................t.................###", // 17
  "#.#...............~~~~~~~~~~~~~..................###", // 18
  "###...............~~~~~~~~~~~~~..................###", // 19
  "###.BNNNENNNB.....~~~~~LLL~~~~~..................###", // 20
  "###.B,,,,,,,B.....~~~~~LXL~~~~~..................###", // 21
  "###.B,,,,,,,B.....~~~~~LLL~~~~~..................###", // 22
  "###.B,,,,,,,D.o...~~~~~~~~~~~~~..................###", // 23
  "###.B,,,,,,,D..o..~~~~~~~~~~~~~..................###", // 24
  "###.B,,,,,,,B....t.............z.................###", // 25
  "###.Bs,,,,,,B............i.......................###", // 26
  "###.BBBBBBBBB.................................a..###", // 27
  "###m.............................................###", // 28
  "####################################################", // 29
  "####################################################", // 30
  "####################################################", // 31
];

import type { DoorCell, ParsedMap, Point, Sprite, SpriteKind } from "./types";

export const CELL_SIZE = 64;

// Courtyard is open sky, except the exit building which has a ceiling.
const SKY_RECT = { x0: 3, y0: 14, x1: 48, y1: 28 };
const BUILDING_RECT = { x0: 4, y0: 20, x1: 12, y1: 27 };

export function isSkyCell(cx: number, cy: number): boolean {
  const inSky =
    cx >= SKY_RECT.x0 && cx <= SKY_RECT.x1 && cy >= SKY_RECT.y0 && cy <= SKY_RECT.y1;
  const inBuilding =
    cx >= BUILDING_RECT.x0 &&
    cx <= BUILDING_RECT.x1 &&
    cy >= BUILDING_RECT.y0 &&
    cy <= BUILDING_RECT.y1;
  return inSky && !inBuilding;
}

const ENTITY_KINDS: Record<string, SpriteKind> = {
  z: "zombieman",
  i: "imp",
  o: "barrel",
  m: "medkit",
  s: "stimpack",
  a: "clip",
  A: "greenArmor",
  X: "megaArmor",
  h: "healthBonus",
  b: "armorBonus",
};

function spriteTypeFor(kind: SpriteKind): Sprite["type"] {
  if (kind === "zombieman" || kind === "imp") return "enemy";
  if (kind === "barrel") return "barrel";
  return "item";
}

function healthFor(kind: SpriteKind): number {
  if (kind === "zombieman") return 20;
  if (kind === "imp") return 60;
  if (kind === "barrel") return 10;
  return 0;
}

export function isWallChar(ch: string): boolean {
  return "#BTNESLC".includes(ch);
}

export function parseMap(): ParsedMap {
  const height = MAP_STRINGS.length;
  const width = MAP_STRINGS[0]?.length ?? 0;
  const walls: string[][] = [];
  const sprites: Sprite[] = [];
  const doors: DoorCell[] = [];
  const triggers: Point[] = [];
  let nextId = 1;
  let playerStart: ParsedMap["playerStart"] = {
    pos: { x: 3.5 * CELL_SIZE, y: 6.5 * CELL_SIZE },
    dir: 0,
  };

  for (let y = 0; y < height; y++) {
    const row = MAP_STRINGS[y] ?? "";
    const wallRow: string[] = [];
    for (let x = 0; x < width; x++) {
      const ch = row[x] ?? "#";
      const kind = ENTITY_KINDS[ch];
      if (kind) {
        sprites.push({
          id: nextId++,
          pos: { x: (x + 0.5) * CELL_SIZE, y: (y + 0.5) * CELL_SIZE },
          type: spriteTypeFor(kind),
          kind,
          alive: true,
          health: healthFor(kind),
          dir: 0,
          state: "idle",
          stateTime: 0,
          lastAttack: 0,
        });
        wallRow.push(".");
      } else if (ch === "P") {
        playerStart = { pos: { x: (x + 0.5) * CELL_SIZE, y: (y + 0.5) * CELL_SIZE }, dir: 0 };
        wallRow.push(".");
      } else if (ch === "D" || ch === "S") {
        const north = MAP_STRINGS[y - 1]?.[x] ?? "#";
        const south = MAP_STRINGS[y + 1]?.[x] ?? "#";
        const axis = !isWallChar(north) && !isWallChar(south) ? "ns" : "ew";
        doors.push({ x, y, axis, secret: ch === "S", open: 0, timer: 0, used: false });
        wallRow.push(ch);
      } else if (ch === "t") {
        triggers.push({ x, y });
        wallRow.push(".");
      } else {
        wallRow.push(ch);
      }
    }
    walls.push(wallRow);
  }

  // Secrets: the courtyard ledge behind the secret door + the megaarmor island.
  const totalSecrets = 2;

  return {
    walls,
    width,
    height,
    playerStart,
    sprites,
    doors,
    triggers,
    totalSecrets,
  };
}
