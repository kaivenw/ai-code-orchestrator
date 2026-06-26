import { commandAvailable } from "../utils/shell.js";
import { runCliEngine } from "./cli-runner.js";
import type { Engine, EngineRunInput, EngineRunResult } from "./engine.interface.js";

/**
 * Claude Code engine adapter. Wraps the `claude` CLI as a subprocess. Command
 * and args are config-driven (default: `claude --print`).
 */
export class ClaudeEngine implements Engine {
  readonly name = "claude" as const;
  private readonly command: string;

  constructor(command = "claude") {
    this.command = command;
  }

  async isAvailable(): Promise<boolean> {
    return commandAvailable(this.command, ["--version"]);
  }

  run(input: EngineRunInput): Promise<EngineRunResult> {
    return runCliEngine("claude", input);
  }
}
