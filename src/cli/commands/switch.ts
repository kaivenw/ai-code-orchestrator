import { StateStore } from "../../state/state-store.js";
import { loadConfig, getEngineConfig } from "../../config/config-loader.js";
import { printer } from "../printer.js";

export interface SwitchOptions {
  cwd?: string;
}

/**
 * `switch <engine>` — manually set the current engine in state, so the next
 * `resume` uses it as the primary engine.
 */
export async function switchCommand(
  engine: string,
  opts: SwitchOptions = {},
): Promise<void> {
  const cwd = opts.cwd ?? process.cwd();
  const { config } = loadConfig(cwd);

  try {
    getEngineConfig(config, engine);
  } catch (err) {
    printer.error((err as Error).message);
    process.exitCode = 1;
    return;
  }

  const store = new StateStore(cwd);
  const state = store.get();
  const previous = state.current_engine;
  store.update({
    current_engine: engine,
    message: `manually switched engine from ${previous ?? "(none)"} to ${engine}`,
  });

  printer.success(`Current engine switched to "${engine}".`);
  printer.dim("Run `resume` to continue the task with this engine.");
}
