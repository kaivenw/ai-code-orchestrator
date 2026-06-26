import type { OrchestratorConfig } from "../config/config.schema.js";
import { getEngineConfig } from "../config/config-loader.js";
import { ClaudeEngine } from "./claude.engine.js";
import { CodexEngine } from "./codex.engine.js";
import { MockEngine, type MockMode } from "./mock.engine.js";
import type { Engine } from "./engine.interface.js";

/**
 * Builds and caches engine instances from config. Engines are keyed by name so
 * `timeout_then_success` mock state survives across primary/fallback usage.
 */
export class EngineManager {
  private readonly config: OrchestratorConfig;
  private readonly cache = new Map<string, Engine>();

  constructor(config: OrchestratorConfig) {
    this.config = config;
  }

  get(name: string): Engine {
    const cached = this.cache.get(name);
    if (cached) return cached;
    const engine = this.create(name);
    this.cache.set(name, engine);
    return engine;
  }

  private create(name: string): Engine {
    const ec = getEngineConfig(this.config, name);
    switch (name) {
      case "claude":
        return new ClaudeEngine(ec.command ?? "claude");
      case "codex":
        return new CodexEngine(ec.command ?? "codex");
      case "mock":
        return new MockEngine((ec.mode as MockMode) ?? "success");
      default:
        throw new Error(`Unknown engine: ${name}`);
    }
  }

  /** Engine-specific config (command/args/timeout/...). */
  configFor(name: string) {
    return getEngineConfig(this.config, name);
  }
}
