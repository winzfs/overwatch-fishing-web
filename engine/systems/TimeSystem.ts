import { getGameTime, PERIOD_META, type TimePeriod, type GameTimeInfo } from "../../lib/time/gameTime";

export type { TimePeriod, GameTimeInfo };

export class TimeSystem {
  private startMs: number;
  private _current: GameTimeInfo;

  constructor(startMs = Date.now()) {
    this.startMs = startMs;
    this._current = getGameTime(this.startMs, Date.now());
  }

  tick(nowMs = Date.now()): { info: GameTimeInfo; periodChanged: boolean } {
    const prev = this._current.period;
    this._current = getGameTime(this.startMs, nowMs);
    return { info: this._current, periodChanged: this._current.period !== prev };
  }

  get current(): GameTimeInfo { return this._current; }
  get skyColor(): number { return PERIOD_META[this._current.period].skyColor; }
  get overlayAlpha(): number { return PERIOD_META[this._current.period].overlayAlpha; }
}
