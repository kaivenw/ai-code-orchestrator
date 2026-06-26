import path from "node:path";
import type { Task, NormalizedTask } from "./task.schema.js";

/**
 * Normalize a parsed task: resolve project.root relative to the directory the
 * task file lives in, so engines get an absolute working directory.
 */
export function normalizeTask(task: Task, taskFileDir: string): NormalizedTask {
  const root = task.project?.root ?? ".";
  const absoluteRoot = path.isAbsolute(root) ? root : path.resolve(taskFileDir, root);
  return {
    ...task,
    project: {
      type: task.project?.type,
      framework: task.project?.framework,
      root: absoluteRoot,
    },
  };
}
