import fs from "fs-extra";
import path from "node:path";
import process from "node:process";
import { commandAvailable, isGitRepo } from "../../utils/shell.js";
import { CONFIG_FILE } from "../../config/config-loader.js";
import { printer } from "../printer.js";

export interface DoctorOptions {
  cwd?: string;
}

interface Check {
  label: string;
  ok: boolean;
  detail?: string;
}

/** `doctor` — verify the local environment is ready. */
export async function doctorCommand(opts: DoctorOptions = {}): Promise<void> {
  const cwd = opts.cwd ?? process.cwd();
  const checks: Check[] = [];

  const nodeMajor = Number(process.versions.node.split(".")[0]);
  checks.push({
    label: `Node.js ${process.version}`,
    ok: nodeMajor >= 18,
    detail: nodeMajor >= 18 ? undefined : "requires Node >= 18",
  });

  const [claude, codex, git] = await Promise.all([
    commandAvailable("claude", ["--version"]),
    commandAvailable("codex", ["--version"]),
    commandAvailable("git", ["--version"]),
  ]);
  checks.push({ label: "Claude Code CLI (claude)", ok: claude, detail: claude ? undefined : "not found in PATH" });
  checks.push({ label: "Codex CLI (codex)", ok: codex, detail: codex ? undefined : "not found in PATH" });
  checks.push({ label: "git", ok: git, detail: git ? undefined : "not found in PATH" });

  const inRepo = git ? await isGitRepo(cwd) : false;
  checks.push({ label: "Working dir is a git repo", ok: inRepo, detail: inRepo ? undefined : "not a git repo" });

  const configOk = fs.existsSync(path.join(cwd, CONFIG_FILE));
  checks.push({ label: "config.yaml exists", ok: configOk, detail: configOk ? undefined : "run `init`" });

  const taskOk = fs.existsSync(path.join(cwd, "task.yaml"));
  checks.push({ label: "task.yaml exists", ok: taskOk, detail: taskOk ? undefined : "run `init` or create one" });

  printer.heading("Environment check");
  for (const c of checks) {
    if (c.ok) printer.success(c.label);
    else printer.warn(`${c.label}${c.detail ? ` — ${c.detail}` : ""}`);
  }

  // doctor reports; it never hard-fails on optional tools.
  const blocking = checks.find((c) => c.label.startsWith("Node.js") && !c.ok);
  if (blocking) process.exitCode = 1;
}
