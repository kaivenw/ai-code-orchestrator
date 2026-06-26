/** Time helpers used across the orchestrator. */

/** ISO timestamp for "now". */
export function nowIso(): string {
  return new Date().toISOString();
}

/** Monotonic-ish millisecond timestamp. */
export function nowMs(): number {
  return Date.now();
}

/** Build a run id like run_20260626_120000. */
export function makeRunId(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `run_${y}${m}${d}_${hh}${mm}${ss}`;
}

/** Human readable "x seconds ago" from an ISO timestamp. */
export function timeAgo(iso: string | null | undefined, ref = Date.now()): string {
  if (!iso) return "never";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "unknown";
  const diffSec = Math.max(0, Math.round((ref - then) / 1000));
  if (diffSec < 60) return `${diffSec} seconds ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minutes ago`;
  const diffHour = Math.round(diffMin / 60);
  return `${diffHour} hours ago`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
