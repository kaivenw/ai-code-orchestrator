import fs from "fs-extra";
import path from "node:path";
import YAML from "yaml";
import { TaskSchema, type Task } from "./task.schema.js";
import { normalizeTask } from "./task-normalizer.js";
import type { NormalizedTask } from "./task.schema.js";

/** Parse raw YAML or JSON text into a validated Task. */
export function parseTask(raw: string, format: "yaml" | "json"): Task {
  const data = format === "json" ? JSON.parse(raw) : YAML.parse(raw);
  return TaskSchema.parse(data ?? {});
}

/** Load, validate and normalize a task file (yaml or json) from disk. */
export function loadTask(taskFilePath: string): NormalizedTask {
  const abs = path.resolve(taskFilePath);
  if (!fs.existsSync(abs)) {
    throw new Error(`Task file not found: ${abs}`);
  }
  const raw = fs.readFileSync(abs, "utf8");
  const ext = path.extname(abs).toLowerCase();
  const format: "yaml" | "json" = ext === ".json" ? "json" : "yaml";
  const task = parseTask(raw, format);
  return normalizeTask(task, path.dirname(abs));
}
