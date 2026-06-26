import { CheckpointSchema, type Checkpoint } from "../state/state.schema.js";
import { extractMarkdownJsonBlocks, findLastJsonObject, tryParseJson } from "../utils/json.js";

/**
 * Try to recover a Checkpoint from raw engine output.
 *
 * Strategy (per design §15):
 *   1. Prefer the LAST ```json fenced block.
 *   2. Fall back to the last balanced { ... } object in the text.
 *   3. Return null if nothing parses — caller builds a partial checkpoint.
 */
export function parseCheckpointFromOutput(output: string): Checkpoint | null {
  if (!output) return null;

  const blocks = extractMarkdownJsonBlocks(output);
  for (const block of [...blocks].reverse()) {
    const obj = tryParseJson(block);
    if (obj) {
      const result = CheckpointSchema.safeParse(obj);
      if (result.success) return result.data;
    }
  }

  const objectText = findLastJsonObject(output);
  if (objectText) {
    const obj = tryParseJson(objectText);
    if (obj) {
      const result = CheckpointSchema.safeParse(obj);
      if (result.success) return result.data;
    }
  }

  return null;
}

export interface PartialCheckpointInput {
  taskId: string;
  stepId: string;
  stepTitle?: string;
  engine: string;
  status?: Checkpoint["status"];
  summary?: string;
  nextAction?: string;
  rawOutputFile?: string;
  knownIssues?: string[];
}

/**
 * Build a best-effort checkpoint when the engine output could not be parsed,
 * so we never lose task context on a parse failure.
 */
export function buildPartialCheckpoint(input: PartialCheckpointInput): Checkpoint {
  return CheckpointSchema.parse({
    task_id: input.taskId,
    step_id: input.stepId,
    step_title: input.stepTitle ?? "",
    engine: input.engine,
    status: input.status ?? "partial",
    summary:
      input.summary ??
      "无法从引擎输出中解析出结构化 checkpoint，已保存原始输出。",
    next_action: input.nextAction ?? "请检查原始日志并人工确认进度。",
    known_issues: input.knownIssues ?? ["checkpoint JSON 解析失败"],
    raw_output_file: input.rawOutputFile ?? "",
  });
}
