import type { Heartbeat } from "./heartbeat.js";

export type StallReason = "no_output" | "hard_timeout" | null;

export interface StallThresholds {
  noOutputTimeoutSeconds: number;
  hardTimeoutSeconds: number;
}

/**
 * Pure decision function: given a heartbeat and thresholds, return why (if at
 * all) the current run should be considered stalled.
 */
export function detectStall(
  heartbeat: Heartbeat,
  thresholds: StallThresholds,
  now = Date.now(),
): StallReason {
  if (heartbeat.msSinceStart(now) >= thresholds.hardTimeoutSeconds * 1000) {
    return "hard_timeout";
  }
  if (heartbeat.msSinceLastBeat(now) >= thresholds.noOutputTimeoutSeconds * 1000) {
    return "no_output";
  }
  return null;
}
