import type { GameContext, GameScene, SceneId } from "./types";

export class SceneManager {
  private scenes = new Map<SceneId, GameScene>();
  private active?: GameScene;
  private pending?: { id: SceneId; payload?: unknown };

  register(scene: GameScene) {
    this.scenes.set(scene.id, scene);
  }

  change(id: SceneId, payload?: unknown) {
    this.pending = { id, payload };
  }

  update(ctx: GameContext, dt: number) {
    if (this.pending) {
      this.active?.exit?.(ctx);
      const next = this.scenes.get(this.pending.id);
      if (!next) throw new Error(`Scene not registered: ${this.pending.id}`);
      this.active = next;
      const payload = this.pending.payload;
      this.pending = undefined;
      this.active.enter?.(ctx, payload);
    }
    this.active?.update(ctx, dt);
  }

  render(ctx: GameContext) {
    this.active?.render(ctx);
  }

  get activeId() {
    return this.active?.id;
  }
}
