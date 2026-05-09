import type { Vector2 } from "./types";
import { clamp } from "./Collision";

export class InputManager {
  private keys = new Set<string>();
  private pointer = { active: false, fireQueued: false, x: 0, y: 0, startX: 0, startY: 0 };
  private canvas?: HTMLCanvasElement;

  attach(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
  }

  detach() {
    if (!this.canvas) return;
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
    this.canvas = undefined;
  }

  axis(): Vector2 {
    const keyboardX = (this.down("arrowright") || this.down("d") ? 1 : 0) - (this.down("arrowleft") || this.down("a") ? 1 : 0);
    const keyboardY = (this.down("arrowdown") || this.down("s") ? 1 : 0) - (this.down("arrowup") || this.down("w") ? 1 : 0);
    const touchX = this.pointer.active ? clamp((this.pointer.x - this.pointer.startX) / 70, -1, 1) : 0;
    const touchY = this.pointer.active ? clamp((this.pointer.y - this.pointer.startY) / 70, -1, 1) : 0;
    return { x: clamp(keyboardX + touchX, -1, 1), y: clamp(keyboardY + touchY, -1, 1) };
  }

  consumeAction(key: string) {
    const normalized = key.toLowerCase();
    if (!this.keys.has(normalized)) return false;
    this.keys.delete(normalized);
    return true;
  }

  consumeFire() {
    if (this.consumeAction(" ")) return true;
    if (!this.pointer.fireQueued) return false;
    this.pointer.fireQueued = false;
    return true;
  }

  down(key: string) {
    return this.keys.has(key.toLowerCase());
  }

  pointerWorld(canvasWidth: number, canvasHeight: number): Vector2 {
    return { x: this.pointer.x * (canvasWidth / 960), y: this.pointer.y * (canvasHeight / 540) };
  }

  private toCanvasPoint(ev: PointerEvent) {
    if (!this.canvas) return { x: 0, y: 0 };
    const rect = this.canvas.getBoundingClientRect();
    return { x: ((ev.clientX - rect.left) / rect.width) * 960, y: ((ev.clientY - rect.top) / rect.height) * 540 };
  }

  private onKeyDown = (event: KeyboardEvent) => {
    this.keys.add(event.key.toLowerCase());
    if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(event.key.toLowerCase())) event.preventDefault();
  };

  private onKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.key.toLowerCase());
  };

  private onPointerDown = (event: PointerEvent) => {
    const point = this.toCanvasPoint(event);
    this.pointer = { active: true, fireQueued: event.pointerType === "mouse", x: point.x, y: point.y, startX: point.x, startY: point.y };
  };

  private onPointerMove = (event: PointerEvent) => {
    const point = this.toCanvasPoint(event);
    this.pointer.x = point.x;
    this.pointer.y = point.y;
  };

  private onPointerUp = () => {
    this.pointer.active = false;
    this.pointer.fireQueued = true;
  };
}
