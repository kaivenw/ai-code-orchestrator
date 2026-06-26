/** Public library entry point — re-exports the orchestrator's building blocks. */
export { Orchestrator } from "./core/orchestrator.js";
export type { RunOptions, RunSummary } from "./core/orchestrator.js";
export { Scheduler } from "./core/scheduler.js";
export { StepRunner } from "./core/step-runner.js";
export { FailoverController } from "./core/failover.js";
export { classifyError, isFailoverableError, ERROR_PATTERNS } from "./core/errors.js";
export type { EngineErrorType } from "./core/errors.js";
export {
  parseCheckpointFromOutput,
  buildPartialCheckpoint,
} from "./core/result-parser.js";

export { EngineManager } from "./engines/engine-manager.js";
export { ClaudeEngine } from "./engines/claude.engine.js";
export { CodexEngine } from "./engines/codex.engine.js";
export { MockEngine } from "./engines/mock.engine.js";
export type {
  Engine,
  EngineName,
  EngineRunInput,
  EngineRunResult,
} from "./engines/engine.interface.js";

export { loadConfig, getEngineConfig } from "./config/config-loader.js";
export { ConfigSchema } from "./config/config.schema.js";
export type { OrchestratorConfig, EngineConfig } from "./config/config.schema.js";
export { DEFAULT_CONFIG } from "./config/default-config.js";

export { loadTask, parseTask } from "./task/task-loader.js";
export { TaskSchema } from "./task/task.schema.js";
export type { Task, NormalizedTask, TaskStep } from "./task/task.schema.js";

export { StateStore } from "./state/state-store.js";
export { CheckpointStore } from "./state/checkpoint-store.js";
export { StateSchema, CheckpointSchema } from "./state/state.schema.js";
export type { State, Checkpoint } from "./state/state.schema.js";

export { Watchdog } from "./watcher/watchdog.js";
export { Heartbeat } from "./watcher/heartbeat.js";
export { detectStall } from "./watcher/stall-detector.js";
