<div align="right">

**中文 | [English](engine-adapter.en.md)**

</div>

# 引擎适配器

引擎是任何实现了 `Engine` 接口的模块。编排器把引擎当成黑盒：输入一个 step + checkpoint，
返回一个结果。

```ts
export type EngineName = "claude" | "codex" | "mock";

export interface Engine {
  name: EngineName;
  isAvailable(): Promise<boolean>;
  run(input: EngineRunInput): Promise<EngineRunResult>;
}
```

## 内置引擎

- **claude**（`claude.engine.ts`）—— 封装 `claude` CLI。默认调用 `claude --print
  "<prompt>"`。命令和参数都由配置驱动。
- **codex**（`codex.engine.ts`）—— 封装 `codex` CLI。默认 `codex exec "<prompt>"`。
  认证、模型、环境变量交给你的 Codex 官方配置。
- **mock**（`mock.engine.ts`）—— 用于测试和 CI 的确定性引擎。模式：`success`、`timeout`、
  `quota`、`fail`、`timeout_then_success`。

Claude 与 Codex 共用 `cli-runner.ts`，它负责：

1. 构建提示词（`prompt-builder.ts`）。
2. 用 `execa` 启动 CLI（流式输出、硬超时、可中断）。
3. 把输出流式写入日志和看门狗心跳。
4. 分类失败（`errors.ts`），并从 stdout 解析 checkpoint（`result-parser.ts`），解析失败时
   合成一个 `partial` checkpoint。

## 新增一个引擎

1. 实现 `Engine` 接口（通常是对 `runCliEngine` 的 20 行封装）。
2. 在 `engine-manager.ts` 的 `create()` switch 里注册。
3. 在 `config.yaml` 的 `engines.<name>` 下加一段配置。

```ts
// 例如 src/engines/gemini.engine.ts
export class GeminiEngine implements Engine {
  readonly name = "gemini";
  isAvailable() { return commandAvailable("gemini"); }
  run(input) { return runCliEngine("gemini", input); }
}
```

未来候选：`deepseek`、`gemini`、`qwen`、`cursor`、`trae`。
