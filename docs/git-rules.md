# Git 规则

本文档定义本仓库的 branch 命名、提交消息和提交前检查规范。Agent 或协作者在创建 branch、准备 commit 或提交代码前都应遵守。

## 提交前安全检查

创建 branch 或准备提交前，先检查工作区中是否包含不应上传的内容：

- 私密信息：API key、token、密码、私钥、cookie、真实用户数据。
- 本地配置：`.env`、`.env.*`、本机路径、IDE 私有配置。
- 临时文件：日志、调试输出、截图草稿、临时导出文件。
- 构建产物：`dist/`、缓存目录、生成包，除非任务明确要求提交。
- 大文件或二进制文件：未经确认不要提交图片、压缩包、数据库文件或视频。
- 与当前任务无关的修改：默认视为用户改动，不要混入本次提交。

如果发现疑似敏感内容，先停止提交并向用户确认处理方式。不要自行上传、提交或用格式化命令覆盖无关文件。

## Branch 命名

使用短横线分隔，全部小写，避免空格、中文、特殊符号和过长名称。

推荐格式：

```txt
<type>/<short-topic>
```

可用 `type`：

- `feature`：新增用户可见功能。
- `fix`：修复 bug 或错误行为。
- `docs`：文档变更。
- `chore`：配置、脚本、依赖、工具维护。
- `refactor`：不改变行为的代码整理。
- `test`：测试相关变更。

示例：

```txt
feature/goal-album-api
fix/complete-step-ownership
docs/git-rules
chore/wrangler-bindings
refactor/goal-query-helpers
test/goal-completion-flow
```

如果本地环境无法创建带 `/` 的分组分支，可以使用等价的短横线格式：

```txt
docs-git-rules
feature-goal-album-api
```

## Commit Message

提交消息使用简短、明确的英文或中文。首行说明本次提交做了什么，不要超过 72 个字符。

推荐格式：

```txt
<type>: <summary>
```

可用 `type` 与 branch 类型一致：

- `feature`
- `fix`
- `docs`
- `chore`
- `refactor`
- `test`

示例：

```txt
docs: add git branch and commit rules
feature: add goal completion API
fix: validate goal owner before completion
chore: update Cloudflare worker bindings
```

如果需要正文，正文说明原因、影响范围和验证结果。不要在提交消息里写入 token、账号、内部链接或其他敏感信息。

## 提交流程

准备提交时建议按以下顺序执行：

1. 查看当前分支和工作区：`git status --short --branch`。
2. 检查差异：`git diff`，必要时用 `git diff --staged` 检查暂存内容。
3. 排除敏感信息、临时文件、构建产物和无关改动。
4. 按任务范围暂存文件，避免 `git add .` 混入无关内容。
5. 运行与改动相关的检查。代码改动通常至少运行 `pnpm build` 和 `pnpm lint`。
6. 使用规范 commit message 提交。

