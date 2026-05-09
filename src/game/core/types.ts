import type { AssetManager } from "../assets/AssetManager";
import type { Camera } from "./Camera";
import type { InputManager } from "./InputManager";
import type { SceneManager } from "./SceneManager";
import type { TimeSystem } from "../systems/TimeSystem";
import type { WeatherSystem } from "../systems/WeatherSystem";
import type { SaveSystem } from "../systems/SaveSystem";

export type Vector2 = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };
export type SceneId = "harbor" | "ocean" | "dive";

export type GameContext = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  assets: AssetManager;
  input: InputManager;
  camera: Camera;
  scenes: SceneManager;
  time: TimeSystem;
  weather: WeatherSystem;
  save: SaveSystem;
  setToast: (message: string) => void;
};

export interface GameScene {
  id: SceneId;
  enter?(ctx: GameContext, payload?: unknown): void;
  exit?(ctx: GameContext): void;
  update(ctx: GameContext, dt: number): void;
  render(ctx: GameContext): void;
}
