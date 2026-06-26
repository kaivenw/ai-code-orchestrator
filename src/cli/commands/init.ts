import fs from "fs-extra";
import path from "node:path";
import { ORCH_DIR } from "../../config/config-loader.js";
import { DEFAULT_CONFIG_YAML } from "../../config/default-config.js";
import { DEFAULT_TASK_YAML } from "../../task/default-task.js";
import { emptyState } from "../../state/state.schema.js";
import { printer } from "../printer.js";

export interface InitOptions {
  force?: boolean;
  cwd?: string;
}

/** Scaffold .ai-orchestrator/ and a starter task.yaml. */
export async function initCommand(opts: InitOptions = {}): Promise<void> {
  const cwd = opts.cwd ?? process.cwd();
  const orchDir = path.join(cwd, ORCH_DIR);

  fs.ensureDirSync(orchDir);
  fs.ensureDirSync(path.join(orchDir, "checkpoints"));
  fs.ensureDirSync(path.join(orchDir, "logs"));

  writeIfAbsent(path.join(orchDir, "config.yaml"), DEFAULT_CONFIG_YAML, opts.force);
  writeJsonIfAbsent(path.join(orchDir, "state.json"), emptyState(), opts.force);
  writeIfAbsent(path.join(cwd, "task.yaml"), DEFAULT_TASK_YAML, opts.force);

  printer.success("Initialized ai-code-orchestrator");
  printer.kv("Config", path.join(ORCH_DIR, "config.yaml"));
  printer.kv("State", path.join(ORCH_DIR, "state.json"));
  printer.kv("Task", "task.yaml");
  printer.info("");
  printer.dim("Next: edit task.yaml, then run `ai-code-orchestrator run task.yaml`.");
}

function writeIfAbsent(file: string, content: string, force?: boolean): void {
  if (fs.existsSync(file) && !force) {
    printer.dim(`skip (exists): ${path.relative(process.cwd(), file)}`);
    return;
  }
  fs.writeFileSync(file, content);
}

function writeJsonIfAbsent(file: string, content: unknown, force?: boolean): void {
  if (fs.existsSync(file) && !force) {
    printer.dim(`skip (exists): ${path.relative(process.cwd(), file)}`);
    return;
  }
  fs.writeJsonSync(file, content, { spaces: 2 });
}
