import type { NormalizedTask, TaskStep } from "../task/task.schema.js";
import type { Checkpoint } from "../state/state.schema.js";
import type { OrchestratorConfig } from "../config/config.schema.js";
import type { Logger } from "../utils/logger.js";
import type { EngineManager } from "../engines/engine-manager.js";
import type { FailoverController } from "./failover.js";
import { Watchdog } from "../watcher/watchdog.js";
import { printer } from "../cli/printer.js";
import type { EngineRunResult } from "../engines/engine.interface.js";

export interface StepRunnerDeps {
  task: NormalizedTask;
  config: OrchestratorConfig;
  logger: Logger;
  engines: EngineManager;
  failover: FailoverController;
  runId: string;
  primaryEngine: string;
  fallbackEngine: string | null;
  /** Called on each engine output chunk (throttled by caller if needed). */
  onHeartbeat?: () => void;
}

export interface StepOutcome {
  success: boolean;
  paused: boolean;
  engineUsed: string;
  checkpoint?: Checkpoint;
  switched: boolean;
  reason?: string;
  /** Per-engine failure counts, for state stats. */
  failCounts: Record<string, number>;
}

/**
 * Runs a single step: primary engine first, then failing over to the fallback
 * engine while the failover controller permits. A watchdog kills stalled runs.
 */
export class StepRunner {
  private readonly deps: StepRunnerDeps;

  constructor(deps: StepRunnerDeps) {
    this.deps = deps;
  }

  async run(
    step: TaskStep,
    stepIndex: number,
    stepTotal: number,
    resumeCheckpoint: Checkpoint | undefined,
  ): Promise<StepOutcome> {
    const { config, failover, fallbackEngine } = this.deps;
    const failCounts: Record<string, number> = {};

    let currentEngine = this.deps.primaryEngine;
    let isTakeover = false;
    let lastCheckpoint = resumeCheckpoint;
    let switched = false;

    // primary attempt + up to fallback attempts (bounded by failover limits)
    while (true) {
      const result = await this.runEngineOnce(
        currentEngine,
        step,
        stepIndex,
        stepTotal,
        lastCheckpoint,
        isTakeover,
      );
      if (result.checkpoint) lastCheckpoint = result.checkpoint;

      if (result.success) {
        printer.success(`Step "${step.id}" completed by ${currentEngine}`);
        return {
          success: true,
          paused: false,
          engineUsed: currentEngine,
          checkpoint: result.checkpoint,
          switched,
          failCounts,
        };
      }

      // Failed: record and decide on failover.
      failCounts[currentEngine] = (failCounts[currentEngine] ?? 0) + 1;
      this.deps.logger.error(`engine ${currentEngine} failed`, {
        engine: currentEngine,
        step_id: step.id,
      });

      const decision = failover.decide(step.id, result.errorType, !!fallbackEngine);
      if (!decision.shouldSwitch) {
        printer.error(
          `Step "${step.id}" failed on ${currentEngine}: ${result.errorType ?? "unknown"} (${decision.reason})`,
        );
        return {
          success: false,
          paused: true,
          engineUsed: currentEngine,
          checkpoint: result.checkpoint,
          switched,
          reason: decision.reason,
          failCounts,
        };
      }

      // Switch to fallback and continue the same step as a takeover.
      failover.recordSwitch(step.id);
      switched = true;
      printer.switchNotice(
        currentEngine,
        fallbackEngine!,
        result.errorType ?? "unknown",
      );
      currentEngine = fallbackEngine!;
      isTakeover = true;
    }
  }

  private async runEngineOnce(
    engineName: string,
    step: TaskStep,
    stepIndex: number,
    stepTotal: number,
    checkpoint: Checkpoint | undefined,
    isTakeover: boolean,
  ): Promise<EngineRunResult> {
    const { config, logger, engines } = this.deps;
    const engine = engines.get(engineName);
    const engineConfig = engines.configFor(engineName);

    const watchdog = new Watchdog({
      enabled: config.watchdog.enabled,
      noOutputTimeoutSeconds: config.watchdog.no_output_timeout_seconds,
      hardTimeoutSeconds: config.watchdog.hard_timeout_seconds,
      checkIntervalSeconds: config.watchdog.check_interval_seconds,
      logger,
      stepId: step.id,
    });

    printer.step(
      `Running step "${step.id}" (${stepIndex + 1}/${stepTotal}) with ${engineName}${isTakeover ? " [takeover]" : ""}`,
    );
    logger.info("engine started", { engine: engineName, step_id: step.id });

    watchdog.start();
    try {
      const result = await engine.run({
        task: this.deps.task,
        step,
        stepIndex,
        stepTotal,
        checkpoint,
        config: engineConfig,
        runId: this.deps.runId,
        isTakeover,
        isFinalStep: stepIndex === stepTotal - 1,
        logger,
        onOutput: () => {
          watchdog.beat();
          this.deps.onHeartbeat?.();
        },
        signal: watchdog.signal,
      });

      // If the watchdog aborted, normalize to a no_output/timeout failure.
      if (watchdog.stalled && result.success) {
        return { ...result, success: false, errorType: "no_output" };
      }
      if (watchdog.stalled && !result.errorType) {
        return {
          ...result,
          errorType: watchdog.stalled === "hard_timeout" ? "timeout" : "no_output",
        };
      }
      return result;
    } finally {
      watchdog.stop();
    }
  }
}
