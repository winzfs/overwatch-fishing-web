import type { Rect, Vector2 } from "../core/types";
import { keepRectOutOfSolid } from "../core/Collision";

export class PhysicsSystem {
  resolveSolids(body: Rect, previous: Vector2, solids: Rect[]) {
    let next = { x: body.x, y: body.y };
    for (const solid of solids) {
      next = keepRectOutOfSolid({ ...body, x: next.x, y: next.y }, solid, previous);
    }
    return next;
  }
}
