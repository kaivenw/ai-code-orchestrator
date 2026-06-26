import { describe, it, expect, afterEach } from "vitest";
import fs from "fs-extra";
import { CheckpointStore } from "../src/state/checkpoint-store.js";
import { CheckpointSchema } from "../src/state/state.schema.js";
import { makeTempDir } from "./helpers.js";

const tmpDirs: string[] = [];
afterEach(() => {
  for (const d of tmpDirs.splice(0)) fs.removeSync(d);
});

describe("checkpoint-store", () => {
  it("saves and reloads a checkpoint", () => {
    const dir = makeTempDir();
    tmpDirs.push(dir);
    const store = new CheckpointStore("checkpoints", dir);
    const cp = CheckpointSchema.parse({
      task_id: "t",
      step_id: "service",
      status: "completed",
      summary: "done",
    });
    const file = store.save(cp);
    expect(fs.existsSync(file)).toBe(true);

    const loaded = store.loadFor("t", "service");
    expect(loaded?.summary).toBe("done");
    expect(loaded?.created_at).toBeTruthy();
  });

  it("sanitizes file names from ids", () => {
    const dir = makeTempDir();
    tmpDirs.push(dir);
    const store = new CheckpointStore("checkpoints", dir);
    const file = store.fileFor("a/b", "c d");
    expect(file).not.toContain("/b");
    expect(file).toMatch(/a_b-c_d\.json$/);
  });

  it("returns null for a missing checkpoint", () => {
    const dir = makeTempDir();
    tmpDirs.push(dir);
    const store = new CheckpointStore("checkpoints", dir);
    expect(store.loadFor("none", "none")).toBeNull();
  });
});
