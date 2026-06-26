import type { OrchestratorConfig } from "./config.schema.js";

/** Default config object, used by `init` and as fallback when no file exists. */
export const DEFAULT_CONFIG: OrchestratorConfig = {
  version: "1.0",
  default_engine: "claude",
  fallback_engine: "codex",
  engines: {
    claude: {
      enabled: true,
      command: "claude",
      args: ["--print"],
      timeout_seconds: 180,
      max_retries: 1,
    },
    codex: {
      enabled: true,
      command: "codex",
      args: ["exec"],
      timeout_seconds: 240,
      max_retries: 1,
    },
    mock: {
      enabled: true,
      args: [],
      mode: "success",
      timeout_seconds: 3,
      max_retries: 0,
    },
  },
  watchdog: {
    enabled: true,
    no_output_timeout_seconds: 90,
    hard_timeout_seconds: 600,
    check_interval_seconds: 5,
  },
  failover: {
    enabled: true,
    max_switch_per_step: 2,
    max_total_switch: 5,
  },
  checkpoint: {
    enabled: true,
    save_after_each_step: true,
    directory: ".ai-orchestrator/checkpoints",
  },
  logging: {
    level: "info",
    directory: ".ai-orchestrator/logs",
  },
  safety: {
    require_git_repo: true,
    require_clean_git: false,
    prevent_dirty_override: false,
    create_backup_before_run: true,
    protected_files: [
      ".env",
      ".env.local",
      "*.pem",
      "*.key",
      "id_rsa",
      "application-prod.yml",
      "application-prod.yaml",
    ],
  },
  execution: {
    mode: "step_by_step",
    stop_on_test_failure: true,
    require_final_summary: true,
  },
};

/** Raw YAML emitted by `init` (kept human-friendly with comments). */
export const DEFAULT_CONFIG_YAML = `version: "1.0"

default_engine: "claude"
fallback_engine: "codex"

engines:
  claude:
    enabled: true
    command: "claude"
    args:
      - "--print"
    timeout_seconds: 180
    max_retries: 1

  codex:
    enabled: true
    command: "codex"
    args:
      - "exec"
    timeout_seconds: 240
    max_retries: 1

  mock:
    enabled: true
    mode: "success"
    timeout_seconds: 3
    max_retries: 0

watchdog:
  enabled: true
  no_output_timeout_seconds: 90
  hard_timeout_seconds: 600
  check_interval_seconds: 5

failover:
  enabled: true
  max_switch_per_step: 2
  max_total_switch: 5

checkpoint:
  enabled: true
  save_after_each_step: true
  directory: ".ai-orchestrator/checkpoints"

logging:
  level: "info"
  directory: ".ai-orchestrator/logs"

safety:
  require_git_repo: true
  require_clean_git: false
  prevent_dirty_override: false
  create_backup_before_run: true
  protected_files:
    - ".env"
    - ".env.local"
    - "*.pem"
    - "*.key"
    - "id_rsa"
    - "application-prod.yml"
    - "application-prod.yaml"

execution:
  mode: "step_by_step"
  stop_on_test_failure: true
  require_final_summary: true
`;
