import { nowMs } from "../utils/time.js";

/** Tracks the last time the engine produced output. */
export class Heartbeat {
  private lastBeat: number;
  private started: number;

  constructor() {
    const now = nowMs();
    this.lastBeat = now;
    this.started = now;
  }

  /** Record a sign of life (called on every output chunk). */
  beat(): void {
    this.lastBeat = nowMs();
  }

  /** Milliseconds since last output. */
  msSinceLastBeat(now = nowMs()): number {
    return now - this.lastBeat;
  }

  /** Milliseconds since the run started. */
  msSinceStart(now = nowMs()): number {
    return now - this.started;
  }

  reset(): void {
    const now = nowMs();
    this.lastBeat = now;
    this.started = now;
  }
}
