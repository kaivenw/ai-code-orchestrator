import type { NormalizedTask, TaskStep } from "../task/task.schema.js";
import type { State } from "../state/state.schema.js";

export interface ScheduledStep {
  step: TaskStep;
  index: number;
}

/**
 * Computes which steps still need to run. On a fresh run that's all of them; on
 * resume it skips steps already recorded as completed in state.
 */
export class Scheduler {
  static plan(task: NormalizedTask, state: State | null, resume: boolean): ScheduledStep[] {
    const all = task.steps.map((step, index) => ({ step, index }));
    if (!resume || !state) return all;

    const completed = new Set(state.completed_steps);
    // Resume from the first non-completed step.
    return all.filter(({ step }) => !completed.has(step.id));
  }

  static totalSteps(task: NormalizedTask): number {
    return task.steps.length;
  }
}
