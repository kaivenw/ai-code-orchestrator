import type { Checkpoint } from "../state/state.schema.js";
import type { PromptContext } from "./claude-prompt.js";

/**
 * Build the takeover/resume prompt for the fallback (Codex) engine. It must read
 * the prior checkpoint and continue the current step rather than restart.
 */
export function buildCodexResumePrompt(
  ctx: PromptContext,
  checkpoint?: Checkpoint,
): string {
  const { task, step, stepIndex, stepTotal } = ctx;
  const expected = step.expected_output.length
    ? step.expected_output.map((e) => `- ${e}`).join("\n")
    : "（未提供）";
  const constraints = task.constraints.length
    ? task.constraints.map((c) => `- ${c}`).join("\n")
    : "（未提供）";

  const checkpointBlock = checkpoint
    ? JSON.stringify(checkpoint, null, 2)
    : "（无可用 checkpoint，请从当前步骤开始执行）";
  const filesChanged =
    checkpoint && checkpoint.files_changed.length
      ? checkpoint.files_changed.map((f) => `- ${f}`).join("\n")
      : "（无）";
  const nextAction = checkpoint?.next_action || "继续完成当前步骤的验收要求。";

  return `你正在接管另一个 AI 编码代理未完成的任务。

【重要规则】
1. 不要重复已经完成的工作。
2. 先阅读 checkpoint，再继续 current step。
3. 优先修复 partial / failed 状态中留下的问题。
4. 继续完成当前 step 的验收要求。
5. 完成后输出新的 checkpoint JSON。

【原始任务】
ID: ${task.id}
名称: ${task.name ?? task.id}
描述: ${task.description ?? "（无）"}

【约束】
${constraints}

【当前步骤】
Step ${stepIndex + 1} / ${stepTotal}
ID: ${step.id}
标题: ${step.title}

【当前步骤验收要求】
${expected}

【上一个 checkpoint】
${checkpointBlock}

【已变更文件】
${filesChanged}

【下一步动作】
${nextAction}

请从上面的 next_action 继续执行。
最后必须输出 JSON checkpoint，使用 \`\`\`json 代码块包裹，字段与原任务一致。
`;
}
