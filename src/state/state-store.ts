import fs from "fs-extra";
import path from "node:path";
import { StateSchema, emptyState, type State } from "./state.schema.js";
import { nowIso } from "../utils/time.js";
import { ORCH_DIR } from "../config/config-loader.js";

export const STATE_FILE = path.join(ORCH_DIR, "state.json");

/** Reads/writes .ai-orchestrator/state.json with schema validation. */
export class StateStore {
  private readonly file: string;
  private state: State;

  constructor(cwd = process.cwd()) {
    this.file = path.join(cwd, STATE_FILE);
    this.state = this.load();
  }

  private load(): State {
    if (!fs.existsSync(this.file)) return emptyState();
    try {
      const raw = fs.readJsonSync(this.file);
      return StateSchema.parse(raw);
    } catch {
      return emptyState();
    }
  }

  get(): State {
    return this.state;
  }

  /** Shallow-merge a patch into state, bump last_update_at, and persist. */
  update(patch: Partial<State>): State {
    this.state = StateSchema.parse({
      ...this.state,
      ...patch,
      stats: { ...this.state.stats, ...(patch.stats ?? {}) },
      last_update_at: nowIso(),
    });
    this.save();
    return this.state;
  }

  /** Record fresh engine output time (heartbeat) without a full update. */
  markOutput(): void {
    this.state.last_output_at = nowIso();
    this.state.last_update_at = nowIso();
    this.save();
  }

  save(): void {
    fs.ensureDirSync(path.dirname(this.file));
    fs.writeJsonSync(this.file, this.state, { spaces: 2 });
  }

  reset(): void {
    this.state = emptyState();
    this.save();
  }

  get filePath(): string {
    return this.file;
  }
}
