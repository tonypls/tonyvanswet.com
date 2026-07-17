// Procedurally generated DOOM-style textures. Everything is drawn on canvases
// once at startup and stored as Uint32 pixel arrays (0xAABBGGRR little-endian)
// so the raycaster can sample them directly.

export interface Tex {
  w: number;
  h: number;
  data: Uint32Array;
}

export type SpriteKey =
  | "zombieman"
  | "zombiemanAttack"
  | "zombiemanPain"
  | "zombiemanDead"
  | "imp"
  | "impAttack"
  | "impPain"
  | "impDead"
  | "barrel"
  | "explosion0"
  | "explosion1"
  | "explosion2"
  | "fireball"
  | "medkit"
  | "stimpack"
  | "clip"
  | "greenArmor"
  | "megaArmor"
  | "healthBonus"
  | "armorBonus";

export interface Textures {
  walls: Record<string, Tex>; // keyed by wall char from the map
  floors: Record<string, Tex>; // keyed by floor char
  ceiling: Tex;
  sky: Tex;
  sprites: Record<SpriteKey, Tex>;
  gun: Tex[]; // 0 = idle, 1 = firing
}

function makeTex(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): Tex {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context not available");
  draw(ctx);
  const img = ctx.getImageData(0, 0, w, h);
  return { w, h, data: new Uint32Array(img.data.buffer.slice(0)) };
}

function speckle(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  count: number,
  color: string,
  size = 1,
): void {
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    ctx.fillRect(Math.floor(Math.random() * w), Math.floor(Math.random() * h), size, size);
  }
}

function rivets(ctx: CanvasRenderingContext2D, color: string, inset: number, w: number, h: number): void {
  ctx.fillStyle = color;
  const pts: Array<[number, number]> = [
    [inset, inset],
    [w - inset - 2, inset],
    [inset, h - inset - 2],
    [w - inset - 2, h - inset - 2],
  ];
  for (const [x, y] of pts) ctx.fillRect(x, y, 2, 2);
}

// ---------------------------------------------------------------- walls

function techWall(): Tex {
  return makeTex(64, 64, (ctx) => {
    ctx.fillStyle = "#7a7a6a";
    ctx.fillRect(0, 0, 64, 64);
    // vertical gradient grime
    const grad = ctx.createLinearGradient(0, 0, 0, 64);
    grad.addColorStop(0, "rgba(255,255,255,0.08)");
    grad.addColorStop(1, "rgba(0,0,0,0.28)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    // panel seams
    ctx.fillStyle = "#4a4a40";
    ctx.fillRect(0, 0, 64, 2);
    ctx.fillRect(0, 32, 64, 2);
    ctx.fillRect(31, 0, 2, 64);
    ctx.fillRect(0, 62, 64, 2);
    // inset panels
    ctx.strokeStyle = "#5a5a4e";
    ctx.strokeRect(4.5, 4.5, 23, 23);
    ctx.strokeRect(36.5, 4.5, 23, 23);
    ctx.strokeRect(4.5, 36.5, 23, 23);
    ctx.strokeRect(36.5, 36.5, 23, 23);
    rivets(ctx, "#3a3a32", 7, 64, 64);
    speckle(ctx, 64, 64, 90, "rgba(0,0,0,0.18)");
    speckle(ctx, 64, 64, 40, "rgba(255,255,255,0.08)");
  });
}

function brownWall(): Tex {
  return makeTex(64, 64, (ctx) => {
    ctx.fillStyle = "#6b4a2f";
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = "#54371f";
    for (let y = 7; y < 64; y += 8) ctx.fillRect(0, y, 64, 1);
    ctx.fillStyle = "#7d5a3a";
    for (let y = 3; y < 64; y += 8) ctx.fillRect(0, y, 64, 1);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(0, 56, 64, 8);
    speckle(ctx, 64, 64, 120, "rgba(0,0,0,0.22)");
    speckle(ctx, 64, 64, 30, "rgba(255,220,160,0.10)");
  });
}

function computerWall(): Tex {
  return makeTex(64, 64, (ctx) => {
    ctx.fillStyle = "#3a3f4a";
    ctx.fillRect(0, 0, 64, 64);
    // screen
    ctx.fillStyle = "#12202e";
    ctx.fillRect(6, 6, 52, 26);
    ctx.fillStyle = "#1d3a52";
    for (let y = 8; y < 30; y += 3) ctx.fillRect(8, y, 48, 1);
    ctx.fillStyle = "#3fd08a";
    ctx.fillRect(10, 10, 18, 2);
    ctx.fillRect(10, 15, 28, 2);
    ctx.fillStyle = "#2a8a5a";
    ctx.fillRect(10, 20, 22, 2);
    ctx.fillRect(10, 25, 30, 2);
    // lower panel + lights
    ctx.fillStyle = "#2c303a";
    ctx.fillRect(6, 38, 52, 20);
    const colors = ["#ff5533", "#33ff66", "#ffcc33", "#33aaff"];
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = colors[i % 4] ?? "#ffffff";
      ctx.fillRect(10 + (i % 6) * 8, 42 + Math.floor(i / 6) * 8, 4, 4);
    }
    ctx.strokeStyle = "#20242c";
    ctx.strokeRect(5.5, 5.5, 53, 27);
    ctx.strokeRect(5.5, 37.5, 53, 21);
    speckle(ctx, 64, 64, 40, "rgba(0,0,0,0.25)");
  });
}

function techLightWall(): Tex {
  return makeTex(64, 64, (ctx) => {
    ctx.fillStyle = "#5a5f6a";
    ctx.fillRect(0, 0, 64, 64);
    const grad = ctx.createLinearGradient(0, 0, 0, 64);
    grad.addColorStop(0, "rgba(255,255,255,0.06)");
    grad.addColorStop(1, "rgba(0,0,0,0.3)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    // light strips
    ctx.fillStyle = "#e8e8d0";
    ctx.fillRect(4, 8, 56, 5);
    ctx.fillRect(4, 51, 56, 5);
    ctx.fillStyle = "rgba(255,255,220,0.35)";
    ctx.fillRect(4, 6, 56, 9);
    ctx.fillRect(4, 49, 56, 9);
    // seams and vents
    ctx.fillStyle = "#3a3e48";
    ctx.fillRect(31, 0, 2, 64);
    for (let x = 8; x < 60; x += 6) ctx.fillRect(x, 24, 3, 16);
    speckle(ctx, 64, 64, 60, "rgba(0,0,0,0.2)");
  });
}

function exitSignWall(): Tex {
  return makeTex(64, 64, (ctx) => {
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = "#551111";
    ctx.fillRect(0, 4, 64, 3);
    ctx.fillRect(0, 57, 64, 3);
    ctx.fillStyle = "#ff2222";
    ctx.font = "bold 26px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("EXIT", 32, 32);
    speckle(ctx, 64, 64, 40, "rgba(255,0,0,0.12)");
  });
}

function exitSwitchWall(): Tex {
  return makeTex(64, 64, (ctx) => {
    ctx.fillStyle = "#26262a";
    ctx.fillRect(0, 0, 64, 64);
    ctx.strokeStyle = "#151518";
    ctx.strokeRect(2.5, 2.5, 59, 59);
    // panel
    ctx.fillStyle = "#3a3a40";
    ctx.fillRect(16, 10, 32, 44);
    ctx.strokeStyle = "#1a1a1e";
    ctx.strokeRect(16.5, 10.5, 31, 43);
    // red switch
    ctx.fillStyle = "#5a1010";
    ctx.fillRect(26, 18, 12, 28);
    ctx.fillStyle = "#cc2222";
    ctx.fillRect(28, 20, 8, 14);
    ctx.fillStyle = "#7a1515";
    ctx.fillRect(28, 34, 8, 10);
    speckle(ctx, 64, 64, 40, "rgba(0,0,0,0.3)");
  });
}

function doorWall(): Tex {
  return makeTex(64, 64, (ctx) => {
    ctx.fillStyle = "#6a6f7a";
    ctx.fillRect(0, 0, 64, 64);
    const grad = ctx.createLinearGradient(0, 0, 0, 64);
    grad.addColorStop(0, "rgba(255,255,255,0.10)");
    grad.addColorStop(1, "rgba(0,0,0,0.3)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    // center split + frame
    ctx.fillStyle = "#3a3e46";
    ctx.fillRect(30, 0, 4, 64);
    ctx.fillRect(0, 0, 64, 3);
    ctx.fillRect(0, 46, 64, 3);
    // hazard stripes
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 === 0 ? "#c8a820" : "#2a2a2a";
      ctx.beginPath();
      ctx.moveTo(i * 8, 64);
      ctx.lineTo(i * 8 + 8, 64);
      ctx.lineTo(i * 8 + 8 + 6, 50);
      ctx.lineTo(i * 8 + 6, 50);
      ctx.closePath();
      ctx.fill();
    }
    speckle(ctx, 64, 64, 50, "rgba(0,0,0,0.2)");
  });
}

// ---------------------------------------------------------------- floors

function concreteFloor(): Tex {
  return makeTex(64, 64, (ctx) => {
    ctx.fillStyle = "#767676";
    ctx.fillRect(0, 0, 64, 64);
    speckle(ctx, 64, 64, 260, "rgba(0,0,0,0.16)");
    speckle(ctx, 64, 64, 140, "rgba(255,255,255,0.07)");
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(0, 31, 64, 2);
    ctx.fillRect(31, 0, 2, 64);
  });
}

function darkFloor(): Tex {
  return makeTex(64, 64, (ctx) => {
    ctx.fillStyle = "#484848";
    ctx.fillRect(0, 0, 64, 64);
    speckle(ctx, 64, 64, 260, "rgba(0,0,0,0.2)");
    speckle(ctx, 64, 64, 100, "rgba(255,255,255,0.05)");
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(0, 31, 64, 2);
    ctx.fillRect(31, 0, 2, 64);
  });
}

function walkwayFloor(): Tex {
  return makeTex(64, 64, (ctx) => {
    ctx.fillStyle = "#6a5f4a";
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = "#4a4132";
    for (let y = 15; y < 64; y += 16) ctx.fillRect(0, y, 64, 2);
    for (let x = 15; x < 64; x += 16) ctx.fillRect(x, 0, 2, 64);
    rivets(ctx, "#3a332a", 6, 64, 64);
    ctx.fillStyle = "rgba(255,240,200,0.08)";
    ctx.fillRect(0, 0, 64, 4);
    speckle(ctx, 64, 64, 120, "rgba(0,0,0,0.2)");
  });
}

function nukageFloor(): Tex {
  return makeTex(64, 64, (ctx) => {
    ctx.fillStyle = "#2e5c16";
    ctx.fillRect(0, 0, 64, 64);
    // bubbles
    for (let i = 0; i < 14; i++) {
      const x = Math.random() * 64;
      const y = Math.random() * 64;
      const r = 2 + Math.random() * 5;
      ctx.fillStyle = Math.random() > 0.5 ? "#4a8a2a" : "#3a7020";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(200,255,150,0.25)";
      ctx.beginPath();
      ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    speckle(ctx, 64, 64, 80, "rgba(10,30,5,0.4)");
  });
}

function ceilingTex(): Tex {
  return makeTex(64, 64, (ctx) => {
    ctx.fillStyle = "#3c3c3c";
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = "#2c2c2c";
    ctx.fillRect(0, 0, 64, 2);
    ctx.fillRect(0, 32, 64, 2);
    ctx.fillRect(0, 0, 2, 64);
    ctx.fillRect(32, 0, 2, 64);
    speckle(ctx, 64, 64, 120, "rgba(0,0,0,0.25)");
    speckle(ctx, 64, 64, 30, "rgba(255,255,255,0.04)");
  });
}

function skyTex(): Tex {
  return makeTex(256, 128, (ctx) => {
    const grad = ctx.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, "#b89a6c");
    grad.addColorStop(0.55, "#a07c50");
    grad.addColorStop(1, "#6b4a2c");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 128);
    // clouds
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 90;
      const r = 4 + Math.random() * 14;
      ctx.fillStyle = `rgba(${200 + Math.random() * 40},${170 + Math.random() * 30},${120 + Math.random() * 30},0.10)`;
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.8, r * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // mountains on the horizon
    ctx.fillStyle = "#5a3a22";
    for (let x = 0; x < 256; x += 4) {
      const h = 8 + Math.abs(Math.sin(x * 0.11) * 14) + Math.random() * 4;
      ctx.fillRect(x, 128 - h, 4, h);
    }
  });
}

// ---------------------------------------------------------------- sprites

function zombiemanBase(ctx: CanvasRenderingContext2D, opts: { pain?: boolean }): void {
  const skin = opts.pain ? "#c87858" : "#d8a878";
  // legs
  ctx.fillStyle = "#4a4a42";
  ctx.fillRect(24, 44, 6, 18);
  ctx.fillRect(34, 44, 6, 18);
  // torso (uniform)
  ctx.fillStyle = "#7a7a6a";
  ctx.fillRect(22, 22, 20, 24);
  ctx.fillStyle = "#5a5a4e";
  ctx.fillRect(22, 22, 20, 4);
  // arms
  ctx.fillStyle = "#6a6a5e";
  ctx.fillRect(16, 24, 6, 16);
  ctx.fillRect(42, 24, 6, 16);
  // rifle
  ctx.fillStyle = "#2a2a2a";
  ctx.fillRect(18, 34, 28, 5);
  ctx.fillRect(14, 36, 6, 3);
  // head
  ctx.fillStyle = skin;
  ctx.fillRect(25, 8, 14, 14);
  // green hair
  ctx.fillStyle = "#3a7a2a";
  ctx.fillRect(25, 6, 14, 5);
  ctx.fillRect(25, 8, 3, 8);
  // eyes
  ctx.fillStyle = "#881111";
  ctx.fillRect(28, 14, 3, 2);
  ctx.fillRect(34, 14, 3, 2);
  if (opts.pain) {
    ctx.fillStyle = "rgba(180,20,20,0.7)";
    ctx.fillRect(22, 24, 6, 8);
    ctx.fillRect(34, 30, 5, 6);
  }
}

function impBase(ctx: CanvasRenderingContext2D, opts: { attack?: boolean; pain?: boolean }): void {
  const body = opts.pain ? "#9a5a3a" : "#8a5a3a";
  // legs
  ctx.fillStyle = "#6a4028";
  ctx.fillRect(22, 46, 7, 16);
  ctx.fillRect(35, 46, 7, 16);
  // hunched torso
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(32, 34, 13, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  // shoulder spikes
  ctx.fillStyle = "#d8cfc0";
  ctx.beginPath();
  ctx.moveTo(19, 26);
  ctx.lineTo(15, 16);
  ctx.lineTo(24, 22);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(45, 26);
  ctx.lineTo(49, 16);
  ctx.lineTo(40, 22);
  ctx.closePath();
  ctx.fill();
  // head
  ctx.fillStyle = body;
  ctx.fillRect(24, 8, 16, 13);
  // eyes
  ctx.fillStyle = "#ff2222";
  ctx.fillRect(27, 12, 4, 3);
  ctx.fillRect(34, 12, 4, 3);
  // mouth
  ctx.fillStyle = "#3a2015";
  ctx.fillRect(28, 18, 9, 2);
  // arms
  ctx.fillStyle = body;
  if (opts.attack) {
    ctx.fillRect(12, 10, 6, 16);
    ctx.fillRect(46, 10, 6, 16);
    // fireball glow in hands
    ctx.fillStyle = "#ffcc33";
    ctx.beginPath();
    ctx.arc(15, 8, 5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(15, 26, 6, 18);
    ctx.fillRect(43, 26, 6, 18);
    // claws
    ctx.fillStyle = "#d8cfc0";
    ctx.fillRect(15, 44, 6, 4);
    ctx.fillRect(43, 44, 6, 4);
  }
  if (opts.pain) {
    ctx.fillStyle = "rgba(180,20,20,0.7)";
    ctx.fillRect(26, 30, 8, 8);
  }
}

function explosionFrame(frame: number): Tex {
  return makeTex(64, 64, (ctx) => {
    if (frame === 0) {
      ctx.fillStyle = "#ffcc33";
      ctx.beginPath();
      ctx.arc(32, 40, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ff8822";
      ctx.beginPath();
      ctx.arc(32, 40, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffee88";
      ctx.beginPath();
      ctx.arc(32, 40, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (frame === 1) {
      ctx.fillStyle = "#cc4411";
      ctx.beginPath();
      ctx.arc(32, 38, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ff8822";
      ctx.beginPath();
      ctx.arc(32, 38, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffee88";
      ctx.beginPath();
      ctx.arc(32, 36, 10, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "rgba(80,70,60,0.8)";
      ctx.beginPath();
      ctx.arc(32, 34, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(120,60,30,0.6)";
      ctx.beginPath();
      ctx.arc(32, 36, 14, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function itemTex(kind: SpriteKey): Tex {
  return makeTex(32, 32, (ctx) => {
    switch (kind) {
      case "medkit":
        ctx.fillStyle = "#e8e8e8";
        ctx.fillRect(3, 8, 26, 18);
        ctx.fillStyle = "#b8b8b8";
        ctx.fillRect(3, 24, 26, 2);
        ctx.fillStyle = "#cc2222";
        ctx.fillRect(13, 11, 6, 12);
        ctx.fillRect(7, 14, 18, 6);
        break;
      case "stimpack":
        ctx.fillStyle = "#d8d8d8";
        ctx.fillRect(8, 14, 16, 10);
        ctx.fillStyle = "#cc2222";
        ctx.fillRect(14, 16, 4, 6);
        ctx.fillRect(11, 18, 10, 3);
        break;
      case "clip":
        ctx.fillStyle = "#3a3a3a";
        ctx.fillRect(6, 16, 20, 8);
        ctx.fillStyle = "#c8a820";
        for (let i = 0; i < 5; i++) ctx.fillRect(8 + i * 4, 10, 2, 8);
        break;
      case "greenArmor":
      case "megaArmor": {
        const main = kind === "greenArmor" ? "#2a8a2a" : "#2a5ac8";
        const dark = kind === "greenArmor" ? "#1a5a1a" : "#1a3a88";
        ctx.fillStyle = main;
        ctx.beginPath();
        ctx.moveTo(6, 10);
        ctx.lineTo(12, 4);
        ctx.lineTo(20, 4);
        ctx.lineTo(26, 10);
        ctx.lineTo(24, 28);
        ctx.lineTo(8, 28);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = dark;
        ctx.fillRect(14, 6, 4, 20);
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.fillRect(9, 8, 3, 14);
        break;
      }
      case "healthBonus":
        ctx.fillStyle = "#2a5ac8";
        ctx.fillRect(11, 10, 10, 16);
        ctx.fillStyle = "#e8e8e8";
        ctx.fillRect(14, 13, 4, 10);
        ctx.fillRect(11, 16, 10, 4);
        break;
      case "armorBonus":
        ctx.fillStyle = "#2a8a2a";
        ctx.beginPath();
        ctx.arc(16, 17, 9, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(7, 17, 18, 5);
        ctx.fillStyle = "#123a12";
        ctx.fillRect(10, 18, 12, 3);
        break;
      case "fireball": {
        ctx.fillStyle = "#cc3311";
        ctx.beginPath();
        ctx.arc(16, 16, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ff8822";
        ctx.beginPath();
        ctx.arc(16, 16, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffee88";
        ctx.beginPath();
        ctx.arc(16, 16, 3, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      default:
        break;
    }
  });
}

function gunTex(firing: boolean): Tex {
  return makeTex(64, 64, (ctx) => {
    if (firing) {
      // muzzle flash
      ctx.fillStyle = "#ffee88";
      ctx.beginPath();
      ctx.moveTo(32, 2);
      ctx.lineTo(36, 14);
      ctx.lineTo(48, 10);
      ctx.lineTo(38, 20);
      ctx.lineTo(44, 30);
      ctx.lineTo(32, 24);
      ctx.lineTo(20, 30);
      ctx.lineTo(26, 20);
      ctx.lineTo(16, 10);
      ctx.lineTo(28, 14);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ff9922";
      ctx.beginPath();
      ctx.arc(32, 18, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    // slide
    ctx.fillStyle = "#8a8a8a";
    ctx.fillRect(26, 22, 12, 22);
    ctx.fillStyle = "#6a6a6a";
    ctx.fillRect(26, 22, 3, 22);
    // barrel
    ctx.fillStyle = "#3a3a3a";
    ctx.fillRect(30, 16, 4, 8);
    // grip
    ctx.fillStyle = "#4a3a2a";
    ctx.fillRect(24, 44, 16, 18);
    ctx.fillStyle = "#33291d";
    ctx.fillRect(24, 44, 4, 18);
    // trigger guard
    ctx.fillStyle = "#5a5a5a";
    ctx.fillRect(26, 42, 12, 4);
  });
}

// ----------------------------------------------------------------

export function generateTextures(): Textures {
  const tech = techWall();
  const brown = brownWall();
  return {
    walls: {
      "#": tech,
      B: brown,
      C: computerWall(),
      T: techLightWall(),
      N: exitSignWall(),
      E: exitSwitchWall(),
      D: doorWall(),
      S: tech, // secret door blends in
      L: brown, // armor island matches brown
    },
    floors: {
      ".": concreteFloor(),
      ",": darkFloor(),
      ":": walkwayFloor(),
      "~": nukageFloor(),
    },
    ceiling: ceilingTex(),
    sky: skyTex(),
    sprites: {
      zombieman: makeTex(64, 64, (ctx) => zombiemanBase(ctx, {})),
      zombiemanAttack: makeTex(64, 64, (ctx) => {
        zombiemanBase(ctx, {});
        ctx.fillStyle = "#ffee88";
        ctx.beginPath();
        ctx.arc(14, 36, 6, 0, Math.PI * 2);
        ctx.fill();
      }),
      zombiemanPain: makeTex(64, 64, (ctx) => zombiemanBase(ctx, { pain: true })),
      zombiemanDead: makeTex(64, 64, (ctx) => {
        ctx.fillStyle = "rgba(140,15,15,0.85)";
        ctx.beginPath();
        ctx.ellipse(32, 54, 20, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#7a7a6a";
        ctx.fillRect(14, 46, 30, 9);
        ctx.fillStyle = "#d8a878";
        ctx.fillRect(44, 47, 10, 8);
        ctx.fillStyle = "#3a7a2a";
        ctx.fillRect(44, 45, 10, 4);
      }),
      imp: makeTex(64, 64, (ctx) => impBase(ctx, {})),
      impAttack: makeTex(64, 64, (ctx) => impBase(ctx, { attack: true })),
      impPain: makeTex(64, 64, (ctx) => impBase(ctx, { pain: true })),
      impDead: makeTex(64, 64, (ctx) => {
        ctx.fillStyle = "rgba(140,15,15,0.85)";
        ctx.beginPath();
        ctx.ellipse(32, 54, 22, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#8a5a3a";
        ctx.fillRect(12, 46, 34, 9);
        ctx.fillStyle = "#d8cfc0";
        ctx.fillRect(46, 48, 8, 5);
      }),
      barrel: makeTex(64, 64, (ctx) => {
        ctx.fillStyle = "#5a6a4a";
        ctx.fillRect(18, 14, 28, 44);
        ctx.beginPath();
        ctx.ellipse(32, 14, 14, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#46543a";
        ctx.fillRect(18, 22, 28, 3);
        ctx.fillRect(18, 40, 28, 3);
        ctx.fillStyle = "#75865f";
        ctx.fillRect(21, 16, 4, 40);
        ctx.fillStyle = "#c8a820";
        ctx.beginPath();
        ctx.moveTo(32, 28);
        ctx.lineTo(38, 36);
        ctx.lineTo(26, 36);
        ctx.closePath();
        ctx.fill();
      }),
      explosion0: explosionFrame(0),
      explosion1: explosionFrame(1),
      explosion2: explosionFrame(2),
      fireball: itemTex("fireball"),
      medkit: itemTex("medkit"),
      stimpack: itemTex("stimpack"),
      clip: itemTex("clip"),
      greenArmor: itemTex("greenArmor"),
      megaArmor: itemTex("megaArmor"),
      healthBonus: itemTex("healthBonus"),
      armorBonus: itemTex("armorBonus"),
    },
    gun: [gunTex(false), gunTex(true)],
  };
}
