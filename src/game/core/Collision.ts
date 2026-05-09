import type { Rect, Vector2 } from "./types";

export function intersects(a: Rect, b: Rect) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function pointInRect(point: Vector2, rect: Rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function distance(a: Vector2, b: Vector2) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function keepRectOutOfSolid(mover: Rect, solid: Rect, previous: Vector2): Vector2 {
  if (!intersects(mover, solid)) return { x: mover.x, y: mover.y };
  const fromLeft = previous.x + mover.w <= solid.x;
  const fromRight = previous.x >= solid.x + solid.w;
  const fromTop = previous.y + mover.h <= solid.y;
  const fromBottom = previous.y >= solid.y + solid.h;
  if (fromLeft) return { x: solid.x - mover.w, y: mover.y };
  if (fromRight) return { x: solid.x + solid.w, y: mover.y };
  if (fromTop) return { x: mover.x, y: solid.y - mover.h };
  if (fromBottom) return { x: mover.x, y: solid.y + solid.h };
  return previous;
}
