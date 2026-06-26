import { describe, it, expect, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import YAML from "yaml";
import { Orchestrator } from "../src/core/orchestrator.js";
import { ConfigSchema } from "../src/config/config.schema.js";
import { DEFAULT_CONFIG } from "../src/config/default-config.js";
import { StateStore } from "../src/state/state-store.js";
import { makeTempDir } from "./helpers.js";

const tmpDirs: string[] = [];
afterEach(() => {
  for (const d of tmpDirs.splice(0)) fs.removeSync(d);
});

const TASK = `id: "itest"
name: "integration task"
project:
  root: "."
steps:
  - id: "s1"
    title: "step 1"
  - id: "s2"
    title: "step 2"
`;

function setup(mockMode: string) {
  const dir = makeTempDir();
  tmpDirs.push(dir);
  fs.ensureDirSync(path.join(dir, ".ai-orchestrator"));
  const config = ConfigSchema.parse({
    ...DEFAULT_CONFIG,
    engines: {
      ...DEFAULT_CONFIG.engines,
      mock: { ...DEFAULT_CONFIG.engines.mock, mode: mockMode },
    },
    safety: { ...DEFAULT_CONFIG.safety, require_git_repo: false },
  });
  fs.writeFileSync(
    path.join(dir, ".ai-orchestrator", "config.yaml"),
    YAML.stringify(config),
  );
  const taskFile = path.join(dir, "task.yaml");
  fs.writeFileSync(taskFile, TASK);
  return { dir, config, taskFile };
}

describe("orchestrator integration (mock)", () => {
  it("Case 1: mock success completes without failover", async () => {
    const { dir, config, taskFile } = setup("success");
    const orch = new Orchestrator(config, dir);
    const summary = await orch.run({ taskFile, cwd: dir, primaryEngine: "mock", fallbackEngine: null });
    expect(summary.status).toBe("completed");
    expect(summary.switches).toBe(0);
    expect(new StateStore(dir).get().completed_steps).toEqual(["s1", "s2"]);
  });

  it("Case 2: mock timeout then codex/mock fallback succeeds", async () => {
    const { dir, config, taskFile } = setup("timeout_then_success");
    const orch = new Orchestrator(config, dir);
    const summary = await orch.run({ taskFile, cwd: dir, primaryEngine: "mock", fallbackEngine: "mock" });
    expect(summary.status).toBe("completed");
    expect(summary.switches).toBeGreaterThanOrEqual(1);
  });

  it("Case 4: both engines fail -> task paused", async () => {
    const { dir, config, taskFile } = setup("quota");
    const orch = new Orchestrator(config, dir);
    const summary = await orch.run({ taskFile, cwd: dir, primaryEngine: "mock", fallbackEngine: "mock" });
    expect(summary.status).toBe("paused");
    expect(new StateStore(dir).get().status).toBe("paused");
  });

  it("dry-run does not invoke engines and reports completed", async () => {
    const { dir, config, taskFile } = setup("success");
    const orch = new Orchestrator(config, dir);
    const summary = await orch.run({ taskFile, cwd: dir, primaryEngine: "mock", dryRun: true });
    expect(summary.status).toBe("completed");
    // state.json should not have been written with a running status
    expect(fs.existsSync(path.join(dir, ".ai-orchestrator", "state.json"))).toBe(false);
  });
});
