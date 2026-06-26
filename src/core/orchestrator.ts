import path from "node:path";
import fs from "fs-extra";
import type { OrchestratorConfig } from "../config/config.schema.js";
import { loadTask } from "../task/task-loader.js";
import type { NormalizedTask } from "../task/task.schema.js";
import { StateStore } from "../state/state-store.js";
import { CheckpointStore } from "../state/checkpoint-store.js";
import { EngineManager } from "../engines/engine-manager.js";
import { FailoverController } from "./failover.js";
import { Scheduler } from "./scheduler.js";
import { StepRunner } from "./step-runner.js";
import { Logger } from "../utils/logger.js";
import { RunLock } from "../state/lock.js";
import { makeRunId } from "../utils/time.js";
import { ORCH_DIR } from "../config/config-loader.js";
import { isGitRepo, gitStatusShort } from "../utils/shell.js";
import { printer } from "../cli/printer.js";
import type { Checkpoint } from "../state/state.schema.js";

export interface RunOptions {
  taskFile: string;
  cwd: string;
  primaryEngine?: string;
  fallbackEngine?: string | null;
  timeoutSeconds?: number;
  dryRun?: boolean;
  resume?: boolean;
}

export interface RunSummary {
  status: "completed" | "paused" | "failed";
  completedSteps: string[];
  switches: number;
}

/** Top-level coordinator: loads task, runs steps, persists state/checkpoints. */
export class Orchestrator {
  private readonly config: OrchestratorConfig;
  private readonly cwd: string;

  constructor(config: OrchestratorConfig, cwd = process.cwd()) {
    this.config = config;
    this.cwd = cwd;
  }

  async run(opts: RunOptions): Promise<RunSummary> {
    const task = loadTask(opts.taskFile);
    const primary = opts.primaryEngine ?? this.config.default_engine;
    const fallback =
      opts.fallbackEngine === undefined
        ? this.config.fallback_engine
        : opts.fallbackEngine;

    // Apply per-run timeout override across engines.
    const config = this.withTimeoutOverride(opts.timeoutSeconds);

    if (opts.dryRun) {
      return this.dryRun(task, primary, fallback);
    }

    await this.safetyChecks(task);

    const lock = new RunLock(path.join(this.cwd, ORCH_DIR));
    if (!lock.acquire()) {
      throw new Error("Another run appears to be in progress (run.lock held).");
    }

    const runId = makeRunId();
    const logger = new Logger({
      directory: path.join(this.cwd, config.logging.directory),
      runId,
      level: config.logging.level,
    });

    const stateStore = new StateStore(this.cwd);
    const checkpointStore = new CheckpointStore(config.checkpoint.directory, this.cwd);
    const engines = new EngineManager(config);
    const failover = new FailoverController({
      enabled: config.failover.enabled,
      maxSwitchPerStep: config.failover.max_switch_per_step,
      maxTotalSwitch: config.failover.max_total_switch,
    });

    const existing = stateStore.get();
    const resume = !!opts.resume;
    const plan = Scheduler.plan(task, existing, resume);
    const total = Scheduler.totalSteps(task);

    const completedSteps = resume ? [...existing.completed_steps] : [];

    stateStore.update({
      task_id: task.id,
      task_file: path.resolve(opts.taskFile),
      status: "running",
      current_engine: primary,
      fallback_engine: fallback,
      run_id: runId,
      completed_steps: completedSteps,
      failed_steps: [],
      message: resume ? "resumed" : "started",
    });

    logger.info(resume ? "task resumed" : "task started", { engine: primary });
    printer.heading(`Task: ${task.id}`);
    printer.kv("Run", runId);
    printer.kv("Primary", primary);
    printer.kv("Fallback", fallback ?? "(none)");

    const runner = new StepRunner({
      task,
      config,
      logger,
      engines,
      failover,
      runId,
      primaryEngine: primary,
      fallbackEngine: fallback,
      onHeartbeat: () => stateStore.markOutput(),
    });

    const stats = { engine_switch_count: 0, claude_fail_count: 0, codex_fail_count: 0 };

    try {
      for (const { step, index } of plan) {
        stateStore.update({
          status: "running",
          current_step_index: index,
          current_step_id: step.id,
        });

        const resumeCp = this.loadResumeCheckpoint(checkpointStore, task, step.id);
        const outcome = await runner.run(step, index, total, resumeCp);

        // Persist checkpoint produced by the step (parsed or synthesized).
        if (outcome.checkpoint) {
          const file = checkpointStore.save(outcome.checkpoint);
          stateStore.update({ last_checkpoint_file: relativize(this.cwd, file) });
        }

        // Accumulate fail/switch stats.
        if (outcome.switched) stats.engine_switch_count += 1;
        stats.claude_fail_count += outcome.failCounts["claude"] ?? 0;
        stats.codex_fail_count += outcome.failCounts["codex"] ?? 0;

        if (!outcome.success) {
          stateStore.update({
            status: "paused",
            current_engine: outcome.engineUsed,
            failed_steps: [...stateStore.get().failed_steps, step.id],
            message: outcome.reason ?? "step failed",
            stats,
          });
          logger.warn("task paused", { step_id: step.id });
          printer.warn(`Task paused at step "${step.id}": ${outcome.reason ?? "failed"}`);
          lock.release();
          return { status: "paused", completedSteps, switches: stats.engine_switch_count };
        }

        completedSteps.push(step.id);
        stateStore.update({
          current_engine: outcome.engineUsed,
          completed_steps: completedSteps,
          stats,
        });
      }

      stateStore.update({ status: "completed", message: "all steps completed", stats });
      logger.info("task completed");
      printer.success("Task completed");
      lock.release();
      return { status: "completed", completedSteps, switches: stats.engine_switch_count };
    } catch (error) {
      stateStore.update({
        status: "failed",
        message: (error as Error).message,
        stats,
      });
      logger.error("task failed", { message: (error as Error).message });
      lock.release();
      throw error;
    }
  }

  private loadResumeCheckpoint(
    store: CheckpointStore,
    task: NormalizedTask,
    stepId: string,
  ): Checkpoint | undefined {
    return store.loadFor(task.id, stepId) ?? undefined;
  }

  private withTimeoutOverride(timeoutSeconds?: number): OrchestratorConfig {
    if (!timeoutSeconds) return this.config;
    const engines = Object.fromEntries(
      Object.entries(this.config.engines).map(([name, ec]) => [
        name,
        { ...ec, timeout_seconds: timeoutSeconds },
      ]),
    );
    return { ...this.config, engines };
  }

  private async safetyChecks(task: NormalizedTask): Promise<void> {
    const safety = this.config.safety;
    const root = task.project.root;

    if (safety.require_git_repo) {
      const repo = await isGitRepo(root);
      if (!repo) {
        printer.warn(
          `项目目录不是 git 仓库（${root}）。建议先用 git 管理代码再运行。`,
        );
      }
    }

    const status = await gitStatusShort(root);
    if (status && status.trim().length > 0) {
      printer.warn("当前工作区有未提交内容，建议先提交或备份。");
      if (safety.require_clean_git) {
        throw new Error("safety.require_clean_git=true 且工作区不干净，已中止。");
      }
    }
  }

  private dryRun(
    task: NormalizedTask,
    primary: string,
    fallback: string | null,
  ): RunSummary {
    printer.heading(`[dry-run] Task: ${task.id}`);
    printer.kv("Primary engine", primary);
    printer.kv("Fallback engine", fallback ?? "(none)");
    printer.kv("Project root", task.project.root);
    printer.info("");
    printer.info("Steps to execute:");
    task.steps.forEach((step, i) => {
      printer.step(`${i + 1}. [${step.id}] ${step.title}`);
      step.expected_output.forEach((e) => printer.dim(`     - ${e}`));
    });
    printer.info("");
    printer.success("Dry-run complete. No engine was invoked.");
    return { status: "completed", completedSteps: [], switches: 0 };
  }
}

function relativize(cwd: string, file: string): string {
  const rel = path.relative(cwd, file);
  return rel.startsWith("..") ? file : rel;
}

/** Best-effort backup helper exposed for safety.create_backup_before_run. */
export function ensureBackupDir(cwd: string): string {
  const dir = path.join(cwd, ORCH_DIR, "backups");
  fs.ensureDirSync(dir);
  return dir;
}
