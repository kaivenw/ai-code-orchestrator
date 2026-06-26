import { loadConfig } from "../../config/config-loader.js";
import { Orchestrator } from "../../core/orchestrator.js";
import { printer } from "../printer.js";

export interface RunCommandOptions {
  engine?: string;
  fallback?: string;
  timeout?: string;
  dryRun?: boolean;
  resume?: boolean;
  cwd?: string;
}

/** `run <task.yaml>` — execute a task through the orchestrator. */
export async function runCommand(
  taskFile: string,
  opts: RunCommandOptions = {},
): Promise<void> {
  const cwd = opts.cwd ?? process.cwd();
  const { config } = loadConfig(cwd);
  const orchestrator = new Orchestrator(config, cwd);

  const fallback =
    opts.fallback === undefined ? undefined : opts.fallback === "none" ? null : opts.fallback;

  const summary = await orchestrator.run({
    taskFile,
    cwd,
    primaryEngine: opts.engine,
    fallbackEngine: fallback,
    timeoutSeconds: opts.timeout ? Number(opts.timeout) : undefined,
    dryRun: opts.dryRun,
    resume: opts.resume,
  });

  if (summary.status === "paused") {
    printer.warn("Run paused. Inspect logs and `resume` after addressing the issue.");
    process.exitCode = 2;
  }
}
