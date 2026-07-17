import { CELL_SIZE, isSkyCell } from "./map";
import type { GameState, Sprite } from "./types";
import type { Tex, Textures } from "./textures";

export const VIEW_W = 480;
export const VIEW_H = 270;
const FOV = (Math.PI / 180) * 66;
const PROJ_DIST = VIEW_W / 2 / Math.tan(FOV / 2);
const HORIZON = VIEW_H / 2;
const MAX_VIEW_CELLS = 16;
const TWO_PI = Math.PI * 2;

export interface RenderBuffers {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  image: ImageData;
  pixels: Uint32Array;
  zbuffer: Float32Array;
  cosA: Float32Array;
  sinA: Float32Array;
  cosRel: Float32Array;
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
    cosA: new Float32Array(VIEW_W),
    sinA: new Float32Array(VIEW_W),
    cosRel: new Float32Array(VIEW_W),
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

interface WallHit {
  perpDist: number; // in cells
  tex: Tex;
  u: number; // 0..63
  side: 0 | 1;
}

function castWall(state: GameState, tex: Textures, px: number, py: number, rdx: number, rdy: number): WallHit | null {
  // everything in cell units
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

  for (let iter = 0; iter < 64; iter++) {
    let side: 0 | 1;
    let tEnter: number;
    if (sideX < sideY) {
      sideX += deltaX;
      mapX += stepX;
      side = 0;
      tEnter = sideX - deltaX;
    } else {
      sideY += deltaY;
      mapY += stepY;
      side = 1;
      tEnter = sideY - deltaY;
    }
    const ch = state.walls[mapY]?.[mapX] ?? "#";

    if (ch === "D" || ch === "S") {
      const door = state.doors.find((d) => d.x === mapX && d.y === mapY);
      const open = door?.open ?? 0;
      if (open >= 0.999) continue;
      // door slab sits in the middle of the cell, sliding sideways as it opens
      if (door?.axis === "ew") {
        const t = (mapX + 0.5 - px) / rdx;
        if (t <= tEnter + 1e-9) continue;
        const frac = py + t * rdy - mapY;
        if (frac < open) continue; // ray slips through the opening
        return { perpDist: t, tex: tex.walls[ch === "S" ? "S" : "D"] ?? tex.walls["#"]!, u: (frac - open) * 64, side: 0 };
      } else {
        const t = (mapY + 0.5 - py) / rdy;
        if (t <= tEnter + 1e-9) continue;
        const frac = px + t * rdx - mapX;
        if (frac < open) continue;
        return { perpDist: t, tex: tex.walls[ch === "S" ? "S" : "D"] ?? tex.walls["#"]!, u: (frac - open) * 64, side: 1 };
      }
    }

    if (ch === "L" && state.armorIslandDown) continue;
    const wallTex = tex.walls[ch];
    if (!wallTex) continue; // not a wall: keep marching

    const perpDist = side === 0 ? sideX - deltaX : sideY - deltaY;
    const wallX = side === 0 ? py + perpDist * rdy : px + perpDist * rdx;
    let u = (wallX - Math.floor(wallX)) * 64;
    if ((side === 0 && rdx > 0) || (side === 1 && rdy < 0)) u = 63 - u;
    return { perpDist, tex: wallTex, u, side };
  }
  return null;
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

export function renderScene(bufs: RenderBuffers, state: GameState, tex: Textures, timeMs: number): void {
  const p = state.player;
  const px = p.pos.x / CELL_SIZE;
  const py = p.pos.y / CELL_SIZE;
  const { pixels, zbuffer, cosA, sinA, cosRel } = bufs;
  const nukeShift = Math.floor(timeMs / 90) % 64;

  // per-column ray directions
  for (let x = 0; x < VIEW_W; x++) {
    const angle = p.dir - FOV / 2 + (x / VIEW_W) * FOV;
    cosA[x] = Math.cos(angle);
    sinA[x] = Math.sin(angle);
    cosRel[x] = Math.cos(angle - p.dir);
  }

  // ------------------------------------------------ sky + floor + ceiling
  const sky = tex.sky;
  const ceilTex = tex.ceiling;
  for (let y = 0; y < VIEW_H; y++) {
    const isCeil = y < HORIZON;
    const rowDist = (0.5 * PROJ_DIST) / Math.abs(y - HORIZON || 0.5); // cells
    const shade = shadeInt(Math.round(256 * (1 - rowDist / MAX_VIEW_CELLS)));
    for (let x = 0; x < VIEW_W; x++) {
      const dist = rowDist / (cosRel[x] ?? 1);
      const wx = px + dist * (cosA[x] ?? 0);
      const wy = py + dist * (sinA[x] ?? 0);
      const cx = Math.floor(wx);
      const cy = Math.floor(wy);
      let c: number;
      if (isCeil) {
        if (isSkyCell(cx, cy)) {
          // sky mapped by view angle + row, mountains near the horizon
          const angle = p.dir - FOV / 2 + (x / VIEW_W) * FOV;
          const su = Math.floor((((angle % TWO_PI) + TWO_PI) % TWO_PI) / TWO_PI * sky.w) % sky.w;
          const sv = Math.min(sky.h - 1, Math.floor((y / HORIZON) * sky.h));
          c = sky.data[sv * sky.w + su] ?? 0xff000000;
          pixels[y * VIEW_W + x] = c; // sky stays unshaded
          continue;
        }
        const u = Math.floor((wx - cx) * 63.99);
        const v = Math.floor((wy - cy) * 63.99);
        c = ceilTex.data[v * 64 + u] ?? 0xff000000;
      } else {
        const fch = state.walls[cy]?.[cx] ?? "#";
        const ft = tex.floors[fch] ?? tex.floors["."]!;
        let u = Math.floor((wx - cx) * 63.99);
        let v = Math.floor((wy - cy) * 63.99);
        if (fch === "~") {
          u = (u + nukeShift) & 63;
          v = (v + nukeShift / 2) & 63;
        }
        c = ft.data[v * 64 + u] ?? 0xff000000;
      }
      pixels[y * VIEW_W + x] = shadeColor(c, shade);
    }
  }

  // ------------------------------------------------ walls
  for (let x = 0; x < VIEW_W; x++) {
    const hit = castWall(state, tex, px, py, cosA[x] ?? 1, sinA[x] ?? 0);
    if (!hit) {
      zbuffer[x] = MAX_VIEW_CELLS;
      continue;
    }
    zbuffer[x] = hit.perpDist;
    const lineH = PROJ_DIST / hit.perpDist;
    const startF = HORIZON - lineH / 2;
    const endF = HORIZON + lineH / 2;
    const y0 = Math.max(0, Math.ceil(startF));
    const y1 = Math.min(VIEW_H - 1, Math.floor(endF));
    let shade = shadeInt(Math.round(256 * (1 - hit.perpDist / MAX_VIEW_CELLS)));
    if (hit.side === 1) shade = (shade * 3) >> 2; // N-S walls darker
    const u = Math.min(63, Math.max(0, Math.floor(hit.u)));
    const texH = hit.tex.h;
    for (let y = y0; y <= y1; y++) {
      const v = Math.min(texH - 1, Math.max(0, Math.floor(((y - startF) / lineH) * texH)));
      const c = hit.tex.data[v * hit.tex.w + u] ?? 0xff000000;
      pixels[y * VIEW_W + x] = shadeColor(c, shade);
    }
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
    const bottom = HORIZON + lineH / 2;
    const top = bottom - spriteH;
    const x0 = Math.max(0, Math.ceil(screenX - spriteW / 2));
    const x1 = Math.min(VIEW_W - 1, Math.floor(screenX + spriteW / 2));
    const shade = shadeInt(Math.round(256 * (1 - perpDist / MAX_VIEW_CELLS)));
    for (let x = x0; x <= x1; x++) {
      if ((zbuffer[x] ?? MAX_VIEW_CELLS) <= perpDist) continue;
      const u = Math.floor(((x - (screenX - spriteW / 2)) / spriteW) * st.w);
      if (u < 0 || u >= st.w) continue;
      const sy0 = Math.max(0, Math.ceil(top));
      const sy1 = Math.min(VIEW_H - 1, Math.floor(bottom));
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
  const scale = 2.3;
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
  const barH = Math.max(38, Math.round(dh * 0.09));
  display.fillStyle = "#202020";
  display.fillRect(0, dh - barH, dw, barH);
  display.fillStyle = "#0a0a0a";
  display.fillRect(0, dh - barH, dw, 2);
  const fontSize = Math.round(barH * 0.52);
  display.font = `bold ${fontSize}px monospace`;
  display.textBaseline = "middle";
  const textY = dh - barH / 2 + 1;
  display.textAlign = "left";
  display.fillStyle = "#8a8a8a";
  display.fillText("HEALTH", 12, textY);
  display.fillStyle = p.health > 25 ? "#e8e8e8" : "#ff3333";
  display.fillText(`${Math.max(0, Math.floor(p.health))}%`, 24 + fontSize * 4.2, textY);
  const midX = dw / 2;
  display.fillStyle = "#8a8a8a";
  display.textAlign = "right";
  display.fillText("AMMO", midX - 12, textY);
  display.fillStyle = "#e8e8e8";
  display.textAlign = "left";
  display.fillText(`${p.ammo}`, midX + 12, textY);
  display.fillStyle = "#8a8a8a";
  display.textAlign = "right";
  display.fillText("ARMOR", dw - fontSize * 4.4, textY);
  display.fillStyle = "#e8e8e8";
  display.fillText(`${Math.floor(p.armor)}%`, dw - 12, textY);

  // pickup / event message
  if (state.messageTimer > 0 && state.message && !state.won) {
    display.textAlign = "left";
    display.font = `${Math.round(fontSize * 0.62)}px monospace`;
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
    display.font = `${Math.round(dh * 0.035)}px monospace`;
    display.fillText("PRESS R TO RESTART — ESC TO QUIT", dw / 2, dh * 0.55);
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
