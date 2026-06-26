import type { NormalizedTask, TaskStep } from "../task/task.schema.js";

export interface PromptContext {
  task: NormalizedTask;
  step: TaskStep;
  stepIndex: number;
  stepTotal: number;
}

function checkpointTemplate(taskId: string, stepId: string): string {
  return `{
  "task_id": "${taskId}",
  "step_id": "${stepId}",
  "status": "completed | partial | failed",
  "summary": "本步骤完成了什么",
  "files_changed": [],
  "commands_run": [],
  "next_action": "下一步应该做什么",
  "known_issues": [],
  "test_status": "not_run | passed | failed",
  "need_human_confirm": false
}`;
}

/** Build the executor prompt for the primary (Claude) engine. */
export function buildClaudePrompt(ctx: PromptContext): string {
  const { task, step, stepIndex, stepTotal } = ctx;
  const goals = task.goals.length ? task.goals.map((g) => `- ${g}`).join("\n") : "（未提供）";
  const constraints = task.constraints.length
    ? task.constraints.map((c) => `- ${c}`).join("\n")
    : "（未提供）";
  const expected = step.expected_output.length
    ? step.expected_output.map((e) => `- ${e}`).join("\n")
    : "（未提供）";
  const contextText = task.description ?? task.name ?? task.id;

  return `你是一个严谨的软件工程执行代理，正在执行一个标准化开发任务。

【任务目标】
${goals}

【项目背景】
${contextText}

【当前步骤】
Step ${stepIndex + 1} / ${stepTotal}
ID: ${step.id}
标题: ${step.title}

【当前步骤验收要求】
${expected}

【约束】
${constraints}

【执行要求】
1. 只完成当前步骤，不要擅自扩展无关功能。
2. 修改代码前先分析现有结构。
3. 优先复用项目已有风格和工具类。
4. 不要删除无关文件。
5. 不要修改敏感配置，例如数据库密码、密钥、部署配置。
6. 如果需要执行命令，请优先选择安全命令。
7. 当前步骤完成后，必须输出 checkpoint JSON。
8. 如果无法完成，也必须输出 partial checkpoint JSON。

【必须输出格式】
请在最后输出以下 JSON，使用 Markdown 代码块包裹，代码块语言为 json：

\`\`\`json
${checkpointTemplate(task.id, step.id)}
\`\`\`
`;
}
