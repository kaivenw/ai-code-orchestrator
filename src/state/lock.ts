import fs from "fs-extra";
import path from "node:path";

/**
 * Very small advisory lock based on a lock file. Prevents two `run` invocations
 * from clobbering the same state.json. Best-effort, not a hard guarantee.
 */
export class RunLock {
  private readonly lockFile: string;
  private acquired = false;

  constructor(orchDir: string) {
    this.lockFile = path.join(orchDir, "run.lock");
  }

  acquire(): boolean {
    fs.ensureDirSync(path.dirname(this.lockFile));
    if (fs.existsSync(this.lockFile)) {
      const pid = Number(fs.readFileSync(this.lockFile, "utf8").trim());
      if (pid && isProcessAlive(pid)) {
        return false;
      }
      // Stale lock: previous process is gone, take it over.
    }
    fs.writeFileSync(this.lockFile, String(process.pid));
    this.acquired = true;
    return true;
  }

  release(): void {
    if (this.acquired && fs.existsSync(this.lockFile)) {
      fs.removeSync(this.lockFile);
    }
    this.acquired = false;
  }
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
