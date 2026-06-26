<div align="right">

**[中文](troubleshooting.md) | English**

</div>

# Troubleshooting

## `ai-code-orchestrator: command not found`

Run `npm run build && npm link` from the project root. Confirm with
`which ai-code-orchestrator`.

## `doctor` reports Claude / Codex CLI not found

Install and authenticate the engine CLIs separately:

- Claude Code CLI must respond to `claude --version`.
- Codex CLI must respond to `codex --version`.

You can still try everything with `--engine mock` without either installed.

## Task immediately pauses with "too many failovers"

The primary engine keeps failing on one step. Check the per-engine log
(`.ai-orchestrator/logs/<run_id>.<engine>.log`) and the partial checkpoint for
the step. Raise `failover.max_switch_per_step` only if the failures are
transient (rate limits), otherwise fix the underlying issue and `resume`.

## "Another run appears to be in progress (run.lock held)"

A previous run crashed without releasing the lock, or one is genuinely running.
If you're sure nothing is running, remove `.ai-orchestrator/run.lock`. Stale
locks from dead PIDs are detected and reclaimed automatically.

## Checkpoint JSON wasn't parsed

If the engine didn't emit a clean ```json block, a `partial` checkpoint is
created pointing at `raw_output_file`. Inspect that log, then `resume` — the
fallback/primary engine will continue from `next_action`.

## Engine modifies a sensitive file

Files matching `safety.protected_files` (e.g. `.env`, `*.pem`, prod configs) are
flagged. Review the diff with `git diff` before committing. Always run inside a
git repo with a clean (or backed-up) working tree.

## Reset everything

```bash
ai-code-orchestrator clean --all   # state + logs + checkpoints
```
