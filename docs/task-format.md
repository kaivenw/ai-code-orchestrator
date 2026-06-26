# Task Format

A task file can be YAML (`task.yaml`) or JSON (`task.json`). It is validated with
zod on load; invalid tasks fail fast with a clear error.

## Fields

| Field          | Required | Description |
|----------------|----------|-------------|
| `id`           | yes      | Stable task identifier (used in state & checkpoint filenames) |
| `name`         | no       | Human-readable name |
| `description`  | no       | Project background passed to the engine prompt |
| `project.type` | no       | e.g. `java`, `node`, `vue` |
| `project.framework` | no  | e.g. `spring-boot`, `vue3-vite` |
| `project.root` | no       | Working directory for engines (default `.`, resolved relative to the task file) |
| `goals`        | no       | High-level goals (list) |
| `constraints`  | no       | Hard constraints the engine must respect (list) |
| `steps`        | **yes**  | Ordered list of steps; at least one |
| `steps[].id`   | yes      | Step id (unique within the task) |
| `steps[].title`| yes      | Step title |
| `steps[].expected_output` | no | Acceptance hints for the step (list) |
| `acceptance.commands` | no | Commands that verify the whole task (e.g. `mvn test`) |
| `acceptance.required` | no | Human-readable acceptance criteria |
| `context`      | no       | Free-form key/values (e.g. `language: zh-CN`) |

## Example

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

## Execution model

Steps run **in order**. After each successful step its id is recorded in
`state.json` `completed_steps`. On `resume`, completed steps are skipped and
execution continues from the first remaining step.
