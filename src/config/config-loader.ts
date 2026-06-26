import fs from "fs-extra";
import path from "node:path";
import YAML from "yaml";
import { ConfigSchema, type OrchestratorConfig, type EngineConfig } from "./config.schema.js";
import { DEFAULT_CONFIG } from "./default-config.js";

export const ORCH_DIR = ".ai-orchestrator";
export const CONFIG_FILE = path.join(ORCH_DIR, "config.yaml");

export interface LoadedConfig {
  config: OrchestratorConfig;
  /** Absolute path the config was loaded from, or null if defaults were used. */
  source: string | null;
}

/** Load and validate config.yaml from the given working directory. */
export function loadConfig(cwd = process.cwd()): LoadedConfig {
  const file = path.join(cwd, CONFIG_FILE);
  if (!fs.existsSync(file)) {
    return { config: ConfigSchema.parse(DEFAULT_CONFIG), source: null };
  }
  const raw = fs.readFileSync(file, "utf8");
  const parsed = YAML.parse(raw) ?? {};
  const config = ConfigSchema.parse(parsed);
  return { config, source: file };
}

/** Resolve a single engine's config, attaching its name. Throws if unknown. */
export function getEngineConfig(
  config: OrchestratorConfig,
  name: string,
): EngineConfig {
  const ec = config.engines[name];
  if (!ec) {
    throw new Error(`Engine "${name}" is not defined in config.engines`);
  }
  if (!ec.enabled) {
    throw new Error(`Engine "${name}" is disabled in config`);
  }
  return { ...ec, name };
}

export function configExists(cwd = process.cwd()): boolean {
  return fs.existsSync(path.join(cwd, CONFIG_FILE));
}
