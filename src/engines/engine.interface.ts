import type { NormalizedTask, TaskStep } from "../task/task.schema.js";
import type { Checkpoint } from "../state/state.schema.js";
import type { EngineConfig } from "../config/config.schema.js";
import type { EngineErrorType } from "../core/errors.js";
import type { Logger } from "../utils/logger.js";

export type EngineName = "claude" | "codex" | "mock";

export interface EngineRunInput {
  task: NormalizedTask;
  step: TaskStep;
  stepIndex: number;
  stepTotal: number;
  checkpoint?: Checkpoint;
  config: EngineConfig;
  runId: string;
  /** Whether this engine is taking over a step a prior engine failed on. */
  isTakeover: boolean;
  isFinalStep: boolean;
  logger: Logger;
  /** Called whenever the engine emits output, to feed the watchdog/heartbeat. */
  onOutput?: (text: string) => void;
  /** Aborted by the watchdog on stall / hard timeout to kill the subprocess. */
  signal?: AbortSignal;
}

export interface EngineRunResult {
  engine: EngineName;
  success: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  errorType?: EngineErrorType;
  checkpoint?: Checkpoint;
  rawOutputFile?: string;
  startedAt: string;
  endedAt: string;
}

export interface Engine {
  name: EngineName;
  isAvailable(): Promise<boolean>;
  run(input: EngineRunInput): Promise<EngineRunResult>;
}
