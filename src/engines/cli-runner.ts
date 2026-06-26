import { execa, type ExecaError } from "execa";
import { nowIso } from "../utils/time.js";
import { classifyError, type EngineErrorType } from "../core/errors.js";
import { parseCheckpointFromOutput, buildPartialCheckpoint } from "../core/result-parser.js";
import { CheckpointSchema, type Checkpoint } from "../state/state.schema.js";
import { buildPrompt } from "../prompt/prompt-builder.js";
import type { EngineRunInput, EngineRunResult, EngineName } from "./engine.interface.js";

/**
 * Shared subprocess execution for CLI-backed engines (Claude / Codex). Reads
 * command + args from config, streams output to the logger/heartbeat, and
 * normalizes the result into an EngineRunResult with a parsed checkpoint.
 */
export async function runCliEngine(
  name: EngineName,
  input: EngineRunInput,
): Promise<EngineRunResult> {
  const startedAt = nowIso();
  const prompt = buildPrompt({
    engine: name,
    ctx: {
      task: input.task,
      step: input.step,
      stepIndex: input.stepIndex,
      stepTotal: input.stepTotal,
    },
    checkpoint: input.checkpoint,
    isTakeover: input.isTakeover,
    isFinalStep: input.isFinalStep,
  });

  const command = input.config.command ?? name;
  const args = [...(input.config.args ?? []), prompt];
  const rawFile = input.logger.rawLogFileFor(name);

  let stdout = "";
  let stderr = "";

  const child = execa(command, args, {
    cwd: input.task.project.root,
    all: true,
    timeout: input.config.timeout_seconds * 1000,
    reject: false,
    cancelSignal: input.signal,
  });

  child.all?.on("data", (chunk: Buffer) => {
    const text = chunk.toString();
    stdout += text;
    input.logger.appendRaw(name, text);
    input.onOutput?.(text);
  });

  let exitCode: number | null = null;
  let errorType: EngineErrorType | undefined;

  try {
    const result = await child;
    exitCode = result.exitCode ?? 0;
    stderr = result.stderr ?? "";
    if (result.failed) {
      errorType = mapExecaError(result as unknown as ExecaError, stdout + stderr);
    }
  } catch (error) {
    const e = error as ExecaError;
    exitCode = (e.exitCode as number | undefined) ?? null;
    stderr = e.stderr ? String(e.stderr) : String(e.message ?? error);
    errorType = mapExecaError(e, stdout + stderr);
  }

  const detected = classifyError(stdout + "\n" + stderr);
  if (!errorType && detected) errorType = detected;

  const endedAt = nowIso();
  const success = exitCode === 0 && !errorType;

  let checkpoint = parseCheckpointFromOutput(stdout) ?? undefined;
  if (checkpoint) {
    checkpoint = CheckpointSchema.parse({
      ...checkpoint,
      task_id: checkpoint.task_id || input.task.id,
      step_id: checkpoint.step_id || input.step.id,
      step_title: checkpoint.step_title || input.step.title,
      engine: checkpoint.engine || name,
      raw_output_file: checkpoint.raw_output_file || rawFile,
    });
  } else if (!success) {
    // Never lose context: synthesize a partial checkpoint from raw output.
    checkpoint = buildPartialCheckpoint({
      taskId: input.task.id,
      stepId: input.step.id,
      stepTitle: input.step.title,
      engine: name,
      status: "failed",
      rawOutputFile: rawFile,
      knownIssues: errorType ? [`engine error: ${errorType}`] : undefined,
    });
  }

  return {
    engine: name,
    success,
    exitCode,
    stdout,
    stderr,
    errorType,
    checkpoint: checkpoint as Checkpoint | undefined,
    rawOutputFile: rawFile,
    startedAt,
    endedAt,
  };
}

function mapExecaError(error: ExecaError, output: string): EngineErrorType {
  if (error.timedOut) return "timeout";
  const detected = classifyError(output);
  if (detected) return detected;
  if (error.isCanceled) return "no_output";
  return "crash";
}
