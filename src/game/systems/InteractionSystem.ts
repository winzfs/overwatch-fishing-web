import { pointInRect } from "../core/Collision";
import type { Vector2 } from "../core/types";
import type { Building } from "../entities/Building";

export class InteractionSystem {
  findBuilding(position: Vector2, buildings: Building[]) {
    return buildings.find((building) => pointInRect(position, building.zone));
  }
}
