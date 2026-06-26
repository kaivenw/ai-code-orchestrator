import { execa } from "execa";

/** Check whether a CLI command exists / responds to --version. */
export async function commandAvailable(
  command: string,
  versionArgs: string[] = ["--version"],
): Promise<boolean> {
  try {
    await execa(command, versionArgs, { timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}

/** Return true if the given directory is inside a git work tree. */
export async function isGitRepo(cwd: string): Promise<boolean> {
  try {
    const { stdout } = await execa("git", ["rev-parse", "--is-inside-work-tree"], {
      cwd,
      timeout: 10000,
    });
    return stdout.trim() === "true";
  } catch {
    return false;
  }
}

/** Return porcelain git status lines, or null if not a repo / git missing. */
export async function gitStatusShort(cwd: string): Promise<string | null> {
  try {
    const { stdout } = await execa("git", ["status", "--short"], { cwd, timeout: 10000 });
    return stdout;
  } catch {
    return null;
  }
}
