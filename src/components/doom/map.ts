// E1M1 "Hangar" — the real thing: geometry, things, secrets AND SECTOR
// HEIGHTS extracted from shareware doom1.wad and rasterized onto the
// engine's 64-unit grid (1 cell = 64x64 map units; grid row 0 is the map's
// north edge, cell x = (mapX + 768) / 64, cell y = (-2048 - mapY) / 64).
// Layout follows the original:
//   - start in the hangar (blue-carpet platform, two zombiemen), west exit
//     to the armor room (winding staircase up to the green-armor pedestal),
//     north opening to a zig-zag corridor
//   - through the corridor's door into the computer room (northeast, with
//     the computer banks and the blue-carpet steps)
//   - out the southeast corner, down the passage into the big roofed room
//     with the nukage pool and the zig-zag bridge
//   - through the door at the far side into the dark room, then the exit
//     door (EXIT signs) into the exit room with the switch
//   - between hangar and zig-zag room lies the open-sky courtyard (dirt,
//     nukage pool with the megaarmor, hangar window sills); the south
//     stairs drop from the courtyard strip into the -136 pit and climb back
//     up to the walkway, with the secret door at the top of the stairs
// Every walkable cell carries its WAD floor/ceiling height (FLOOR_H_STRINGS /
// CEIL_H_STRINGS below): courtyard dirt at -56 around the nukage pool at -80,
// the zig-zag bridge at -24 over nukage at -48, the imp platform at +96, the
// east balcony at +104 and the staircases in their original steps (quantized
// to 32-unit climbs per 64-unit cell — the engine's step limit, see
// engine.ts). The west outdoor strip around the armor-room building is
// scenery: it is walled off in the WAD (only reachable by dropping from the
// pedestal rails, with no way back), so it is decorative here too.
// Deliberate simplifications vs. the WAD:
//   - shotgun guys render as zombiemen; the shotgun pickup renders as a clip
//     (the engine has no shotgun weapon)
//   - no per-sector light levels or blinking; nukage does not hurt
// The three secrets match the WAD's three secret sectors:
//   1. sector 68 — the secret door (S) at the top of the pit stairs, on the
//      west wall of the corridor at the south end of the zig-zag room,
//      opened with "use"
//   2. sector 69 — the shotgun alcove behind the imp platform in the
//      zig-zag nukage; the platform is lowered by a walkover trigger in the
//      corridor before the dark room (WAD linedef 308)
//   3. sector 70 — the lift (K) at the end of the alcove hallway, up to the
//      east balcony
// Grid legend:
//   #  tech wall (STARTAN style)     B  brown wall          C  computer wall
//   T  tech wall with light panels   E  exit switch (use to finish)
//   N  EXIT sign (flanks the exit room door, as in the WAD)
//   D  sliding door                  S  secret door (use to open)
//   L  imp platform floor (+96, lowers via the walkover trigger)
//   K  the lift platform up to the east balcony (-48 <-> +104)
//   .  concrete floor                ,  dark floor          :  metal walkway / stairs
//   =  blue carpet (FLAT14)           d  outdoor dirt (FLOOR7_1)
//   ~  nukage pool (walkable)
// Entities: P player (faces north), z zombieman, i imp, o barrel, m medkit,
//           s stimpack, a ammo clip, A green armor, X megaarmor, h health bonus, b armor bonus
//
// col:  0         1         2         3         4         5         6         7
//       0123456789012345678901234567890123456789012345678901234567890123456789012
const MAP_STRINGS = [
  "#####################################...............T###################", // 0
  "#####################################.b.............T###################", // 1
  "#####################################.....z.........C###################", // 2
  "#####################################.........=b=...C###################", // 3
  "#####################################........=bz=...C###################", // 4
  "#####################################C.......====...C###################", // 5
  "##################################..D........==z=.z.C###################", // 6
  "###############################.....D........=bz=..#T###################", // 7
  "###############################...####.......CCC........B###############", // 8
  "###############################..####..................h..B#############", // 9
  "###############################..####.z............#....z::#############", // 10
  "###############################..####.........######Bh.::::B############", // 11
  "#ddddddddddddB#################..####TTCCCCCCCC########B:z:B############", // 12
  "ddddddddddddd#############.b..o..#dddddddd#############BB:::####....B###", // 13
  "ddddddddddddd##########b..........ddddddddddddd########a:::::BB#..bb.B##", // 14
  "dddddddddddd#.....b####...........dddddddddddddd#######:::::::::b.B..B##", // 15
  "ddddddddddd#.h.z....###....===B==#dddddddddddddddd#####~~~:z~~~~..#.b.B#", // 16
  "ddddddd####...h...........=======#dd~~~~~~~~ddddddddddd~~::~~~~~~##B.b.#", // 17
  "ddddddd#Az.bb.............=======#dd~~~~~~~~~dddddddddd~::::~~~~~B##B..B", // 18
  "ddddddd#.z................======o#dd~~~~X~~~~dddddddddd~~~z:::~~~~##B.bB", // 19
  "dddddddd####..hz....###..o=======#ad~~~~~~~~~dddddddddd~~~~~~::~~~BB..B#", // 20
  "dddddddddddd#h....b####...........dddd~~~~ddddddddddddd~~~~~:z~~~~B.bB##", // 21
  "ddddddddddddd##########...........adddddddddddddddddddd~~~~::~~~iiL..B##", // 22
  "ddddddddddddd##########h........h.ddddddddddddddddddddd~~::z:~~~aLL..B##", // 23
  "#dddddddddddd#############..P..##.addddddddddddddddddddBa::z:::B...B..##", // 24
  "##BBBBBBBBBBBB##############.####BBBdddddddddddddddddB####::B###...B.aB#", // 25
  "#####################################BdddddBddBddddBB#####::B#B#...B..B#", // 26
  "###########################################B,,BB###B#,,,,SS:B#m....B..B#", // 27
  "############################################,,B###B,,,,,,SS:B#za...K.bB#", // 28
  "############################################,,B##B,,aB#BBSSaB#.a.BB#BB##", // 29
  "############################################B,a,,,azB#####::##BB########", // 30
  "#############################################B,zm,B######BDD############", // 31
  "################################################B#####BBB:::BBBBB#######", // 32
  "######################################################aahB::BhaaB#######", // 33
  "######################################################z:oB::Bz:zB#######", // 34
  "######################################################z::Bo:B::zB#######", // 35
  "######################################################:::B::B:::B#######", // 36
  "######################################################b::m:i:::hB#######", // 37
  "######################################################::::::::::B#######", // 38
  "######################################################BBBB::TBBBB#######", // 39
  "#########################################################NDDN###########", // 40
  "#########################################################:bb############", // 41
  "#########################################################E:a############", // 42
  "#########################################################Ebi############", // 43
];

import type { DoorCell, ParsedMap, Sprite, SpriteKind, Trigger } from "./types";

export const CELL_SIZE = 64;

// The imp platform (WAD sector 59) footprint: these cells follow platformH
// even where an enemy/item char sits on the platform instead of the L floor
// char — see cellFloorH in engine.ts.
export const PLATFORM_CELLS: ReadonlySet<string> = new Set([
  "64,22",
  "65,22",
  "66,22",
  "64,23",
  "65,23",
  "66,23",
]);

// Open-sky cells (F_SKY1 ceilings in the WAD), parallel to MAP_STRINGS:
// "s" = sky, "." = roofed.
const SKY_STRINGS = [
  "........................................................................", // 0
  "........................................................................", // 1
  "........................................................................", // 2
  "........................................................................", // 3
  "........................................................................", // 4
  "........................................................................", // 5
  "........................................................................", // 6
  "........................................................................", // 7
  "........................................................................", // 8
  "........................................................................", // 9
  "........................................................................", // 10
  "........................................................................", // 11
  ".ssssssssssss...........................................................", // 12
  "sssssssssssss.....................sssssssssssss.........................", // 13
  "sssssssssssss.....................ssssssssssssss........................", // 14
  "ssssssssssss......................sssssssssssssss.......................", // 15
  "sssssssssss.......................sssssssssssssssssssss.................", // 16
  "sssssss...........................sssssssssssssssssssss.................", // 17
  "sssssss...........................sssssssssssssssssssss.................", // 18
  "sssssss...........................sssssssssssssssssssss.................", // 19
  "sssssssssss.......................sssssssssssssssssssss.................", // 20
  "ssssssssssss......................sssssssssssssssssssss.................", // 21
  "sssssssssssss.....................sssssssssssssssssssss.................", // 22
  "sssssssssssss.....................sssssssssssssssssssss.................", // 23
  ".ssssssssssss.....................sssssssssssssssssssss.................", // 24
  "..................................sssssssss...ssssssss..................", // 25
  ".....................................ssssss...ssssss....................", // 26
  "........................................................................", // 27
  "........................................................................", // 28
  "........................................................................", // 29
  "........................................................................", // 30
  "........................................................................", // 31
  "........................................................................", // 32
  "........................................................................", // 33
  "........................................................................", // 34
  "........................................................................", // 35
  "........................................................................", // 36
  "........................................................................", // 37
  "........................................................................", // 38
  "........................................................................", // 39
  "........................................................................", // 40
  "........................................................................", // 41
  "........................................................................", // 42
  "........................................................................", // 43
];

// Per-cell floor/ceiling heights in map units (64 = one cell), straight from
// the WAD sectors. One char per cell, run-length unfriendly but compact:
// height = (charCode - 35) * 8 - 136  (range -136..216, 8-unit steps).
const FLOOR_H_STRINGS = [
  "444444444444444444444444444444444444488888888888888844444444444444444444", // 0
  "444444444444444444444444444444444444484444444444444844444444444444444444", // 1
  "444444444444444444444444444444444444484444444444444844444444444444444444", // 2
  "444444444444444444444444444444444444484444444477744844444444444444444444", // 3
  "444444444444444444444444444444444444484444444577744844444444444444444444", // 4
  "444444444444444444444444444444444444444444444577744844444444444444444444", // 5
  "444444444444444444444444444444444444444444444577744844444444444444444444", // 6
  "444444444444444444444444444444444444444444444577744444444444444444444444", // 7
  "444444444444444444444444444444444444444444444444444333322444444444444444", // 8
  "444444444444444444444444444444444444484444444444444333222214444444444444", // 9
  "444444444444444444444444444444444444484444444444444333222114444444444444", // 10
  "444444444444444444444444444444444444488888888844444432211114444444444444", // 11
  "444444444444444444444444444444444444444444444444444444441111444444444444", // 12
  "4444444444444444444444444444444444-------------44444444111114444AAAAA444", // 13
  "4444444444444444444444444444444445--------------4444444111111144AAAAA444", // 14
  "4444444444444333333344444444444445---------------444444111111111AAAAAA44", // 15
  "44444444444AA333933343344443332225---------------------...11....AA4AAA44", // 16
  "4444444AAAAAAA33333333344432222225--********-----------..11.......44AAA4", // 17
  "4444444ADAAAAA?;733333344432222225--*********----------.1111......44AAAA", // 18
  "4444444AAAAAAA33333333344432222225--*********----------...1111....44AAA4", // 19
  "44444444444AA333933343344432222225--*********----------......11...4AAA44", // 20
  "4444444444444333333344444444444445----****-------------.....11....4AAA44", // 21
  "4444444444444444444444444444444445---------------------....11...@@4AAA44", // 22
  "4444444444444444444444444444444445---------------------..1111...@..AAA44", // 23
  "4444444444444444444444444444444445---------------------11111111....AAA44", // 24
  "4444444444444444444444444444444444--------------------4444114444...4AA44", // 25
  "4444444444444444444444444444444444444------4--------4444441144.....4AAA4", // 26
  "44444444444444444444444444444444444444444444++444444#%'+/11144.....4AAA4", // 27
  "44444444444444444444444444444444444444444444''44444###'+/11144.....AAA44", // 28
  "44444444444444444444444444444444444444444444###44#####44441144....444444", // 29
  "44444444444444444444444444444444444444444444########44444411444444444444", // 30
  "444444444444444444444444444444444444444444444######444444111444444444444", // 31
  "444444444444444444444444444444444444444444444444444444111111111144444444", // 32
  "444444444444444444444444444444444444444444444444444444111111111144444444", // 33
  "444444444444444444444444444444444444444444444444444444111111111144444444", // 34
  "444444444444444444444444444444444444444444444444444444111111111144444444", // 35
  "444444444444444444444444444444444444444444444444444444111111111144444444", // 36
  "444444444444444444444444444444444444444444444444444444111111111144444444", // 37
  "444444444444444444444444444444444444444444444444444444111111111144444444", // 38
  "444444444444444444444444444444444444444444444444444444444411444444444444", // 39
  "444444444444444444444444444444444444444444444444444444444411444444444444", // 40
  "444444444444444444444444444444444444444444444444444444444111144444444444", // 41
  "444444444444444444444444444444444444444444444444444444444111144444444444", // 42
  "444444444444444444444444444444444444444444444444444444444111144444444444", // 43
];
const CEIL_H_STRINGS = [
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO???????????????OOOOOOOOOOOOOOOOOOOO", // 0
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO?PPPPPPPPPPPPP?OOOOOOOOOOOOOOOOOOOO", // 1
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO?PPPPPPPPPPPPP?OOOOOOOOOOOOOOOOOOOO", // 2
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO?PP@@@PPPGGGPP?OOOOOOOOOOOOOOOOOOOO", // 3
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO?PPPPPPPGGGGPP?OOOOOOOOOOOOOOOOOOOO", // 4
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOPPPPPPPGGGGPP?OOOOOOOOOOOOOOOOOOOO", // 5
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOFF?==PPPPPPPGGGGPP?OOOOOOOOOOOOOOOOOOOO", // 6
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOFFFF?==PPPPPPPGGGGPPOOOOOOOOOOOOOOOOOOOOO", // 7
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOFFFFOOOPP@@@PPPPPPPP======OOOOOOOOOOOOOOO", // 8
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOFFFOOO?PPPPPPPPPPPPP=======JOOOOOOOOOOOOO", // 9
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOFFFOOO?PPPPPPPPPPPPP======JJOOOOOOOOOOOOO", // 10
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOFFOOOO?????????OOOOOO===JJJJOOOOOOOOOOOOO", // 11
  "ODDDDDDDDDUUUOOOOOOOOOOOOOOOOOOFFOOOOOOOOOOOOOOOOOOOOOOOJJJJOOOOOOOOOOOO", // 12
  "DDDDDUUUUUUUUOOOOOOOOOOOO========OOOOOOOOOOOOOOOOOOOOOOJJJJJOOOOKKKKKOOO", // 13
  "DDUUUUUUUUUUUOOOOOOOOOO==========LOOOOOOOOOOOOOOOOOOOOOJJJJJJJOOKKKKKOOO", // 14
  "DDUUUUUUUUUUOPPPPPPPOOO==========LOOOOOOOOOOOOOOOOOOOOOJJJJJJJJJKKKKKKOO", // 15
  "DDUUUUUUUUULLPPPKPPPOCC====CCCMMMLOOOOOOOOOOOOOOOOOOOOOJJJJJJJJJKKOKKKOO", // 16
  "DDUUUUUUUUULLLPPPPPPCCC===CMMMMMMLOOOOOOOOOOOOOOOOOOOOOJJJJJJJJJJJOOKKKO", // 17
  "DDUUUUUUUUULLLPPPPPPCCC===CMMMMMMLOOOOOOOOOOOOOOOOOOOOOJJJJJJJJJJJOOKKKK", // 18
  "DDUUUUUUUUULLLPPPPPPCCC===CMMMMMMLOOOOOOOOOOOOOOOOOOOOOJJJJJJJJJJJOOKKKO", // 19
  "DDUUUUUUUUULLPPPKPPPOCC===CMMMMMMLOOOOOOOOOOOOOOOOOOOOOJJJJJJJJJJJOKKKOO", // 20
  "DDUUUUUUUUUUOPPPPPPPOOO==========LOOOOOOOOOOOOOOOOOOOOOJJJJJJJJJJJOKKKOO", // 21
  "DDUUUUUUUUUUUOOOOOOOOOO==========LOOOOOOOOOOOOOOOOOOOOOJJJJJJJJJJJOKKKOO", // 22
  "DDDDDUUUUUUUUOOOOOOOOOO==========LOOOOOOOOOOOOOOOOOOOOOJJJJJJJJJJAAKKKOO", // 23
  "ODDDDDDDDDUUUOOOOOOOOOOOOO=====OOLOOOOOOOOOOOOOOOOOOOOOJJJJJJJJJAAAKKKOO", // 24
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOO=OOOOO777777777666<7777777OOOOJJOOOOAAAOKKOO", // 25
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO777777O66<77777OOOOOOJJOO88AAAOKKKO", // 26
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO66OOOOOO/::::1JJOO88AAAOKKKO", // 27
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO66OOOOO///:::1JJOO88AAAKKKOO", // 28
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO///OO/////OOOOJJOO88AAOOOOOO", // 29
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO///11///OOOOOO::OOOOOOOOOOOO", // 30
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO//11//OOOOOO:::OOOOOOOOOOOO", // 31
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO::::::::::OOOOOOOO", // 32
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO:::AAAA:::OOOOOOOO", // 33
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO:::AAAA:::OOOOOOOO", // 34
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO:::AAAA:::OOOOOOOO", // 35
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO:::A::::::OOOOOOOO", // 36
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO::::::::::OOOOOOOO", // 37
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO::::::::::OOOOOOOO", // 38
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO==OOOOOOOOOOOO", // 39
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO1:OOOOOOOOOOOO", // 40
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO????OOOOOOOOOOO", // 41
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO????OOOOOOOOOOO", // 42
  "OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO????OOOOOOOOOOO", // 43
];

// Walkover triggers (WAD linedef specials and secret sectors), as cell coords.
// Cells sharing a secretId fire — and are consumed — together.
const TRIGGERS: Omit<Trigger, "used">[] = [
  // linedef 308 (W1 floor lower, tag 1) in the corridor before the dark
  // room: lowers the imp platform (sector 59) in the zig-zag nukage pool
  { x: 58, y: 33, action: "lower", secretId: 0 },
  { x: 59, y: 33, action: "lower", secretId: 0 },
  { x: 60, y: 33, action: "lower", secretId: 0 },
  // secret sector 69: the shotgun alcove behind the imp platform
  { x: 62, y: 27, action: "secret", secretId: 2 },
  { x: 63, y: 27, action: "secret", secretId: 2 },
  { x: 62, y: 28, action: "secret", secretId: 2 },
  { x: 63, y: 28, action: "secret", secretId: 2 },
  { x: 62, y: 29, action: "secret", secretId: 2 },
  { x: 63, y: 29, action: "secret", secretId: 2 },
  // secret sector 70: the lift up to the east balcony
  { x: 67, y: 28, action: "secret", secretId: 3 },
];

export function isSkyCell(cx: number, cy: number): boolean {
  return SKY_STRINGS[cy]?.[cx] === "s";
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

const decH = (ch: string): number => (ch.charCodeAt(0) - 35) * 8 - 136;

export function parseMap(): ParsedMap {
  const height = MAP_STRINGS.length;
  const width = MAP_STRINGS[0]?.length ?? 0;
  const walls: string[][] = [];
  const sprites: Sprite[] = [];
  const doors: DoorCell[] = [];
  const floorH = FLOOR_H_STRINGS.map((row) => [...row].map(decH));
  const ceilH = CEIL_H_STRINGS.map((row) => [...row].map(decH));
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
          z: floorH[y]?.[x] ?? 0,
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
        // E1M1 starts facing north, across the hangar's blue-carpet platform
        playerStart = { pos: { x: (x + 0.5) * CELL_SIZE, y: (y + 0.5) * CELL_SIZE }, dir: -Math.PI / 2 };
        wallRow.push(".");
      } else if (ch === "D" || ch === "S") {
        const north = MAP_STRINGS[y - 1]?.[x] ?? "#";
        const south = MAP_STRINGS[y + 1]?.[x] ?? "#";
        const axis = !isWallChar(north) && !isWallChar(south) ? "ns" : "ew";
        doors.push({ x, y, axis, secret: ch === "S", open: 0, timer: 0, used: false });
        wallRow.push(ch);
      } else {
        wallRow.push(ch);
      }
    }
    walls.push(wallRow);
  }


  // Door axis per GROUP: a run of door cells wider than tall is passed heading
  // north-south (and vice versa) — per-cell neighbor checks misfire when one
  // side of a multi-cell door is pocketed in rock.
  const seenDoor = new Set<string>();
  for (const d of doors) {
    const key = `${d.x},${d.y}`;
    if (seenDoor.has(key)) continue;
    const group = [d];
    seenDoor.add(key);
    for (const g of group) {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nk = `${g.x + dx},${g.y + dy}`;
        const n = doors.find((o) => o.x === g.x + dx && o.y === g.y + dy && o.secret === d.secret);
        if (n && !seenDoor.has(nk)) {
          seenDoor.add(nk);
          group.push(n);
        }
      }
    }
    const xs = group.map((g) => g.x);
    const ys = group.map((g) => g.y);
    const w = Math.max(...xs) - Math.min(...xs) + 1;
    const h = Math.max(...ys) - Math.min(...ys) + 1;
    if (w > h) for (const g of group) g.axis = "ns";
    else if (h > w) for (const g of group) g.axis = "ew";
  }

  // Secrets: WAD secret sectors 68 (secret door), 69 (shotgun alcove) and
  // 70 (lift platform). The secret door counts when used; the other two are
  // walkover triggers.
  const totalSecrets = 3;

  return {
    walls,
    width,
    height,
    playerStart,
    sprites,
    doors,
    triggers: TRIGGERS.map((t) => ({ ...t, used: false })),
    totalSecrets,
    floorH,
    ceilH,
  };
}
