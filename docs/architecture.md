# Architecture

```text
┌──────────────────────────────────────────────┐
│                  CLI Layer                    │
│ init / run / status / resume / switch / doctor│
│                  / clean                      │
└───────────────────────┬──────────────────────┘
                        │
┌───────────────────────▼──────────────────────┐
│              Orchestrator Core                │
│ Task Loader / Scheduler / Step Runner         │
└──────────────┬──────────────────┬────────────┘
               │                  │
┌──────────────▼────────────┐ ┌───▼────────────────┐
│        State Store         │ │      Watchdog       │
│ state.json / checkpoints   │ │ timeout / no output │
└──────────────┬────────────┘ └───┬────────────────┘
               │                  │
┌──────────────▼──────────────────▼────────────┐
│                Engine Manager                 │
│ primary / fallback / retry / failover          │
└──────────────┬──────────────────┬────────────┘
               │                  │
┌──────────────▼────────────┐ ┌───▼───────────────┐
│     Claude Code Engine     │ │    Codex Engine    │
│     subprocess wrapper     │ │ subprocess wrapper │
└───────────────────────────┘ └───────────────────┘
```

## Design principles

1. **External orchestration, no intrusion.** Engines are wrapped as standard CLI
   subprocesses (`execa`). No private/internal APIs. Easy to add DeepSeek,
   Gemini, Qwen, Cursor CLI, etc.
2. **Standardized tasks.** Requirements must be expressed as a `task.yaml` with
   ordered steps, not a single free-form blob.
3. **Checkpoint everything.** Successful failover depends on checkpoint quality,
   not engine cleverness. Each step emits a checkpoint (parsed from the engine's
   JSON, or synthesized as a `partial` checkpoint on parse failure).
4. **Local-first.** No Redis / MySQL / Docker. State lives under
   `.ai-orchestrator/`.

## Module map

| Layer    | Files |
|----------|-------|
| CLI      | `src/cli/index.ts`, `src/cli/commands/*`, `src/cli/printer.ts` |
| Core     | `orchestrator.ts`, `scheduler.ts`, `step-runner.ts`, `failover.ts`, `result-parser.ts`, `errors.ts` |
| Engines  | `engine.interface.ts`, `engine-manager.ts`, `claude.engine.ts`, `codex.engine.ts`, `mock.engine.ts`, `cli-runner.ts` |
| State    | `state-store.ts`, `checkpoint-store.ts`, `state.schema.ts`, `lock.ts` |
| Task     | `task-loader.ts`, `task.schema.ts`, `task-normalizer.ts` |
| Prompt   | `prompt-builder.ts`, `claude-prompt.ts`, `codex-prompt.ts`, `checkpoint-prompt.ts` |
| Watcher  | `watchdog.ts`, `heartbeat.ts`, `stall-detector.ts` |
| Config   | `config-loader.ts`, `config.schema.ts`, `default-config.ts` |
| Utils    | `shell.ts`, `time.ts`, `json.ts`, `logger.ts` |
```
