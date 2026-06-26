import fs from "fs-extra";
import path from "node:path";
import { CheckpointSchema, type Checkpoint } from "./state.schema.js";
import { nowIso } from "../utils/time.js";

/** Persists per-step checkpoint JSON files. */
export class CheckpointStore {
  private readonly dir: string;

  constructor(directory: string, cwd = process.cwd()) {
    this.dir = path.isAbsolute(directory) ? directory : path.join(cwd, directory);
    fs.ensureDirSync(this.dir);
  }

  fileFor(taskId: string, stepId: string): string {
    const safe = `${taskId}-${stepId}`.replace(/[^a-zA-Z0-9._-]/g, "_");
    return path.join(this.dir, `${safe}.json`);
  }

  /** Validate, stamp created_at if missing, write to disk, return file path. */
  save(checkpoint: Checkpoint): string {
    const cp = CheckpointSchema.parse({
      ...checkpoint,
      created_at: checkpoint.created_at || nowIso(),
    });
    const file = this.fileFor(cp.task_id, cp.step_id);
    fs.ensureDirSync(this.dir);
    fs.writeJsonSync(file, cp, { spaces: 2 });
    return file;
  }

  load(file: string): Checkpoint | null {
    if (!fs.existsSync(file)) return null;
    try {
      return CheckpointSchema.parse(fs.readJsonSync(file));
    } catch {
      return null;
    }
  }

  loadFor(taskId: string, stepId: string): Checkpoint | null {
    return this.load(this.fileFor(taskId, stepId));
  }

  get directory(): string {
    return this.dir;
  }
}
