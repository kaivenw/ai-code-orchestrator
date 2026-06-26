import { z } from "zod";

export const TaskStatusSchema = z.enum([
  "idle",
  "running",
  "completed",
  "paused",
  "failed",
]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const StateSchema = z.object({
  version: z.string().default("1.0"),
  task_id: z.string().nullable().default(null),
  task_file: z.string().nullable().default(null),
  status: TaskStatusSchema.default("idle"),
  current_engine: z.string().nullable().default(null),
  fallback_engine: z.string().nullable().default(null),
  current_step_index: z.number().int().default(0),
  current_step_id: z.string().nullable().default(null),
  completed_steps: z.array(z.string()).default([]),
  failed_steps: z.array(z.string()).default([]),
  last_update_at: z.string().nullable().default(null),
  last_output_at: z.string().nullable().default(null),
  last_checkpoint_file: z.string().nullable().default(null),
  run_id: z.string().nullable().default(null),
  message: z.string().nullable().default(null),
  stats: z
    .object({
      engine_switch_count: z.number().int().default(0),
      claude_fail_count: z.number().int().default(0),
      codex_fail_count: z.number().int().default(0),
    })
    .default({}),
});

export type State = z.infer<typeof StateSchema>;

export const CheckpointStatusSchema = z.enum(["completed", "partial", "failed"]);
export type CheckpointStatus = z.infer<typeof CheckpointStatusSchema>;

export const CheckpointSchema = z.object({
  task_id: z.string().default(""),
  step_id: z.string().default(""),
  step_title: z.string().optional().default(""),
  engine: z.string().optional().default(""),
  status: CheckpointStatusSchema.default("partial"),
  summary: z.string().default(""),
  files_changed: z.array(z.string()).default([]),
  files_to_review: z.array(z.string()).optional().default([]),
  commands_run: z.array(z.string()).default([]),
  next_action: z.string().default(""),
  known_issues: z.array(z.string()).default([]),
  test_status: z.enum(["not_run", "passed", "failed"]).default("not_run"),
  need_human_confirm: z.boolean().optional().default(false),
  raw_output_file: z.string().optional().default(""),
  created_at: z.string().optional().default(""),
});

export type Checkpoint = z.infer<typeof CheckpointSchema>;

export function emptyState(): State {
  return StateSchema.parse({});
}
