import fs from "fs-extra";
import path from "node:path";
import { ORCH_DIR } from "../../config/config-loader.js";
import { emptyState } from "../../state/state.schema.js";
import { printer } from "../printer.js";

export interface CleanOptions {
  logs?: boolean;
  checkpoints?: boolean;
  all?: boolean;
  cwd?: string;
}

/**
 * `clean` — reset run state. With no flags it resets state.json. Flags scope
 * additional cleanup (logs / checkpoints / all).
 */
export async function cleanCommand(opts: CleanOptions = {}): Promise<void> {
  const cwd = opts.cwd ?? process.cwd();
  const orchDir = path.join(cwd, ORCH_DIR);
  const logsDir = path.join(orchDir, "logs");
  const checkpointsDir = path.join(orchDir, "checkpoints");

  const doLogs = opts.all || opts.logs;
  const doCheckpoints = opts.all || opts.checkpoints;
  const onlyState = !doLogs && !doCheckpoints;

  // Always reset state.json to idle.
  const stateFile = path.join(orchDir, "state.json");
  if (fs.existsSync(stateFile)) {
    fs.writeJsonSync(stateFile, emptyState(), { spaces: 2 });
    printer.success("Reset state.json");
  }

  if (doLogs && fs.existsSync(logsDir)) {
    fs.emptyDirSync(logsDir);
    printer.success("Cleared logs/");
  }
  if (doCheckpoints && fs.existsSync(checkpointsDir)) {
    fs.emptyDirSync(checkpointsDir);
    printer.success("Cleared checkpoints/");
  }

  if (onlyState) {
    printer.dim("Use --logs, --checkpoints, or --all to remove more.");
  }
}
