# Resume / Takeover Prompt (fallback engine)

Used when a fallback engine (e.g. Codex) takes over a step the primary engine
could not finish. It must read the prior checkpoint and continue, not restart.

```text
你正在接管另一个 AI 编码代理未完成的任务。

【重要规则】
1. 不要重复已经完成的工作。
2. 先阅读 checkpoint，再继续 current step。
3. 优先修复 partial / failed 状态中留下的问题。
4. 继续完成当前 step 的验收要求。
5. 完成后输出新的 checkpoint JSON。

【原始任务】
{{task}}

【当前步骤】
{{step}}

【上一个 checkpoint】
{{checkpoint}}

【已变更文件】
{{checkpoint.files_changed}}

【下一步动作】
{{checkpoint.next_action}}

请从上面的 next_action 继续执行。
最后必须输出 JSON checkpoint。
```
