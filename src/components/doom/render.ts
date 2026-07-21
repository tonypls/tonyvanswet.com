import { CELL_SIZE, isSkyCell } from "./map";
import { cellFloorH } from "./engine";
import type { GameState, Sprite } from "./types";
import type { Tex, Textures } from "./textures";

export const VIEW_W = 480;
export const VIEW_H = 270;
const FOV = (Math.PI / 180) * 66;
const TAN_HALF_FOV = Math.tan(FOV / 2);
const PROJ_DIST = VIEW_W / 2 / TAN_HALF_FOV;
const HORIZON = VIEW_H / 2;
const MAX_VIEW_CELLS = 16; // indoor shading falloff
const OUTDOOR_VIEW_CELLS = 40; // open-sky areas stay visible much farther
const TWO_PI = Math.PI * 2;
const EYE = 41; // eye height above the feet, in map units

// Convert a Tex (raw 0xAABBGGRR pixels) to a drawable canvas, cached.
const texCanvasCache = new WeakMap<Tex, HTMLCanvasElement>();
function texCanvas(t: Tex): HTMLCanvasElement {
  let c = texCanvasCache.get(t);
  if (!c) {
    c = document.createElement("canvas");
    c.width = t.w;
    c.height = t.h;
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("2d context not available");
    const img = ctx.createImageData(t.w, t.h);
    new Uint32Array(img.data.buffer).set(t.data);
    ctx.putImageData(img, 0, 0);
    texCanvasCache.set(t, c);
  }
  return c;
}

export interface RenderBuffers {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  image: ImageData;
  pixels: Uint32Array;
  zbuffer: Float32Array;
  riserT: Float32Array; // distance of the first step-up per column (sprite clip)
  riserY: Float32Array; // screen row of that riser's top edge
  rayX: Float32Array;
  rayY: Float32Array;
  ang: Float32Array;
}

export function createRenderBuffers(): RenderBuffers {
  const canvas = document.createElement("canvas");
  canvas.width = VIEW_W;
  canvas.height = VIEW_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context not available");
  const image = ctx.createImageData(VIEW_W, VIEW_H);
  return {
    canvas,
    ctx,
    image,
    pixels: new Uint32Array(image.data.buffer),
    zbuffer: new Float32Array(VIEW_W),
    riserT: new Float32Array(VIEW_W),
    riserY: new Float32Array(VIEW_W),
    rayX: new Float32Array(VIEW_W),
    rayY: new Float32Array(VIEW_W),
    ang: new Float32Array(VIEW_W),
  };
}

function shadeColor(c: number, si: number): number {
  const r = ((c & 0xff) * si) >> 8;
  const g = ((c & 0xff00) * si) >> 8;
  const b = ((c & 0xff0000) * si) >> 8;
  return 0xff000000 | (b & 0xff0000) | (g & 0xff00) | r;
}

function shadeInt(si: number): number {
  return si < 24 ? 24 : si > 256 ? 256 : si;
}

/** Distance shading; open-sky ground fades out much farther than indoor halls. */
function shadeFor(dist: number, outdoor: boolean): number {
  return shadeInt(Math.round(256 * (1 - dist / (outdoor ? OUTDOOR_VIEW_CELLS : MAX_VIEW_CELLS))));
}

/** A wall counts as outdoor if any of its 4 neighbours is open sky. */
function wallOutdoor(mapX: number, mapY: number): boolean {
  return (
    isSkyCell(mapX + 1, mapY) ||
    isSkyCell(mapX - 1, mapY) ||
    isSkyCell(mapX, mapY + 1) ||
    isSkyCell(mapX, mapY - 1)
  );
}

function spriteTexture(s: Sprite, tex: Textures): Tex {
  if (s.type === "enemy") {
    if (s.state === "dead") return tex.sprites[s.kind === "imp" ? "impDead" : "zombiemanDead"];
    if (s.state === "pain") return tex.sprites[s.kind === "imp" ? "impPain" : "zombiemanPain"];
    if (s.state === "attack") return tex.sprites[s.kind === "imp" ? "impAttack" : "zombiemanAttack"];
    return tex.sprites[s.kind === "imp" ? "imp" : "zombieman"];
  }
  if (s.type === "barrel") return tex.sprites.barrel;
  if (s.type === "effect") {
    const frame = s.stateTime < 150 ? 0 : s.stateTime < 300 ? 1 : 2;
    return tex.sprites[`explosion${frame}` as "explosion0"];
  }
  if (s.type === "projectile") return tex.sprites.fireball;
  return tex.sprites[s.kind as keyof Textures["sprites"]];
}

function spriteSize(s: Sprite): number {
  switch (s.type) {
    case "enemy":
      return 0.92;
    case "barrel":
      return 0.6;
    case "effect":
      return 1.0;
    case "projectile":
      return 0.35;
    default:
      return 0.38; // items
  }
}

/**
 * Portal-style renderer: each column marches the grid near -> far keeping a
 * free vertical span [topY, botY]. Walkable cells draw their floor/ceiling
 * bands (plus a riser/header face on height changes) and shrink the span;
 * walls and closed door slabs fill whatever span is left. This is what lets
 * E1M1's real sector heights (nukage pits, the zig-zag bridge, the imp
 * platform, staircases, the balcony) show up properly.
 */
export function renderScene(bufs: RenderBuffers, state: GameState, tex: Textures, timeMs: number): void {
  const p = state.player;
  const px = p.pos.x / CELL_SIZE;
  const py = p.pos.y / CELL_SIZE;
  const eyeZ = p.z + EYE;
  const { pixels, zbuffer, riserT, riserY, rayX, rayY, ang } = bufs;
  const nukeShift = Math.floor(timeMs / 90) % 64;

  // Per-column ray directions, spread evenly across the projection plane
  // (NOT evenly in angle — that is what made the view look skewed/fisheyed).
  // Ray directions are unnormalised: their component along the view direction
  // is 1, so the DDA t-parameter already IS the perpendicular distance and no
  // fisheye correction is needed anywhere downstream.
  const dirX = Math.cos(p.dir);
  const dirY = Math.sin(p.dir);
  for (let x = 0; x < VIEW_W; x++) {
    const camX = (2 * x) / VIEW_W - 1; // -1 .. 1 across the screen
    const rx = dirX - camX * TAN_HALF_FOV * dirY;
    const ry = dirY + camX * TAN_HALF_FOV * dirX;
    rayX[x] = rx;
    rayY[x] = ry;
    ang[x] = Math.atan2(ry, rx);
  }

  const sky = tex.sky;
  const ceilTex = tex.ceiling;
  const stepTex = tex.walls["2"]!;

  // screen row of a world height (map units) at perpendicular distance t (cells)
  const yOf = (h: number, t: number): number =>
    HORIZON - (((h - eyeZ) / 64) * PROJ_DIST) / Math.max(t, 1e-4);

  for (let x = 0; x < VIEW_W; x++) {
    const rdx = rayX[x] ?? 1;
    const rdy = rayY[x] ?? 0;

    // ---------------------------------------------------------- DDA setup
    let mapX = Math.floor(px);
    let mapY = Math.floor(py);
    const deltaX = Math.abs(1 / rdx);
    const deltaY = Math.abs(1 / rdy);
    let stepX: number;
    let stepY: number;
    let sideX: number;
    let sideY: number;
    if (rdx < 0) {
      stepX = -1;
      sideX = (px - mapX) * deltaX;
    } else {
      stepX = 1;
      sideX = (mapX + 1 - px) * deltaX;
    }
    if (rdy < 0) {
      stepY = -1;
      sideY = (py - mapY) * deltaY;
    } else {
      stepY = 1;
      sideY = (mapY + 1 - py) * deltaY;
    }

    let topY = 0;
    let botY = VIEW_H - 1;
    let zbuf = OUTDOOR_VIEW_CELLS;
    let stopped = false; // a wall/slab closed the column: no leftover fill
    riserT[x] = Infinity;
    riserY[x] = VIEW_H - 1;

    let prevFloor = cellFloorH(state, mapX, mapY);
    let prevCeil = state.ceilH[mapY]?.[mapX] ?? 216;
    let tEnter = 0;
    let side: 0 | 1 = 0;
    let lastSky = isSkyCell(mapX, mapY);

    for (let iter = 0; iter < 64 && topY <= botY; iter++) {
      const tExit = Math.min(sideX, sideY);
      const ch = state.walls[mapY]?.[mapX] ?? "#";
      const skyCell = isSkyCell(mapX, mapY);
      lastSky = skyCell;

      // ---------------- door slab: a full-height face, sliding open
      let slab: { t: number; tex: Tex; u: number; ns: boolean; spanTop: number; spanBot: number } | null = null;
      if (ch === "D" || ch === "S") {
        const door = state.doors.find((d) => d.x === mapX && d.y === mapY);
        const open = door?.open ?? 0;
        if (door && tEnter > 1e-6) {
          const slabTex = tex.walls[ch] ?? tex.walls["#"]!;
          // the vertical span as the ray enters the door cell, before the
          // cell's own floor/ceiling clamps: the panel is clipped by NEARER
          // geometry only — the cell's far-edge clamps would shave its
          // top/bottom edges unevenly column by column
          const spanTop = topY;
          const spanBot = botY;
          const inGroup = (x: number, y: number): boolean => {
            const n = state.doors.find((d) => d.x === x && d.y === y);
            return n !== undefined && n.secret === door.secret;
          };
          const fromGroup = inGroup(mapX - (side === 0 ? stepX : 0), mapY - (side === 1 ? stepY : 0));
          if (inGroup(mapX + (side === 0 ? stepX : 0), mapY + (side === 1 ? stepY : 0))) {
            // a group sibling straight ahead: this cell is the skin of a
            // multi-cell-deep block and its face sits at the block's boundary
            // (the entry plane), so the block reads as a clean box. Cells
            // reached from a sibling are the block's interior and stay hollow.
            if (!fromGroup && open < 0.999) {
              const frac = (side === 0 ? py + tEnter * rdy : px + tEnter * rdx) - (side === 0 ? mapY : mapX);
              if (frac >= open && frac <= 1) slab = { t: tEnter, tex: slabTex, u: (frac - open) * 64, ns: side === 1, spanTop, spanBot };
            }
          } else {
            // single-deep door: the panel sits mid-cell and slides open (the
            // last sliver stays tucked at the track's end, DOOM-pocket style).
            // The crossing must land inside the cell ([open, 1]); when it lies
            // beyond, the ray continues to a group sibling's panel or out past
            // the jamb — capping it here would create false faces.
            const slideOpen = Math.min(open, 0.9);
            const t = door.axis === "ew" ? (mapX + 0.5 - px) / rdx : (mapY + 0.5 - py) / rdy;
            if (t > tEnter + 1e-9) {
              const frac = door.axis === "ew" ? py + t * rdy - mapY : px + t * rdx - mapX;
              if (frac >= slideOpen && frac <= 1) slab = { t, tex: slabTex, u: (frac - slideOpen) * 64, ns: door.axis === "ns", spanTop, spanBot };
            }
          }
        }
      }

      const isFullWall = "#BCTNE".includes(ch);

      if (!isFullWall) {
        // ---------------- walkable cell: floor/ceiling bands + riser/header
        const fh = cellFloorH(state, mapX, mapY);
        const ch2 = state.ceilH[mapY]?.[mapX] ?? 216;

        // riser face when stepping up onto this floor
        if (fh > prevFloor && tEnter > 1e-6) {
          const yTop = yOf(fh, tEnter);
          const y0 = Math.max(topY, Math.ceil(yTop));
          const y1 = botY;
          if (y1 >= y0) {
            const wallX = side === 0 ? py + tEnter * rdy : px + tEnter * rdx;
            let u = (wallX - Math.floor(wallX)) * 64;
            if ((side === 0 && rdx < 0) || (side === 1 && rdy > 0)) u = 63 - u;
            const ui = Math.min(63, Math.max(0, Math.floor(u)));
            let shade = shadeFor(tEnter, skyCell);
            if (side === 1) shade = (shade * 3) >> 2;
            const ppc = PROJ_DIST / tEnter;
            for (let y = y0; y <= y1; y++) {
              const h = eyeZ - ((y - HORIZON) * 64) / ppc;
              const v = Math.min(stepTex.h - 1, Math.floor(((((-h % 64) + 64) % 64) / 64) * stepTex.h));
              pixels[y * VIEW_W + x] = shadeColor(stepTex.data[v * 64 + ui] ?? 0xff000000, shade);
            }
            // the first real step-up clips the feet of sprites behind it
            if (riserT[x] === Infinity && y1 - y0 >= 2) {
              riserT[x] = tEnter;
              riserY[x] = y0;
            }
          }
        }

        // floor band, only when the floor is below eye level
        if (fh < eyeZ) {
          const yA = Math.max(topY, Math.ceil(yOf(fh, tExit)));
          const yB = Math.min(botY, Math.floor(yOf(fh, tEnter)));
          if (yB >= yA) {
            const ft = tex.floors[ch] ?? tex.floors["."]!;
            const k = ((eyeZ - fh) / 64) * PROJ_DIST;
            for (let y = yA; y <= yB; y++) {
              const t = k / (y - HORIZON);
              const wx = px + t * rdx;
              const wy = py + t * rdy;
              let u = Math.floor((wx - Math.floor(wx)) * 63.99);
              let v = Math.floor((wy - Math.floor(wy)) * 63.99);
              if (ch === "~") {
                u = (u + nukeShift) & 63;
                v = (v + (nukeShift >> 1)) & 63;
              }
              pixels[y * VIEW_W + x] = shadeColor(ft.data[v * 64 + u] ?? 0xff000000, shadeFor(t, skyCell));
            }
          }
        }

        // beyond this cell the world is only visible above its floor's far edge
        botY = Math.min(botY, Math.floor(yOf(fh, tExit)));

        // header face when this ceiling is lower than the previous one. A
        // ceiling below eye level (looking down from a higher floor into a
        // lower-ceilinged section) shows ONLY this face: its underside can't
        // be seen from above — the ray passes under the slab.
        if (ch2 < prevCeil && tEnter > 1e-6) {
          const yBot = yOf(ch2, tEnter);
          const y0 = topY;
          const y1 = Math.min(botY, Math.floor(yBot));
          if (y1 >= y0) {
            const wallX = side === 0 ? py + tEnter * rdy : px + tEnter * rdx;
            let u = (wallX - Math.floor(wallX)) * 64;
            if ((side === 0 && rdx < 0) || (side === 1 && rdy > 0)) u = 63 - u;
            const ui = Math.min(63, Math.max(0, Math.floor(u)));
            let shade = shadeFor(tEnter, skyCell);
            if (side === 1) shade = (shade * 3) >> 2;
            const ppc = PROJ_DIST / tEnter;
            for (let y = y0; y <= y1; y++) {
              const h = eyeZ - ((y - HORIZON) * 64) / ppc;
              const v = Math.min(stepTex.h - 1, Math.floor(((((-h % 64) + 64) % 64) / 64) * stepTex.h));
              pixels[y * VIEW_W + x] = shadeColor(stepTex.data[v * 64 + ui] ?? 0xff000000, shade);
            }
          }
        }

        // ceiling band, only while the ceiling is above eye level (sky cells
        // sample the sky texture instead)
        if (ch2 >= eyeZ || skyCell) {
          const yA = Math.max(topY, Math.ceil(yOf(ch2, tEnter)));
          const yB = Math.min(botY, Math.floor(yOf(ch2, tExit)));
          if (yB >= yA) {
            if (skyCell) {
              const su = Math.floor((((ang[x] ?? 0) % TWO_PI + TWO_PI) % TWO_PI) / TWO_PI * sky.w) % sky.w;
              for (let y = yA; y <= yB; y++) {
                const sv = Math.min(sky.h - 1, Math.floor((y / HORIZON) * sky.h));
                pixels[y * VIEW_W + x] = sky.data[sv * sky.w + su] ?? 0xff000000;
              }
            } else {
              const k = ((ch2 - eyeZ) / 64) * PROJ_DIST;
              for (let y = yA; y <= yB; y++) {
                const t = k / (HORIZON - y);
                const wx = px + t * rdx;
                const wy = py + t * rdy;
                const u = Math.floor((wx - Math.floor(wx)) * 63.99);
                const v = Math.floor((wy - Math.floor(wy)) * 63.99);
                pixels[y * VIEW_W + x] = shadeColor(ceilTex.data[v * 64 + u] ?? 0xff000000, shadeFor(t, false));
              }
            }
          }
        }
        // the ceiling line clips the top of the span: an above-eye ceiling
        // binds at its far edge (the line sinks toward the horizon). A slab
        // that drops below eye level seals the top at its NEAR edge instead
        // (its line rises back toward the horizon beyond, so the far-edge
        // clamp would let the span re-open). A continuing slab needs no new
        // clamp — the seal from where it dropped still covers it — and when
        // the eye itself is already above the slab (door pockets), clamping
        // would kill the whole column.
        if (skyCell || ch2 >= eyeZ) topY = Math.max(topY, Math.ceil(yOf(ch2, tExit)));
        else if (ch2 < prevCeil && tEnter > 1e-6) topY = Math.max(topY, Math.ceil(yOf(ch2, tEnter)));
        prevFloor = fh;
        prevCeil = ch2;
      }

      // ---------------- full-height faces stop the column
      if (isFullWall) {
        const wallTex = tex.walls[ch] ?? tex.walls["#"]!;
        const wallX = side === 0 ? py + tEnter * rdy : px + tEnter * rdx;
        let u = (wallX - Math.floor(wallX)) * 64;
        // un-mirror: with the camera plane at dir+90deg, screen-x runs against
        // texture-u on east-facing and south-facing walls (EXIT text reads L-to-R)
        if ((side === 0 && rdx < 0) || (side === 1 && rdy > 0)) u = 63 - u;
        const ui = Math.min(63, Math.max(0, Math.floor(u)));
        let shade = shadeFor(tEnter, wallOutdoor(mapX, mapY));
        if (side === 1) shade = (shade * 3) >> 2; // N-S walls darker
        const ppc = PROJ_DIST / Math.max(tEnter, 1e-4);
        const y0 = topY;
        const y1 = botY;
        for (let y = y0; y <= y1; y++) {
          const h = eyeZ - ((y - HORIZON) * 64) / ppc;
          const v = Math.floor(((((-h % 64) + 64) % 64) / 64) * wallTex.h) % wallTex.h;
          pixels[y * VIEW_W + x] = shadeColor(wallTex.data[v * wallTex.w + ui] ?? 0xff000000, shade);
        }
        zbuf = tEnter;
        stopped = true;
        break;
      }
      if (slab) {
        const ui = Math.min(63, Math.max(0, Math.floor(slab.u)));
        // slab faces share the walls' fake AO: north/south-facing ones darker
        let shade = shadeFor(slab.t, wallOutdoor(mapX, mapY));
        if (slab.ns) shade = (shade * 3) >> 2;
        const ppc = PROJ_DIST / slab.t;
        // the panel spans the door cell's floor..ceiling at the SLAB's own
        // distance, clipped only by nearer geometry (spanTop/spanBot)
        const yTop = Math.max(slab.spanTop, Math.ceil(yOf(state.ceilH[mapY]?.[mapX] ?? 216, slab.t)));
        const yBot = Math.min(slab.spanBot, Math.floor(yOf(cellFloorH(state, mapX, mapY), slab.t)));
        for (let y = yTop; y <= yBot; y++) {
          const h = eyeZ - ((y - HORIZON) * 64) / ppc;
          const v = Math.floor(((((-h % 64) + 64) % 64) / 64) * slab.tex.h) % slab.tex.h;
          pixels[y * VIEW_W + x] = shadeColor(slab.tex.data[v * slab.tex.w + ui] ?? 0xff000000, shade);
        }
        zbuf = slab.t;
        stopped = true;
        break;
      }

      // ---------------- advance to the next cell
      if (sideX < sideY) {
        side = 0;
        tEnter = sideX;
        sideX += deltaX;
        mapX += stepX;
      } else {
        side = 1;
        tEnter = sideY;
        sideY += deltaY;
        mapY += stepY;
      }
    }

    // span never closed (long outdoor sight line): sky above, darkness below.
    // `stopped` means a wall/door face already filled the column — no leftover fill.
    if (!stopped && topY <= botY) {
      if (lastSky) {
        const su = Math.floor((((ang[x] ?? 0) % TWO_PI + TWO_PI) % TWO_PI) / TWO_PI * sky.w) % sky.w;
        for (let y = topY; y <= botY; y++) {
          const sv = Math.min(sky.h - 1, Math.floor((y / HORIZON) * sky.h));
          pixels[y * VIEW_W + x] = sky.data[sv * sky.w + su] ?? 0xff000000;
        }
      } else {
        for (let y = topY; y <= botY; y++) pixels[y * VIEW_W + x] = shadeColor(0xff101010, 24);
      }
    }
    zbuffer[x] = zbuf;
  }

  // ------------------------------------------------ sprites (far to near)
  const sorted = state.sprites
    .map((s) => {
      const dx = s.pos.x - p.pos.x;
      const dy = s.pos.y - p.pos.y;
      return { s, dist: Math.hypot(dx, dy), angle: Math.atan2(dy, dx) - p.dir };
    })
    .filter(({ angle }) => {
      const a = Math.atan2(Math.sin(angle), Math.cos(angle));
      return Math.abs(a) < FOV / 2 + 0.4;
    })
    .sort((a, b) => b.dist - a.dist);

  for (const { s, dist, angle } of sorted) {
    const rel = Math.atan2(Math.sin(angle), Math.cos(angle));
    const perpDist = (dist * Math.cos(rel)) / CELL_SIZE; // cells
    if (perpDist < 0.05) continue;
    const st = spriteTexture(s, tex);
    const lineH = PROJ_DIST / perpDist;
    const spriteH = lineH * spriteSize(s);
    const spriteW = (spriteH * st.w) / st.h;
    const screenX = VIEW_W / 2 + Math.tan(rel) * PROJ_DIST;
    // feet planted on the sprite's own floor height
    const bottom = yOf(s.z, perpDist);
    const top = bottom - spriteH;
    const x0 = Math.max(0, Math.ceil(screenX - spriteW / 2));
    const x1 = Math.min(VIEW_W - 1, Math.floor(screenX + spriteW / 2));
    const outdoor = isSkyCell(Math.floor(s.pos.x / CELL_SIZE), Math.floor(s.pos.y / CELL_SIZE));
    const shade = shadeFor(perpDist, outdoor);
    for (let x = x0; x <= x1; x++) {
      if ((zbuffer[x] ?? OUTDOOR_VIEW_CELLS) <= perpDist) continue;
      const u = Math.floor(((x - (screenX - spriteW / 2)) / spriteW) * st.w);
      if (u < 0 || u >= st.w) continue;
      const sy0 = Math.max(0, Math.ceil(top));
      let sy1 = Math.min(VIEW_H - 1, Math.floor(bottom));
      // a step-up between the player and the sprite hides its legs
      if ((riserT[x] ?? Infinity) < perpDist) sy1 = Math.min(sy1, Math.floor(riserY[x] ?? VIEW_H - 1) - 1);
      for (let y = sy0; y <= sy1; y++) {
        const v = Math.floor(((y - top) / spriteH) * st.h);
        if (v < 0 || v >= st.h) continue;
        const c = st.data[v * st.w + u] ?? 0;
        if (c >>> 24 < 128) continue;
        pixels[y * VIEW_W + x] = shadeColor(c, shade);
      }
    }
  }

  // ------------------------------------------------ gun
  const gun = p.attackTimer > 0 ? tex.gun[1]! : tex.gun[0]!;
  const scale = 1.5;
  const gw = gun.w * scale;
  const gh = gun.h * scale;
  const gx0 = Math.floor((VIEW_W - gw) / 2);
  const gy0 = Math.floor(VIEW_H - gh);
  for (let y = 0; y < gh; y++) {
    const v = Math.floor(y / scale);
    for (let x = 0; x < gw; x++) {
      const u = Math.floor(x / scale);
      const c = gun.data[v * gun.w + u] ?? 0;
      if (c >>> 24 < 128) continue;
      const tx = gx0 + x;
      const ty = gy0 + y;
      if (tx >= 0 && tx < VIEW_W && ty >= 0 && ty < VIEW_H) pixels[ty * VIEW_W + tx] = c;
    }
  }
}

function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function renderGame(
  display: CanvasRenderingContext2D,
  dw: number,
  dh: number,
  bufs: RenderBuffers,
  state: GameState,
  tex: Textures,
  timeMs: number,
  ui: { paused: boolean },
): void {
  renderScene(bufs, state, tex, timeMs);
  bufs.ctx.putImageData(bufs.image, 0, 0);
  display.imageSmoothingEnabled = false;
  display.fillStyle = "#000";
  display.fillRect(0, 0, dw, dh);
  display.drawImage(bufs.canvas, 0, 0, dw, dh);

  const p = state.player;

  // crosshair
  display.fillStyle = "rgba(220,220,220,0.7)";
  display.fillRect(dw / 2 - 1, dh / 2 - 1, 3, 3);

  // damage / pickup flashes
  if (p.hurtTimer > 0) {
    display.fillStyle = `rgba(200,0,0,${Math.min(0.55, p.hurtTimer * 1.4)})`;
    display.fillRect(0, 0, dw, dh);
  }
  if (state.flashTimer > 0) {
    display.fillStyle = `rgba(255,220,120,${Math.min(0.25, state.flashTimer)})`;
    display.fillRect(0, 0, dw, dh);
  }

  // --------------------------------------------------------- HUD status bar
  // DOOM-style: AMMO | HEALTH | the marine's face | ARMOR on a raised panel
  const barH = Math.max(48, Math.round(dh * 0.11));
  display.fillStyle = "#17171a";
  display.fillRect(0, dh - barH, dw, barH);
  display.fillStyle = "#3c3c44"; // raised top edge
  display.fillRect(0, dh - barH, dw, 2);
  display.fillStyle = "#050506";
  display.fillRect(0, dh - 2, dw, 2);

  const labelSize = Math.max(9, Math.round(barH * 0.18));
  const numSize = Math.round(barH * 0.56);
  const labelY = dh - barH + Math.round(barH * 0.16);
  const numY = dh - barH / 2 + Math.round(barH * 0.12);
  display.textBaseline = "middle";

  const drawStat = (label: string, value: string, x: number, alert: boolean): void => {
    display.font = `bold ${labelSize}px monospace`;
    display.textAlign = "left";
    display.fillStyle = "#7a7a80";
    display.fillText(label, x, labelY);
    display.font = `bold ${numSize}px monospace`;
    display.fillStyle = alert ? "#ffd23c" : "#c81818";
    display.fillText(value, x, numY);
  };

  drawStat("AMMO", `${p.ammo}`, 14, p.ammo === 0);
  drawStat("HEALTH", `${Math.max(0, Math.floor(p.health))}%`, Math.round(dw * 0.24), p.health <= 25);
  drawStat("ARMOR", `${Math.floor(p.armor)}%`, Math.round(dw * 0.72), false);

  // the face: fires a grimace while shooting, winces when hurt, otherwise
  // glances around; blood level tracks health (dead = X eyes)
  const lvl = p.health >= 80 ? 0 : p.health >= 60 ? 1 : p.health >= 40 ? 2 : p.health >= 20 ? 3 : p.health > 0 ? 4 : 5;
  const faceKey = p.attackTimer > 0
    ? `${lvl}_fire`
    : p.hurtTimer > 0.3
      ? `${lvl}_pain`
      : `${lvl}_${(["left", "center", "right", "center"] as const)[Math.floor(timeMs / 1300) % 4]}`;
  const face = tex.faces[faceKey] ?? tex.faces["0_center"]!;
  const faceH = barH - 6;
  const faceW = (faceH * face.w) / face.h;
  const faceX = Math.round(dw / 2 - faceW / 2);
  const faceY = dh - barH + 3;
  display.fillStyle = "#0a0a0c";
  display.fillRect(faceX - 2, faceY - 2, faceW + 4, faceH + 2);
  display.imageSmoothingEnabled = false;
  display.drawImage(texCanvas(face), faceX, faceY, faceW, faceH);

  // pickup / event message
  if (state.messageTimer > 0 && state.message && !state.won) {
    display.textAlign = "left";
    display.font = `${Math.round(labelSize * 1.4)}px monospace`;
    display.fillStyle = "#d8c36a";
    display.fillText(state.message, 12, 18);
  }

  // --------------------------------------------------------- overlays
  if (state.won) {
    const secs = (state.winTime - state.startTime) / 1000;
    const pct = (n: number, total: number) => (total === 0 ? 0 : Math.round((n / total) * 100));
    display.fillStyle = "rgba(0,0,0,0.78)";
    display.fillRect(0, 0, dw, dh);
    display.textAlign = "center";
    display.fillStyle = "#ff3333";
    display.font = `bold ${Math.round(dh * 0.055)}px monospace`;
    display.fillText("E1M1: HANGAR", dw / 2, dh * 0.24);
    display.fillStyle = "#d8c36a";
    display.font = `bold ${Math.round(dh * 0.04)}px monospace`;
    display.fillText("FINISHED", dw / 2, dh * 0.33);
    display.textAlign = "left";
    display.font = `${Math.round(dh * 0.035)}px monospace`;
    const lx = dw / 2 - dw * 0.18;
    display.fillStyle = "#e8e8e8";
    display.fillText(`KILLS    ${state.kills}/${state.totalKills}  (${pct(state.kills, state.totalKills)}%)`, lx, dh * 0.46);
    display.fillText(`ITEMS    ${state.items}/${state.totalItems}  (${pct(state.items, state.totalItems)}%)`, lx, dh * 0.53);
    display.fillText(`SECRETS  ${state.secrets}/${state.totalSecrets}  (${pct(state.secrets, state.totalSecrets)}%)`, lx, dh * 0.6);
    display.fillText(`TIME     ${formatTime(secs * 1000)}`, lx, dh * 0.67);
    display.textAlign = "center";
    display.fillStyle = "#8a8a8a";
    display.font = `${Math.round(dh * 0.03)}px monospace`;
    display.fillText("PRESS ANY KEY", dw / 2, dh * 0.82);
  } else if (p.dead) {
    display.fillStyle = "rgba(120,0,0,0.45)";
    display.fillRect(0, 0, dw, dh);
    display.textAlign = "center";
    display.fillStyle = "#ff3333";
    display.font = `bold ${Math.round(dh * 0.09)}px monospace`;
    display.fillText("YOU DIED", dw / 2, dh * 0.42);
    display.fillStyle = "#e8e8e8";
    display.fillText(`PRESS R TO RESTART — ESC TO QUIT`, dw / 2, dh * 0.55);
  } else if (ui.paused) {
    display.fillStyle = "rgba(0,0,0,0.55)";
    display.fillRect(0, 0, dw, dh);
    display.textAlign = "center";
    display.fillStyle = "#d8c36a";
    display.font = `bold ${Math.round(dh * 0.05)}px monospace`;
    display.fillText("PAUSED", dw / 2, dh * 0.4);
    display.fillStyle = "#e8e8e8";
    display.font = `${Math.round(dh * 0.032)}px monospace`;
    display.fillText("CLICK TO PLAY — ESC TO QUIT", dw / 2, dh * 0.5);
    display.fillText("WASD MOVE · MOUSE LOOK · CLICK FIRE · SPACE USE", dw / 2, dh * 0.57);
  }
}
