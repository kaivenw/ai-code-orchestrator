import { commandAvailable } from "../utils/shell.js";
import { runCliEngine } from "./cli-runner.js";
import type { Engine, EngineRunInput, EngineRunResult } from "./engine.interface.js";

/**
 * Codex engine adapter. Wraps the `codex` CLI as a subprocess. Command and args
 * are config-driven (default: `codex exec`). Auth/model/env are left to the
 * user's official Codex configuration.
 */
export class CodexEngine implements Engine {
  readonly name = "codex" as const;
  private readonly command: string;

  constructor(command = "codex") {
    this.command = command;
  }

  async isAvailable(): Promise<boolean> {
    return commandAvailable(this.command, ["--version"]);
  }

  run(input: EngineRunInput): Promise<EngineRunResult> {
    return runCliEngine("codex", input);
  }
}
