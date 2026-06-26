import { z } from "zod";

export const TaskStepSchema = z.object({
  id: z.string(),
  title: z.string(),
  expected_output: z.array(z.string()).default([]),
});

export type TaskStep = z.infer<typeof TaskStepSchema>;

export const TaskSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  project: z
    .object({
      type: z.string().optional(),
      framework: z.string().optional(),
      root: z.string().default("."),
    })
    .default({ root: "." }),
  goals: z.array(z.string()).default([]),
  constraints: z.array(z.string()).default([]),
  steps: z.array(TaskStepSchema).min(1),
  acceptance: z
    .object({
      commands: z.array(z.string()).default([]),
      required: z.array(z.string()).default([]),
    })
    .default({ commands: [], required: [] }),
  context: z.record(z.string(), z.unknown()).default({}),
});

export type Task = z.infer<typeof TaskSchema>;

/** Task after normalization: project.root resolved to absolute path. */
export interface NormalizedTask extends Task {
  project: {
    type?: string;
    framework?: string;
    root: string;
  };
}
