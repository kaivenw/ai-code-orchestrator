import path from "node:path";
import fs from "fs-extra";
import { StateStore } from "../../state/state-store.js";
import { runCommand } from "./run.js";
import { printer } from "../printer.js";

export interface ResumeOptions {
  engine?: string;
  fallback?: string;
  cwd?: string;
}

/** `resume [task.yaml]` — continue an interrupted task from its last state. */
export async function resumeCommand(
  taskFile: string | undefined,
  opts: ResumeOptions = {},
): Promise<void> {
  const cwd = opts.cwd ?? process.cwd();
  const store = new StateStore(cwd);
  const state = store.get();

  const resolvedTask =
    taskFile ?? state.task_file ?? path.join(cwd, "task.yaml");

  if (!fs.existsSync(resolvedTask)) {
    printer.error(`Cannot resume: task file not found (${resolvedTask}).`);
    process.exitCode = 1;
    return;
  }

  if (state.status === "completed") {
    printer.success("Task already completed; nothing to resume.");
    return;
  }

  printer.info(
    `Resuming task "${state.task_id ?? "(unknown)"}" from ${state.completed_steps.length} completed step(s).`,
  );

  await runCommand(resolvedTask, {
    engine: opts.engine ?? state.current_engine ?? undefined,
    fallback: opts.fallback,
    resume: true,
    cwd,
  });
}
