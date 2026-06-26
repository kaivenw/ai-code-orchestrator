import { nowIso, sleep } from "../utils/time.js";
import { CheckpointSchema, type Checkpoint } from "../state/state.schema.js";
import type { EngineErrorType } from "../core/errors.js";
import type { Engine, EngineRunInput, EngineRunResult } from "./engine.interface.js";

export type MockMode =
  | "success"
  | "timeout"
  | "quota"
  | "fail"
  | "timeout_then_success";

/**
 * Deterministic engine for tests and CI. Drives the full failover machinery
 * without touching any real CLI. `timeout_then_success` fails the first attempt
 * on a step and succeeds on later attempts, exercising the fallback path.
 */
export class MockEngine implements Engine {
  readonly name = "mock" as const;
  private readonly mode: MockMode;
  /** Attempts per step id, so timeout_then_success can flip on retry. */
  private readonly attempts = new Map<string, number>();
  /** Global attempt counter across all steps. */
  private globalAttempts = 0;

  constructor(mode: MockMode = "success") {
    this.mode = mode;
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async run(input: EngineRunInput): Promise<EngineRunResult> {
    const startedAt = nowIso();
    const attempt = (this.attempts.get(input.step.id) ?? 0) + 1;
    this.attempts.set(input.step.id, attempt);
    this.globalAttempts += 1;

    // Emit a little output so heartbeat / logs are exercised.
    const banner = `[mock:${this.mode}] step=${input.step.id} attempt=${attempt}\n`;
    input.logger.appendRaw("mock", banner);
    input.onOutput?.(banner);
    await sleep(5);

    let effectiveMode: MockMode = this.mode;
    if (this.mode === "timeout_then_success") {
      // Only the very first invocation across the whole run times out; every
      // attempt after that succeeds. This triggers exactly one failover and
      // then lets the task complete (design §23.5 acceptance scenario).
      effectiveMode = this.globalAttempts === 1 ? "timeout" : "success";
    }

    if (effectiveMode === "success") {
      return this.successResult(input, startedAt);
    }

    const errorType: EngineErrorType =
      effectiveMode === "timeout"
        ? "timeout"
        : effectiveMode === "quota"
          ? "quota"
          : "crash";

    const message =
      effectiveMode === "timeout"
        ? "Operation timed out"
        : effectiveMode === "quota"
          ? "quota exceeded: usage limit reached"
          : "mock failure";
    input.logger.appendRaw("mock", message + "\n");

    const checkpoint = CheckpointSchema.parse({
      task_id: input.task.id,
      step_id: input.step.id,
      step_title: input.step.title,
      engine: this.name,
      status: "failed",
      summary: `mock 引擎以 ${effectiveMode} 模式失败`,
      next_action: input.step.expected_output[0] ?? "继续完成当前步骤",
      known_issues: [message],
      raw_output_file: input.logger.rawLogFileFor("mock"),
    });

    return {
      engine: this.name,
      success: false,
      exitCode: 1,
      stdout: banner + message,
      stderr: message,
      errorType,
      checkpoint,
      rawOutputFile: input.logger.rawLogFileFor("mock"),
      startedAt,
      endedAt: nowIso(),
    };
  }

  private successResult(input: EngineRunInput, startedAt: string): EngineRunResult {
    const checkpoint: Checkpoint = CheckpointSchema.parse({
      task_id: input.task.id,
      step_id: input.step.id,
      step_title: input.step.title,
      engine: this.name,
      status: "completed",
      summary: `mock 引擎完成步骤「${input.step.title}」`,
      files_changed: [],
      commands_run: [],
      next_action: input.isFinalStep ? "任务完成" : "进入下一步",
      test_status: "not_run",
      raw_output_file: input.logger.rawLogFileFor("mock"),
    });
    const stdout = `\`\`\`json\n${JSON.stringify(checkpoint, null, 2)}\n\`\`\`\n`;
    input.logger.appendRaw("mock", stdout);
    return {
      engine: this.name,
      success: true,
      exitCode: 0,
      stdout,
      stderr: "",
      checkpoint,
      rawOutputFile: input.logger.rawLogFileFor("mock"),
      startedAt,
      endedAt: nowIso(),
    };
  }
}
