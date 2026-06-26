import { describe, it, expect, afterEach } from "vitest";
import path from "node:path";
import fs from "fs-extra";
import { loadTask, parseTask } from "../src/task/task-loader.js";
import { makeTempDir } from "./helpers.js";

const tmpDirs: string[] = [];
afterEach(() => {
  for (const d of tmpDirs.splice(0)) fs.removeSync(d);
});

const SAMPLE = `id: "demo"
name: "demo task"
project:
  type: "node"
  root: "./app"
steps:
  - id: "a"
    title: "step a"
    expected_output:
      - "x"
  - id: "b"
    title: "step b"
`;

describe("task-loader", () => {
  it("parses a valid yaml task", () => {
    const task = parseTask(SAMPLE, "yaml");
    expect(task.id).toBe("demo");
    expect(task.steps).toHaveLength(2);
    expect(task.steps[0].expected_output).toEqual(["x"]);
  });

  it("parses json tasks too", () => {
    const json = JSON.stringify({ id: "j", steps: [{ id: "s", title: "t" }] });
    const task = parseTask(json, "json");
    expect(task.id).toBe("j");
    expect(task.steps[0].id).toBe("s");
  });

  it("rejects tasks without steps", () => {
    expect(() => parseTask(`id: "x"\nsteps: []`, "yaml")).toThrow();
  });

  it("normalizes project.root to an absolute path", () => {
    const dir = makeTempDir();
    tmpDirs.push(dir);
    const file = path.join(dir, "task.yaml");
    fs.writeFileSync(file, SAMPLE);
    const task = loadTask(file);
    expect(path.isAbsolute(task.project.root)).toBe(true);
    expect(task.project.root).toBe(path.resolve(dir, "./app"));
  });

  it("throws on a missing file", () => {
    expect(() => loadTask("/nope/does-not-exist.yaml")).toThrow(/not found/i);
  });
});
