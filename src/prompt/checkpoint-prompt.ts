import type { NormalizedTask } from "../task/task.schema.js";

/**
 * Final summary prompt appended on the last step, asking the engine for an
 * overall wrap-up (per design §14.3).
 */
export function buildCheckpointPrompt(task: NormalizedTask): string {
  const commands = task.acceptance.commands.length
    ? task.acceptance.commands.map((c) => `- ${c}`).join("\n")
    : "（未指定）";
  return `这是任务「${task.name ?? task.id}」的最后一步，请额外输出一份最终总结，覆盖：
1. 完成了哪些内容
2. 修改了哪些文件
3. 执行了哪些命令
4. 测试是否通过
5. 是否存在风险
6. 下一步建议

【验收命令】
${commands}

随后仍需输出标准 checkpoint JSON。`;
}
