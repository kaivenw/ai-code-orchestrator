import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { runCommand } from "./commands/run.js";
import { statusCommand } from "./commands/status.js";
import { resumeCommand } from "./commands/resume.js";
import { switchCommand } from "./commands/switch.js";
import { doctorCommand } from "./commands/doctor.js";
import { cleanCommand } from "./commands/clean.js";
import { printer } from "./printer.js";

const VERSION = "0.1.0";

const program = new Command();

program
  .name("ai-code-orchestrator")
  .description(
    "A local AI coding task orchestrator with checkpoint, watchdog, and engine failover.",
  )
  .version(VERSION, "-v, --version");

program
  .command("init")
  .description("Scaffold .ai-orchestrator/ and a starter task.yaml")
  .option("-f, --force", "overwrite existing files")
  .action(async (opts) => {
    await initCommand({ force: opts.force });
  });

program
  .command("run")
  .argument("<task>", "path to task.yaml or task.json")
  .description("Run a task through the orchestrator")
  .option("--engine <name>", "primary engine (default from config)")
  .option("--fallback <name>", 'fallback engine, or "none" to disable')
  .option("--timeout <seconds>", "override per-engine timeout in seconds")
  .option("--dry-run", "print the plan without invoking any engine")
  .option("--resume", "resume from existing state, skipping completed steps")
  .action(async (task, opts) => {
    await runCommand(task, {
      engine: opts.engine,
      fallback: opts.fallback,
      timeout: opts.timeout,
      dryRun: opts.dryRun,
      resume: opts.resume,
    });
  });

program
  .command("status")
  .description("Show current task state")
  .action(async () => {
    await statusCommand();
  });

program
  .command("resume")
  .argument("[task]", "optional path to task file")
  .description("Resume an interrupted task from its last checkpoint")
  .option("--engine <name>", "engine to resume with")
  .option("--fallback <name>", "fallback engine")
  .action(async (task, opts) => {
    await resumeCommand(task, { engine: opts.engine, fallback: opts.fallback });
  });

program
  .command("switch")
  .argument("<engine>", "engine to switch to (claude | codex | mock)")
  .description("Manually switch the current engine for the next resume")
  .action(async (engine) => {
    await switchCommand(engine);
  });

program
  .command("doctor")
  .description("Check the local environment")
  .action(async () => {
    await doctorCommand();
  });

program
  .command("clean")
  .description("Reset run state")
  .option("--logs", "also clear logs/")
  .option("--checkpoints", "also clear checkpoints/")
  .option("--all", "clear state, logs and checkpoints")
  .action(async (opts) => {
    await cleanCommand({ logs: opts.logs, checkpoints: opts.checkpoints, all: opts.all });
  });

program.parseAsync(process.argv).catch((err) => {
  printer.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
