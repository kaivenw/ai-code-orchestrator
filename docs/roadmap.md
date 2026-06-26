<div align="right">

**中文 | [English](roadmap.en.md)**

</div>

# 路线图

## v0.1.0 —— 最小可运行闭环
`task.yaml → Claude 执行 → checkpoint → status`
- init、run、status
- Claude 引擎、状态存储、Checkpoint 存储、README

## v0.2.0 —— Codex 失败切换
`Claude 失败 → Codex 接管`
- Codex 引擎、Failover、错误分类器、Resume 提示词、Mock 引擎测试

## v0.3.0 —— Watchdog
`长时间无输出 → 自动 kill → fallback`
- 心跳、卡住检测、无输出超时、硬超时、更丰富的日志

## v0.4.0 —— 真实项目可用
- doctor、clean、examples、敏感文件保护、git 状态检查、更完整测试

## v1.0.0 —— 开源发布版
`npm install -g` 后稳定运行
- 完整文档、CI、核心单测覆盖、GitHub Actions、npm publish、MIT

## v1 之后
- Web 控制台、多用户、云端同步、DAG 工作流、插件市场、自动发 PR、多仓库并行任务
- 更多引擎适配器：DeepSeek、Gemini、Qwen、Cursor、Trae
