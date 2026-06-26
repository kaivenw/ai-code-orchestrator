<div align="right">

**[中文](checkpoint.md) | English**

</div>

# Checkpoints & State

## State (`.ai-orchestrator/state.json`)

A single, overwritten snapshot of the current run:

```json
{
  "version": "1.0",
  "task_id": "build-login-api",
  "status": "running",
  "current_engine": "claude",
  "fallback_engine": "codex",
  "current_step_index": 2,
  "current_step_id": "service",
  "completed_steps": ["analyze", "dto"],
  "failed_steps": [],
  "last_update_at": "2026-06-26T12:00:00.000Z",
  "last_output_at": "2026-06-26T12:00:15.000Z",
  "last_checkpoint_file": ".ai-orchestrator/checkpoints/build-login-api-service.json",
  "run_id": "run_20260626_120000",
  "stats": { "engine_switch_count": 1, "claude_fail_count": 1, "codex_fail_count": 0 }
}
```

Status values: `idle`, `running`, `completed`, `paused`, `failed`.

## Checkpoint (`.ai-orchestrator/checkpoints/<task>-<step>.json`)

One file per step, the unit of resume/failover context:

```json
{
  "task_id": "build-login-api",
  "step_id": "service",
  "step_title": "实现登录 Service",
  "engine": "claude",
  "status": "partial",
  "summary": "已创建 AuthService，并完成部分账号密码校验逻辑。",
  "files_changed": ["src/main/java/com/example/auth/AuthService.java"],
  "commands_run": ["grep -R \"JwtUtil\" src/main/java"],
  "next_action": "继续补充 token 生成逻辑，并增加异常处理。",
  "known_issues": ["尚未确认项目是否已有 JwtUtil"],
  "test_status": "not_run",
  "raw_output_file": ".ai-orchestrator/logs/run_20260626_120000.claude.log",
  "created_at": "2026-06-26T12:05:00.000Z"
}
```

Status values: `completed`, `partial`, `failed`.

## Parsing strategy

Engine output is messy, so the parser is tolerant (`result-parser.ts`):

1. Prefer the **last** ```json fenced block.
2. Otherwise, the last balanced `{ ... }` object in the text.
3. If nothing parses, build a **partial** checkpoint that records the raw output
   file — context is never lost on a parse failure.

## Failover & limits

When a step fails with a failoverable error (`timeout`, `quota`, `rate_limit`,
`no_output`, `crash`, `auth`), the fallback engine takes over the **same step**
using the latest checkpoint. Switching is bounded by
`failover.max_switch_per_step` and `failover.max_total_switch`; exceeding either
pauses the task instead of looping forever.
