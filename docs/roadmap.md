# Roadmap

## v0.1.0 — minimal run loop
`task.yaml → Claude executes → checkpoint → status`
- init, run, status
- Claude engine, State store, Checkpoint store, README

## v0.2.0 — Codex fallback
`Claude fails → Codex takes over`
- Codex engine, Failover, Error classifier, Resume prompt, Mock engine tests

## v0.3.0 — Watchdog
`No output for a while → auto-kill → fallback`
- heartbeat, stall detector, no-output timeout, hard timeout, richer logs

## v0.4.0 — usable on real projects
- doctor, clean, examples, protected-file safety, git status checks, more tests

## v1.0.0 — open-source release
`npm install -g` and run reliably
- full docs, CI, core unit-test coverage, GitHub Actions, npm publish, MIT

## Beyond v1
- Web console, multi-user, cloud sync, DAG workflows, plugin marketplace,
  auto-PR, multi-repo parallel tasks
- More engine adapters: DeepSeek, Gemini, Qwen, Cursor, Trae
