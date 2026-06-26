import { describe, it, expect, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import { StateStore, STATE_FILE } from "../src/state/state-store.js";
import { makeTempDir } from "./helpers.js";

const tmpDirs: string[] = [];
afterEach(() => {
  for (const d of tmpDirs.splice(0)) fs.removeSync(d);
});

describe("state-store", () => {
  it("starts from an empty state and persists updates", () => {
    const dir = makeTempDir();
    tmpDirs.push(dir);
    const store = new StateStore(dir);
    expect(store.get().status).toBe("idle");

    store.update({ task_id: "t1", status: "running", current_step_index: 2 });
    const onDisk = fs.readJsonSync(path.join(dir, STATE_FILE));
    expect(onDisk.task_id).toBe("t1");
    expect(onDisk.status).toBe("running");
    expect(onDisk.last_update_at).toBeTruthy();
  });

  it("merges stats instead of replacing them", () => {
    const dir = makeTempDir();
    tmpDirs.push(dir);
    const store = new StateStore(dir);
    store.update({ stats: { engine_switch_count: 1, claude_fail_count: 0, codex_fail_count: 0 } });
    store.update({ stats: { engine_switch_count: 2, claude_fail_count: 1, codex_fail_count: 0 } });
    expect(store.get().stats.engine_switch_count).toBe(2);
    expect(store.get().stats.claude_fail_count).toBe(1);
  });

  it("reloads persisted state in a new instance", () => {
    const dir = makeTempDir();
    tmpDirs.push(dir);
    new StateStore(dir).update({ task_id: "persisted", completed_steps: ["a"] });
    const reloaded = new StateStore(dir);
    expect(reloaded.get().task_id).toBe("persisted");
    expect(reloaded.get().completed_steps).toEqual(["a"]);
  });

  it("markOutput updates last_output_at", () => {
    const dir = makeTempDir();
    tmpDirs.push(dir);
    const store = new StateStore(dir);
    store.markOutput();
    expect(store.get().last_output_at).toBeTruthy();
  });
});
