import os from "node:os";
import path from "node:path";
import fs from "fs-extra";
import { Logger } from "../src/utils/logger.js";

/** Create an isolated temp working directory for a test. */
export function makeTempDir(prefix = "aco-test-"): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

export function makeLogger(dir: string, runId = "run_test"): Logger {
  return new Logger({ directory: path.join(dir, "logs"), runId, level: "error" });
}
