import { StateStore } from "../../state/state-store.js";
import { printer } from "../printer.js";
import { timeAgo } from "../../utils/time.js";
import { loadConfig } from "../../config/config-loader.js";
import { loadTask } from "../../task/task-loader.js";

export interface StatusOptions {
  cwd?: string;
}

/** `status` — print the current task state from state.json. */
export async function statusCommand(opts: StatusOptions = {}): Promise<void> {
  const cwd = opts.cwd ?? process.cwd();
  const store = new StateStore(cwd);
  const state = store.get();

  if (!state.task_id) {
    printer.warn("No task state found. Run a task first with `run task.yaml`.");
    return;
  }

  let totalSteps = "?";
  try {
    loadConfig(cwd);
    if (state.task_file) {
      const task = loadTask(state.task_file);
      totalSteps = String(task.steps.length);
    }
  } catch {
    // best-effort; status should never crash on a missing task file
  }

  printer.heading(`Task: ${state.task_id}`);
  printer.kv("Status", state.status);
  printer.kv("Current Engine", state.current_engine ?? "(none)");
  printer.kv("Fallback Engine", state.fallback_engine ?? "(none)");
  printer.kv(
    "Current Step",
    `${state.current_step_index + 1}/${totalSteps}` +
      (state.current_step_id ? ` (${state.current_step_id})` : ""),
  );
  printer.kv("Completed Steps", state.completed_steps.join(", ") || "(none)");
  if (state.failed_steps.length) {
    printer.kv("Failed Steps", state.failed_steps.join(", "));
  }
  printer.kv("Last Update", timeAgo(state.last_update_at));
  printer.kv("Last Output", timeAgo(state.last_output_at));
  printer.kv("Last Checkpoint", state.last_checkpoint_file ?? "(none)");
  printer.kv(
    "Switches",
    `${state.stats.engine_switch_count} (claude fails: ${state.stats.claude_fail_count}, codex fails: ${state.stats.codex_fail_count})`,
  );
  if (state.message) printer.kv("Message", state.message);
}
