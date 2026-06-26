<div align="right">

**中文 | [English](architecture.en.md)**

</div>

# 架构设计

```text
┌──────────────────────────────────────────────┐
│                  CLI 层                        │
│ init / run / status / resume / switch / doctor│
│                  / clean                      │
└───────────────────────┬──────────────────────┘
                        │
┌───────────────────────▼──────────────────────┐
│              编排核心 Core                     │
│ 任务加载 / 调度器 / 步骤执行器                 │
└──────────────┬──────────────────┬────────────┘
               │                  │
┌──────────────▼────────────┐ ┌───▼────────────────┐
│        状态存储 Store       │ │   看门狗 Watchdog    │
│ state.json / checkpoints   │ │  超时 / 无输出检测   │
└──────────────┬────────────┘ └───┬────────────────┘
               │                  │
┌──────────────▼──────────────────▼────────────┐
│              引擎管理器 Engine Manager         │
│ 主引擎 / 备用引擎 / 重试 / 失败切换             │
└──────────────┬──────────────────┬────────────┘
               │                  │
┌──────────────▼────────────┐ ┌───▼───────────────┐
│     Claude Code 引擎        │ │    Codex 引擎       │
│       子进程封装            │ │     子进程封装      │
└───────────────────────────┘ └───────────────────┘
```

## 设计原则

1. **外部编排，不侵入。** 引擎都被封装成标准 CLI 子进程（`execa`），不依赖任何私有/内部
   接口。后续可轻松接入 DeepSeek、Gemini、Qwen、Cursor CLI 等。
2. **任务标准化。** 需求必须写成带有序步骤的 `task.yaml`，而不是一大段自由文本。
3. **一切皆 checkpoint。** failover 能否成功，取决于 checkpoint 是否清楚，而非引擎多聪明。
   每步都会产出 checkpoint（从引擎 JSON 解析，解析失败则合成一个 `partial` checkpoint）。
4. **本地优先。** 不依赖 Redis / MySQL / Docker，状态全部存在 `.ai-orchestrator/` 下。

## 模块地图

| 层      | 文件 |
|---------|------|
| CLI     | `src/cli/index.ts`、`src/cli/commands/*`、`src/cli/printer.ts` |
| 核心    | `orchestrator.ts`、`scheduler.ts`、`step-runner.ts`、`failover.ts`、`result-parser.ts`、`errors.ts` |
| 引擎    | `engine.interface.ts`、`engine-manager.ts`、`claude.engine.ts`、`codex.engine.ts`、`mock.engine.ts`、`cli-runner.ts` |
| 状态    | `state-store.ts`、`checkpoint-store.ts`、`state.schema.ts`、`lock.ts` |
| 任务    | `task-loader.ts`、`task.schema.ts`、`task-normalizer.ts` |
| 提示词  | `prompt-builder.ts`、`claude-prompt.ts`、`codex-prompt.ts`、`checkpoint-prompt.ts` |
| 监控    | `watchdog.ts`、`heartbeat.ts`、`stall-detector.ts` |
| 配置    | `config-loader.ts`、`config.schema.ts`、`default-config.ts` |
| 工具    | `shell.ts`、`time.ts`、`json.ts`、`logger.ts` |
