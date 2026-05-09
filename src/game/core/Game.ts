import { AssetManager } from "../assets/AssetManager";
import { Camera } from "./Camera";
import { InputManager } from "./InputManager";
import { SceneManager } from "./SceneManager";
import { GameLoop } from "./GameLoop";
import type { GameContext } from "./types";
import { TimeSystem } from "../systems/TimeSystem";
import { WeatherSystem } from "../systems/WeatherSystem";
import { SaveSystem } from "../systems/SaveSystem";
import { RenderSystem } from "../systems/RenderSystem";
import { HarborScene } from "../scenes/HarborScene";
import { OceanScene } from "../scenes/OceanScene";
import { DiveScene } from "../scenes/DiveScene";

const WIDTH = 960;
const HEIGHT = 540;

export type GameCallbacks = {
  onReady?: () => void;
  onToast?: (message: string) => void;
  onState?: (state: { mode?: string; gold: number; cargo: number; collection: number; metaDepth: number }) => void;
};

export class Game {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly assets = new AssetManager();
  private readonly input = new InputManager();
  private readonly camera = new Camera();
  private readonly scenes = new SceneManager();
  private readonly loop = new GameLoop();
  private readonly time = new TimeSystem();
  private readonly weather = new WeatherSystem();
  private readonly save = new SaveSystem();
  private readonly renderer = new RenderSystem();
  private toast = "항구 데이터를 불러오는 중...";
  private context: GameContext;

  constructor(private canvas: HTMLCanvasElement, private callbacks: GameCallbacks = {}) {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D context is not available");
    this.ctx = context;
    this.context = {
      canvas,
      ctx: this.ctx,
      width: WIDTH,
      height: HEIGHT,
      assets: this.assets,
      input: this.input,
      camera: this.camera,
      scenes: this.scenes,
      time: this.time,
      weather: this.weather,
      save: this.save,
      setToast: (message) => {
        this.toast = message;
        this.callbacks.onToast?.(message);
      },
    };
  }

  async start() {
    this.resize();
    window.addEventListener("resize", this.resize);
    this.input.attach(this.canvas);
    this.save.load();
    this.time.hydrate(this.save.data.day, this.save.data.clock);
    this.weather.hydrate(this.save.data.weather);
    this.scenes.register(new HarborScene());
    this.scenes.register(new OceanScene());
    this.scenes.register(new DiveScene());
    this.scenes.change("harbor");
    await this.assets.preload();
    this.callbacks.onReady?.();
    this.loop.start((dt) => this.tick(dt));
  }

  stop() {
    this.loop.stop();
    this.input.detach();
    window.removeEventListener("resize", this.resize);
    this.save.persist();
  }

  private tick(dt: number) {
    this.renderer.clear(this.context);
    this.scenes.update(this.context, dt);
    this.scenes.render(this.context);
    this.callbacks.onState?.({
      mode: this.scenes.activeId,
      gold: this.save.data.gold,
      cargo: this.save.data.cargo.length,
      collection: Object.keys(this.save.data.collection).length,
      metaDepth: this.save.data.metaDepth,
    });
  }

  private resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
}
