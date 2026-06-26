import { Heartbeat } from "./heartbeat.js";
import { detectStall, type StallReason, type StallThresholds } from "./stall-detector.js";
import type { Logger } from "../utils/logger.js";

export interface WatchdogOptions extends StallThresholds {
  enabled: boolean;
  checkIntervalSeconds: number;
  logger?: Logger;
  stepId?: string;
}

/**
 * Polls a heartbeat on an interval; when the run stalls (no output) or exceeds
 * the hard timeout, it aborts the supplied AbortController so the engine's
 * subprocess is killed and failover can take over.
 */
export class Watchdog {
  private readonly opts: WatchdogOptions;
  readonly heartbeat = new Heartbeat();
  private readonly controller = new AbortController();
  private timer: NodeJS.Timeout | null = null;
  private stalledReason: StallReason = null;

  constructor(opts: WatchdogOptions) {
    this.opts = opts;
  }

  get signal(): AbortSignal {
    return this.controller.signal;
  }

  get stalled(): StallReason {
    return this.stalledReason;
  }

  /** Feed the watchdog with a sign of life. */
  beat(): void {
    this.heartbeat.beat();
  }

  start(): void {
    if (!this.opts.enabled) return;
    this.heartbeat.reset();
    const intervalMs = Math.max(500, this.opts.checkIntervalSeconds * 1000);
    this.timer = setInterval(() => this.tick(), intervalMs);
    // Don't keep the event loop alive solely for the watchdog.
    this.timer.unref?.();
  }

  private tick(): void {
    const reason = detectStall(this.heartbeat, {
      noOutputTimeoutSeconds: this.opts.noOutputTimeoutSeconds,
      hardTimeoutSeconds: this.opts.hardTimeoutSeconds,
    });
    if (reason) {
      this.stalledReason = reason;
      this.opts.logger?.warn(`watchdog: ${reason}, aborting engine`, {
        step_id: this.opts.stepId,
      });
      this.stop();
      this.controller.abort(reason);
    }
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
