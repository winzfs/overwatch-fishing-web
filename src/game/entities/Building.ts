import type { HarborBuildingDefinition } from "../data/npcs";

export class Building {
  readonly id = this.definition.id;
  readonly name = this.definition.name;
  readonly assetId = this.definition.assetId;
  readonly body = this.definition.body;
  readonly zone = this.definition.zone;
  readonly prompt = this.definition.prompt;

  constructor(private definition: HarborBuildingDefinition) {}
}
