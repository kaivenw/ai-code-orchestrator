import { isFailoverableError, type EngineErrorType } from "./errors.js";

export interface FailoverLimits {
  enabled: boolean;
  maxSwitchPerStep: number;
  maxTotalSwitch: number;
}

export interface FailoverDecision {
  shouldSwitch: boolean;
  reason: string;
}

/**
 * Tracks engine-switch counts and decides whether a failed engine result should
 * trigger a switch to the fallback engine. Prevents infinite switching within a
 * single step and across the whole run (design §13.2).
 */
export class FailoverController {
  private readonly limits: FailoverLimits;
  private totalSwitches = 0;
  private perStep = new Map<string, number>();

  constructor(limits: FailoverLimits) {
    this.limits = limits;
  }

  get totalSwitchCount(): number {
    return this.totalSwitches;
  }

  switchesForStep(stepId: string): number {
    return this.perStep.get(stepId) ?? 0;
  }

  /** Decide whether to fail over for a given step + error type. */
  decide(
    stepId: string,
    errorType: EngineErrorType | undefined,
    hasFallback: boolean,
  ): FailoverDecision {
    if (!this.limits.enabled) {
      return { shouldSwitch: false, reason: "failover disabled" };
    }
    if (!hasFallback) {
      return { shouldSwitch: false, reason: "no fallback engine configured" };
    }
    if (!isFailoverableError(errorType)) {
      return {
        shouldSwitch: false,
        reason: `error type "${errorType ?? "unknown"}" is not failoverable`,
      };
    }
    if (this.switchesForStep(stepId) >= this.limits.maxSwitchPerStep) {
      return {
        shouldSwitch: false,
        reason: `too many failovers in step "${stepId}"`,
      };
    }
    if (this.totalSwitches >= this.limits.maxTotalSwitch) {
      return { shouldSwitch: false, reason: "reached max total switches" };
    }
    return { shouldSwitch: true, reason: `failover on ${errorType}` };
  }

  /** Record that a switch happened for the given step. */
  recordSwitch(stepId: string): void {
    this.totalSwitches += 1;
    this.perStep.set(stepId, this.switchesForStep(stepId) + 1);
  }
}
