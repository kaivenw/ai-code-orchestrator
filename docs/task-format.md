<div align="right">

**中文 | [English](task-format.en.md)**

</div>

# 任务格式

任务文件可以是 YAML（`task.yaml`）或 JSON（`task.json`）。加载时用 zod 校验，非法任务会
立即报错并给出清晰提示。

## 字段

| 字段           | 必填 | 说明 |
|----------------|------|------|
| `id`           | 是   | 稳定的任务标识（用于 state 与 checkpoint 文件名） |
| `name`         | 否   | 可读名称 |
| `description`  | 否   | 项目背景，会带入引擎提示词 |
| `project.type` | 否   | 如 `java`、`node`、`vue` |
| `project.framework` | 否 | 如 `spring-boot`、`vue3-vite` |
| `project.root` | 否   | 引擎的工作目录（默认 `.`，相对任务文件解析） |
| `goals`        | 否   | 高层目标（列表） |
| `constraints`  | 否   | 引擎必须遵守的硬约束（列表） |
| `steps`        | **是** | 有序步骤列表，至少一个 |
| `steps[].id`   | 是   | 步骤 id（任务内唯一） |
| `steps[].title`| 是   | 步骤标题 |
| `steps[].expected_output` | 否 | 该步骤的验收提示（列表） |
| `acceptance.commands` | 否 | 验证整个任务的命令（如 `mvn test`） |
| `acceptance.required` | 否 | 可读的验收标准 |
| `context`      | 否   | 自由键值对（如 `language: zh-CN`） |

## 示例

```yaml
id: "build-login-api"
name: "实现登录接口"
project:
  type: "java"
  framework: "spring-boot"
  root: "."
goals:
  - "新增登录接口"
constraints:
  - "不要修改数据库连接配置"
steps:
  - id: "dto"
    title: "实现登录请求和响应 DTO"
    expected_output:
      - "LoginRequest"
      - "LoginResponse"
acceptance:
  commands:
    - "mvn test"
context:
  language: "zh-CN"
```

## 执行模型

步骤**按顺序**执行。每成功一步，其 id 会记入 `state.json` 的 `completed_steps`。执行
`resume` 时会跳过已完成步骤，从第一个未完成步骤继续。
