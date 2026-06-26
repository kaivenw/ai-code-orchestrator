<div align="right">

**[中文](README.md) | English**

</div>

# AI Code Orchestrator

> **Claude Code stopped? Codex continues.**

AI Code Orchestrator is a local CLI tool that runs structured coding tasks with
multiple AI coding engines, saves a checkpoint after every step, detects stalled
runs, and automatically fails over to another engine when the primary one gets
stuck, times out, hits a rate limit, or runs out of quota.

It does **not** replace Claude Code or Codex — it *orchestrates* them. The
engines read and write your code; the orchestrator standardizes the task,
monitors execution, persists checkpoints, and switches engines on failure.

## Features

- Run structured coding tasks from a single `task.yaml`
- Claude Code / Codex / Mock engine adapters (CLI subprocess wrappers)
- Checkpoint after each step — never lose context on a crash
- Resume interrupted tasks from the last checkpoint
- Watchdog for stalled / no-output / hard-timeout runs
- Automatic failover with per-step and total switch limits
- Local-first state storage (no Redis / MySQL / Docker required)
- `--dry-run`, structured logs, and sensitive-file safety guards

## Installation

```bash
git clone https://github.com/kaivenw/ai-code-orchestrator.git
cd ai-code-orchestrator
npm install
npm run build
npm link            # exposes the `ai-code-orchestrator` command globally
```

Verify:

```bash
ai-code-orchestrator --help
```

> Requires Node.js >= 18. For real engine execution you also need the `claude`
> and/or `codex` CLIs installed and authenticated. Run `ai-code-orchestrator
> doctor` to check your environment.

## Quick Start

```bash
# 1. Scaffold config + a starter task in your project
cd /path/to/your/project
ai-code-orchestrator init

# 2. Try the full pipeline with the built-in mock engine (no real AI calls)
ai-code-orchestrator run task.yaml --engine mock

# 3. Inspect the result
ai-code-orchestrator status
```

`init` creates:

```text
.ai-orchestrator/
├── config.yaml
├── state.json
├── checkpoints/
└── logs/
task.yaml
```

## Run

```bash
ai-code-orchestrator run task.yaml                      # use config defaults
ai-code-orchestrator run task.yaml --engine claude      # pick primary engine
ai-code-orchestrator run task.yaml --fallback codex     # pick fallback engine
ai-code-orchestrator run task.yaml --fallback none      # disable failover
ai-code-orchestrator run task.yaml --timeout 120        # override engine timeout
ai-code-orchestrator run task.yaml --dry-run            # print plan, run nothing
```

## Resume

If a task pauses (failure on both engines, or a non-failoverable error), fix the
issue and continue from the last checkpoint:

```bash
ai-code-orchestrator resume                # uses state.json's task + engine
ai-code-orchestrator resume task.yaml      # or pass the task explicitly
ai-code-orchestrator switch codex          # change engine, then resume
```

## Configuration

All behavior is driven by `.ai-orchestrator/config.yaml` — CLI flags only
override per run. See [docs/task-format.md](docs/task-format.en.md) and the inline
comments in the generated config. Key sections: `engines`, `watchdog`,
`failover`, `checkpoint`, `logging`, `safety`, `execution`.

## Task Format

A task is a list of ordered steps, each with `expected_output` acceptance hints.
See [docs/task-format.md](docs/task-format.en.md) and [examples/](examples/).

## How Failover Works

```text
run step → primary engine
  ├── success → parse checkpoint → save state → next step
  └── fail / timeout / no-output / quota / rate-limit
        → save partial checkpoint
        → switch to fallback engine (within switch limits)
        → fallback resumes the SAME step using the checkpoint
```

Switch limits (`failover.max_switch_per_step`, `failover.max_total_switch`)
prevent infinite ping-ponging. When limits are hit the task is **paused**, not
silently dropped. See [docs/checkpoint.md](docs/checkpoint.en.md).

## Safety Notes

This tool invokes AI coding CLIs that modify your local code. **Only use it in
trusted projects under version control.** Commit or back up before running.
Sensitive files (`.env`, `*.pem`, `*.key`, prod configs, …) are flagged in
config and reported if touched. Raw engine output is always written to
`.ai-orchestrator/logs/` — nothing is swallowed.

## Examples

- [examples/simple-node-task](examples/simple-node-task)
- [examples/java-spring-boot-task](examples/java-spring-boot-task)
- [examples/vue-task](examples/vue-task)

## Roadmap

See [docs/roadmap.md](docs/roadmap.en.md). Highlights: v0.1 Claude run loop →
v0.2 Codex failover → v0.3 watchdog → v0.4 doctor/clean/examples → v1.0 npm
release.

## Contributing

Issues and PRs welcome. Run `npm test` and `npm run build` before submitting.
New engines only need to implement the `Engine` interface
(see [docs/engine-adapter.md](docs/engine-adapter.en.md)).

## License

[MIT](LICENSE)
