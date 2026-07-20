import { useEffect, useRef } from "react";
import { createInitialState, updateGame, useAction } from "./engine";
import { createRenderBuffers, renderGame } from "./render";
import { generateTextures } from "./textures";
import { SoundFX } from "./sound";

export default function DoomGame({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const exitRef = useRef(onExit);
  exitRef.current = onExit;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const display = canvas.getContext("2d");
    if (!display) return;

    let state = createInitialState();
    const textures = generateTextures();
    const bufs = createRenderBuffers();
    const sfx = new SoundFX();
    const ui = { paused: true };
    let raf = 0;

    const resize = () => {
      let dw = window.innerWidth;
      let dh = (dw * 9) / 16;
      if (dh > window.innerHeight) {
        dh = window.innerHeight;
        dw = (dh * 16) / 9;
      }
      canvas.width = Math.floor(dw);
      canvas.height = Math.floor(dh);
    };
    resize();

    const lock = (): void => {
      try {
        const p = canvas.requestPointerLock() as unknown;
        if (p instanceof Promise) p.catch(() => undefined);
      } catch {
        // pointer lock unavailable — keyboard still works
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (state.won) {
        if (performance.now() - state.winTime > 800) {
          e.preventDefault();
          exitRef.current();
        }
        return;
      }
      if (e.key === "Escape") {
        // when pointer-locked the browser exits the lock instead; the
        // pointerlockchange handler pauses the game in that case
        if (!document.pointerLockElement) exitRef.current();
        return;
      }
      const k = e.key.toLowerCase();
      if (k === "r" && state.player.dead) {
        state = createInitialState();
        return;
      }
      if (k === " ") {
        useAction(state, sfx);
        e.preventDefault();
        return;
      }
      state.keys.add(k);
      if (k.startsWith("arrow") || k === "w" || k === "a" || k === "s" || k === "d") {
        e.preventDefault();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      state.keys.delete(e.key.toLowerCase());
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (state.won) {
        if (performance.now() - state.winTime > 800) exitRef.current();
        return;
      }
      if (document.pointerLockElement !== canvas) {
        lock();
        return;
      }
      state.firing = true;
    };

    const onMouseUp = () => {
      state.firing = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === canvas) state.mouseDX += e.movementX;
    };

    const onLockChange = () => {
      ui.paused = document.pointerLockElement !== canvas;
      if (ui.paused) {
        state.keys.clear();
        state.firing = false;
      }
    };

    const loop = (time: number) => {
      if (!ui.paused) updateGame(state, time, sfx);
      else state.lastTime = time; // no dt jump when resuming
      renderGame(display, canvas.width, canvas.height, bufs, state, textures, time, ui);
      // testing hook: lets the automated playthrough read position/health/won
      (window as unknown as Record<string, unknown>).__doom = state;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    window.addEventListener("resize", resize);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("pointerlockchange", onLockChange);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("pointerlockchange", onLockChange);
      if (document.pointerLockElement === canvas) document.exitPointerLock();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <canvas ref={canvasRef} className="block cursor-crosshair" />
    </div>
  );
}
