import { describe, it, expect, afterEach } from "vitest";
import fs from "fs-extra";
import { MockEngine } from "../src/engines/mock.engine.js";
import type { EngineRunInput } from "../src/engines/engine.interface.js";
import type { NormalizedTask, TaskStep } from "../src/task/task.schema.js";
import type { EngineConfig } from "../src/config/config.schema.js";
import { makeTempDir, makeLogger } from "./helpers.js";

const tmpDirs: string[] = [];
afterEach(() => {
  for (const d of tmpDirs.splice(0)) fs.removeSync(d);
});

function makeInput(stepId = "s1"): EngineRunInput {
  const dir = makeTempDir();
  tmpDirs.push(dir);
  const task = {
    id: "t",
    steps: [{ id: stepId, title: "step", expected_output: [] }],
    project: { root: dir },
    goals: [],
    constraints: [],
    acceptance: { commands: [], required: [] },
    context: {},
  } as unknown as NormalizedTask;
  const step: TaskStep = { id: stepId, title: "step", expected_output: [] };
  const config: EngineConfig = { enabled: true, args: [], timeout_seconds: 3, max_retries: 0 };
  return {
    task,
    step,
    stepIndex: 0,
    stepTotal: 1,
    config,
    runId: "run_test",
    isTakeover: false,
    isFinalStep: true,
    logger: makeLogger(dir),
  };
}

describe("mock-engine", () => {
  it("succeeds in success mode and emits a checkpoint", async () => {
    const engine = new MockEngine("success");
    const result = await engine.run(makeInput());
    expect(result.success).toBe(true);
    expect(result.checkpoint?.status).toBe("completed");
  });

  it("fails with timeout error in timeout mode", async () => {
    const engine = new MockEngine("timeout");
    const result = await engine.run(makeInput());
    expect(result.success).toBe(false);
    expect(result.errorType).toBe("timeout");
  });

  it("fails with quota error in quota mode", async () => {
    const engine = new MockEngine("quota");
    const result = await engine.run(makeInput());
    expect(result.success).toBe(false);
    expect(result.errorType).toBe("quota");
  });

  it("fails in fail mode", async () => {
    const engine = new MockEngine("fail");
    const result = await engine.run(makeInput());
    expect(result.success).toBe(false);
  });

  it("times out on first call then succeeds in timeout_then_success", async () => {
    const engine = new MockEngine("timeout_then_success");
    const first = await engine.run(makeInput("a"));
    expect(first.success).toBe(false);
    expect(first.errorType).toBe("timeout");

    const second = await engine.run(makeInput("a"));
    expect(second.success).toBe(true);

    // Subsequent steps also succeed (only the first global attempt fails).
    const third = await engine.run(makeInput("b"));
    expect(third.success).toBe(true);
  });

  it("always reports availability", async () => {
    expect(await new MockEngine().isAvailable()).toBe(true);
  });
});
