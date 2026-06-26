import { z } from "zod";

export const EngineConfigSchema = z.object({
  enabled: z.boolean().default(true),
  command: z.string().optional(),
  args: z.array(z.string()).default([]),
  timeout_seconds: z.number().positive().default(180),
  max_retries: z.number().int().min(0).default(1),
  // mock-only field
  mode: z
    .enum(["success", "timeout", "quota", "fail", "timeout_then_success"])
    .optional(),
});

export type EngineConfig = z.infer<typeof EngineConfigSchema> & {
  /** Filled in by the loader so engines know their own name. */
  name?: string;
};

export const ConfigSchema = z.object({
  version: z.string().default("1.0"),
  default_engine: z.string().default("claude"),
  fallback_engine: z.string().default("codex"),
  engines: z.record(z.string(), EngineConfigSchema).default({}),
  watchdog: z
    .object({
      enabled: z.boolean().default(true),
      no_output_timeout_seconds: z.number().positive().default(90),
      hard_timeout_seconds: z.number().positive().default(600),
      check_interval_seconds: z.number().positive().default(5),
    })
    .default({}),
  failover: z
    .object({
      enabled: z.boolean().default(true),
      max_switch_per_step: z.number().int().min(0).default(2),
      max_total_switch: z.number().int().min(0).default(5),
    })
    .default({}),
  checkpoint: z
    .object({
      enabled: z.boolean().default(true),
      save_after_each_step: z.boolean().default(true),
      directory: z.string().default(".ai-orchestrator/checkpoints"),
    })
    .default({}),
  logging: z
    .object({
      level: z.enum(["debug", "info", "warn", "error"]).default("info"),
      directory: z.string().default(".ai-orchestrator/logs"),
    })
    .default({}),
  safety: z
    .object({
      require_git_repo: z.boolean().default(false),
      require_clean_git: z.boolean().default(false),
      prevent_dirty_override: z.boolean().default(false),
      create_backup_before_run: z.boolean().default(false),
      protected_files: z
        .array(z.string())
        .default([".env", ".env.local", "*.pem", "*.key", "id_rsa"]),
    })
    .default({}),
  execution: z
    .object({
      mode: z.enum(["step_by_step"]).default("step_by_step"),
      stop_on_test_failure: z.boolean().default(true),
      require_final_summary: z.boolean().default(true),
    })
    .default({}),
});

export type OrchestratorConfig = z.infer<typeof ConfigSchema>;
