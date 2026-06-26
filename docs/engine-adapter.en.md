<div align="right">

**[中文](engine-adapter.md) | English**

</div>

# Engine Adapters

An engine is any module that implements the `Engine` interface. The orchestrator
treats engines as black boxes that take a step + checkpoint and return a result.

```ts
export type EngineName = "claude" | "codex" | "mock";

export interface Engine {
  name: EngineName;
  isAvailable(): Promise<boolean>;
  run(input: EngineRunInput): Promise<EngineRunResult>;
}
```

## Built-in engines

- **claude** (`claude.engine.ts`) — wraps the `claude` CLI. Default invocation
  `claude --print "<prompt>"`. Command and args are config-driven.
- **codex** (`codex.engine.ts`) — wraps the `codex` CLI. Default `codex exec
  "<prompt>"`. Auth/model/env are left to your official Codex configuration.
- **mock** (`mock.engine.ts`) — deterministic engine for tests and CI. Modes:
  `success`, `timeout`, `quota`, `fail`, `timeout_then_success`.

Claude and Codex share `cli-runner.ts`, which:

1. Builds the prompt (`prompt-builder.ts`).
2. Spawns the CLI with `execa` (streaming output, hard timeout, abortable).
3. Streams output to the logger and the watchdog heartbeat.
4. Classifies failures (`errors.ts`) and parses a checkpoint from stdout
   (`result-parser.ts`), synthesizing a `partial` checkpoint on parse failure.

## Adding a new engine

1. Implement the `Engine` interface (often a 20-line wrapper around
   `runCliEngine`).
2. Register it in `engine-manager.ts`'s `create()` switch.
3. Add a config block under `engines.<name>` in `config.yaml`.

```ts
// e.g. src/engines/gemini.engine.ts
export class GeminiEngine implements Engine {
  readonly name = "gemini";
  isAvailable() { return commandAvailable("gemini"); }
  run(input) { return runCliEngine("gemini", input); }
}
```

Future candidates: `deepseek`, `gemini`, `qwen`, `cursor`, `trae`.
