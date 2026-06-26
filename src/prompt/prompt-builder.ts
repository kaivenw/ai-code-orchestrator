import type { EngineName } from "../engines/engine.interface.js";
import type { Checkpoint } from "../state/state.schema.js";
import { buildClaudePrompt, type PromptContext } from "./claude-prompt.js";
import { buildCodexResumePrompt } from "./codex-prompt.js";
import { buildCheckpointPrompt } from "./checkpoint-prompt.js";

export interface BuildPromptInput {
  engine: EngineName;
  ctx: PromptContext;
  checkpoint?: Checkpoint;
  /** Whether this engine is taking over a step a prior engine failed on. */
  isTakeover: boolean;
  /** Whether this is the final step (append final-summary instructions). */
  isFinalStep: boolean;
}

/**
 * Pick the right prompt for the engine/situation. Fallback engines and any
 * takeover use the resume prompt; otherwise the executor prompt is used.
 */
export function buildPrompt(input: BuildPromptInput): string {
  const { ctx, checkpoint, isTakeover, isFinalStep } = input;
  let base: string;
  if (isTakeover || input.engine === "codex") {
    base = buildCodexResumePrompt(ctx, checkpoint);
  } else {
    base = buildClaudePrompt(ctx);
  }
  if (isFinalStep) {
    base += "\n\n" + buildCheckpointPrompt(ctx.task);
  }
  return base;
}
