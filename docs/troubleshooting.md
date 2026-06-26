<div align="right">

**中文 | [English](troubleshooting.en.md)**

</div>

# 常见问题排查

## `ai-code-orchestrator: command not found`

在项目根目录运行 `npm run build && npm link`，再用 `which ai-code-orchestrator` 确认。

## `doctor` 报告找不到 Claude / Codex CLI

单独安装并登录这两个引擎 CLI：

- Claude Code CLI 要能响应 `claude --version`。
- Codex CLI 要能响应 `codex --version`。

即使两个都没装，也可以用 `--engine mock` 把整条链路跑通试试。

## 任务一上来就以"too many failovers"暂停

说明主引擎在某一步上反复失败。查看对应的引擎日志
（`.ai-orchestrator/logs/<run_id>.<engine>.log`）和该步的 partial checkpoint。只有当失败是
临时性的（如限流）才调高 `failover.max_switch_per_step`，否则请先修复根因再 `resume`。

## "Another run appears to be in progress (run.lock held)"

要么上次运行崩溃没释放锁，要么确实有一个在跑。如果确认没有在跑，删除
`.ai-orchestrator/run.lock` 即可。来自已死进程 PID 的过期锁会被自动检测并回收。

## checkpoint JSON 没被解析出来

如果引擎没有输出干净的 ```json 块，会生成一个指向 `raw_output_file` 的 `partial`
checkpoint。查看那份日志，然后 `resume` —— 备用/主引擎会从 `next_action` 继续。

## 引擎改动了敏感文件

匹配 `safety.protected_files` 的文件（如 `.env`、`*.pem`、生产配置）会被标记。提交前先用
`git diff` 审查。务必在 git 仓库中、工作区干净（或已备份）的情况下运行。

## 重置一切

```bash
ai-code-orchestrator clean --all   # 状态 + 日志 + checkpoints
```
