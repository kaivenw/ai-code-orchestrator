/** Error classification for engine output / failures. */

export type EngineErrorType =
  | "timeout"
  | "quota"
  | "rate_limit"
  | "auth"
  | "crash"
  | "parse_error"
  | "no_output"
  | "unknown";

export const ERROR_PATTERNS: Record<string, string[]> = {
  quota: [
    "quota exceeded",
    "insufficient quota",
    "usage limit",
    "limit reached",
    "out of usage",
  ],
  rate_limit: ["rate limit", "429", "too many requests"],
  auth: [
    "unauthorized",
    "invalid api key",
    "authentication failed",
    "not logged in",
  ],
  timeout: ["timed out", "timeout"],
};

/**
 * Classify free-text output into a known error type. Order matters: quota and
 * rate_limit are checked before the generic timeout patterns.
 */
export function classifyError(output: string): EngineErrorType | null {
  if (!output) return null;
  const text = output.toLowerCase();
  for (const type of ["quota", "rate_limit", "auth", "timeout"] as const) {
    for (const pattern of ERROR_PATTERNS[type]) {
      if (text.includes(pattern)) return type;
    }
  }
  return null;
}

/** Custom error used to pause a task when failover gives up. */
export class TaskPausedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TaskPausedError";
  }
}

/** Error types that should trigger a failover to the fallback engine. */
export function isFailoverableError(type: EngineErrorType | undefined): boolean {
  if (!type) return false;
  return [
    "timeout",
    "quota",
    "rate_limit",
    "no_output",
    "crash",
    "auth",
  ].includes(type);
}
