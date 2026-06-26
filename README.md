<div align="right">

**中文 | [English](README.en.md)**

</div>

# AI Code Orchestrator

> **Claude Code 卡住了？Codex 自动接着干。**

一个本地 CLI 工具，用多个 AI 编码引擎执行标准化开发任务：每完成一步就保存一次
checkpoint，监控卡住的执行，并在主引擎卡住、超时、触发限流或额度不足时，**自动切换
到备用引擎继续干**。

它**不替代** Claude Code 或 Codex，而是**编排**它们：引擎负责真正读代码、改代码、
跑命令；编排器负责标准化任务、监控状态、保存断点、失败切换。

## 功能特性

- 用一个 `task.yaml` 驱动标准化的多步骤开发任务
- Claude Code / Codex / Mock 三种引擎适配器（CLI 子进程封装）
- 每步保存 checkpoint —— 进程崩了也不丢上下文
- 从最后一个 checkpoint 断点续跑
- Watchdog 监控卡住 / 长时间无输出 / 硬超时
- 自动 failover，带单步与总切换次数上限
- 本地优先存储（无需 Redis / MySQL / Docker）
- 支持 `--dry-run`、结构化日志、敏感文件保护

## 安装

```bash
git clone https://github.com/kaivenw/ai-code-orchestrator.git
cd ai-code-orchestrator
npm install
npm run build
npm link            # 注册全局 `ai-code-orchestrator` 命令
```

验证：

```bash
ai-code-orchestrator --help
```

> 需要 Node.js >= 18。若要真实调用引擎，还需安装并登录 `claude` 和/或 `codex` CLI。
> 运行 `ai-code-orchestrator doctor` 可检查本机环境。

## 快速开始

```bash
# 1. 在你的项目里生成配置和起始任务
cd /path/to/your/project
ai-code-orchestrator init

# 2. 先用内置 mock 引擎跑通整条链路（不调用真实 AI）
ai-code-orchestrator run task.yaml --engine mock

# 3. 查看结果
ai-code-orchestrator status
```

`init` 会生成：

```text
.ai-orchestrator/
├── config.yaml
├── state.json
├── checkpoints/
└── logs/
task.yaml
```

## 执行任务

```bash
ai-code-orchestrator run task.yaml                      # 使用配置默认值
ai-code-orchestrator run task.yaml --engine claude      # 指定主引擎
ai-code-orchestrator run task.yaml --fallback codex     # 指定备用引擎
ai-code-orchestrator run task.yaml --fallback none      # 禁用 failover
ai-code-orchestrator run task.yaml --timeout 120        # 覆盖引擎超时（秒）
ai-code-orchestrator run task.yaml --dry-run            # 只打印计划，不执行
```

## 断点续跑

如果任务被暂停（两个引擎都失败，或遇到不可切换的错误），修复问题后从最后一个
checkpoint 继续：

```bash
ai-code-orchestrator resume                # 沿用 state.json 里的任务与引擎
ai-code-orchestrator resume task.yaml      # 或显式指定任务文件
ai-code-orchestrator switch codex          # 切换引擎后再 resume
```

## 配置

所有行为都由 `.ai-orchestrator/config.yaml` 驱动，CLI 参数只对单次运行生效。详见
[docs/task-format.md](docs/task-format.md) 以及生成配置里的注释。主要分区：`engines`、
`watchdog`、`failover`、`checkpoint`、`logging`、`safety`、`execution`。

## 任务格式

一个任务是一组有序步骤，每步带 `expected_output` 验收提示。详见
[docs/task-format.md](docs/task-format.md) 和 [examples/](examples/)。

## Failover 如何工作

```text
执行 step → 主引擎
  ├── 成功 → 解析 checkpoint → 保存状态 → 下一步
  └── 失败 / 超时 / 无输出 / 额度不足 / 限流
        → 保存 partial checkpoint
        → 切换到备用引擎（在切换次数上限内）
        → 备用引擎基于 checkpoint 继续执行同一 step
```

切换上限（`failover.max_switch_per_step`、`failover.max_total_switch`）可防止无限来回
切换。触达上限时任务会被**暂停**，而不是被悄悄丢弃。详见
[docs/checkpoint.md](docs/checkpoint.md)。

## 安全须知

本工具会调用 AI 编码 CLI 修改你的本地代码。**请只在受版本控制的可信项目中使用**，
运行前先提交或备份。匹配 `safety.protected_files` 的敏感文件（`.env`、`*.pem`、
`*.key`、生产配置等）若被改动会被标记。引擎原始输出始终写入
`.ai-orchestrator/logs/`，不会被吞掉。

## 示例

- [examples/simple-node-task](examples/simple-node-task)
- [examples/java-spring-boot-task](examples/java-spring-boot-task)
- [examples/vue-task](examples/vue-task)

## 路线图

详见 [docs/roadmap.md](docs/roadmap.md)。要点：v0.1 Claude 执行闭环 → v0.2 Codex
failover → v0.3 watchdog → v0.4 doctor/clean/examples → v1.0 npm 发布。

## 参与贡献

欢迎提 Issue 和 PR。提交前请先跑 `npm test` 和 `npm run build`。新增引擎只需实现
`Engine` 接口（见 [docs/engine-adapter.md](docs/engine-adapter.md)）。

## 许可协议

[MIT](LICENSE)
