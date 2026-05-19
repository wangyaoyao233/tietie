# AGENTS.md

## 项目背景

这个仓库是 **Sticker Goals** 的第一版原型。它是一个移动优先的网页应用：用户把一个目标创建成一本贴纸收集册，每个目标有固定数量的空槽。用户每完成一个小步骤，就选择一张贴纸，写一句可选记录，然后把贴纸贴到下一个空槽里。

MVP 要验证的核心问题是：用户贴上第一张贴纸之后，是否还想继续把这本册子贴满？

主要产品文档：`docs/project-goal.md`。

架构文档：`docs/architecture.md`。如果架构、目录、API、数据模型、Cloudflare binding、脚本或运行方式发生变化，必须同步更新该文档。

根目录说明文档：`README.md`。如果修改涉及 README、产品文档、架构文档、Agent 规则或其他说明文档中共享的事实，必须同步检查相关文档，保持各处说明一致，避免产生矛盾。

## 当前仓库状态

- 当前脚手架：Cloudflare Workers + Vite + React + TypeScript。
- 包管理器：`pnpm`。
- 前端入口：`src/main.tsx`，应用主体在 `src/app/App.tsx`，客户端路由在 `src/app/router.tsx`。
- Worker 入口：`worker/index.ts`，API 使用 Hono 并挂载在 `/api` 下。
- 当前配置：`vite.config.ts`、`wrangler.jsonc`、`drizzle.config.ts`、TypeScript 配置文件。
- Tailwind CSS、Hono、Drizzle、D1 migrations、贴纸种子数据、D1/R2 binding 和 API 路由已经接入。
- 当前架构细节以 `docs/architecture.md` 为准。

## 目标技术栈

使用：

- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui，按需使用
- Framer Motion，用于轻量完成动画
- Cloudflare Workers
- Hono，用于 Worker API 路由
- Cloudflare D1，用于关系型数据
- Drizzle ORM，用于 schema 和查询
- Cloudflare R2 预留绑定，用于未来贴纸资源，但 MVP 不要求实现上传
- Wrangler，用于本地开发和部署

不要使用：

- Next.js
- Supabase
- Firebase
- Prisma
- Express
- 不能在 Cloudflare Workers 运行的 Node-only libraries
- 原生 iOS/Android
- 复杂 AI 功能
- 社交功能
- 支付功能
- 用户生成贴纸市场

## 产品规则

- 这是一个目标贴纸册应用，不是通用 todo app。
- 贴纸册网格是产品体验的视觉中心。
- 先为约 390px 宽度的手机屏幕设计。
- 桌面端需要可用，但优先级低于移动端。
- 语气要温和、轻量。不要羞辱用户，也不要使用失败惩罚类表达。
- MVP 使用中文 UI 文案。
- 创建目标要短：标题、总步数、可选最终奖励、主题。
- MVP 不询问截止日期。
- 贴纸是记忆。一个已填充槽位应该保留贴纸图片、完成日期、可选记录和槽位编号。

建议文案：

- `创建目标册`
- `我的目标册`
- `贴上一张`
- `完成一步`
- `选择贴纸`
- `写一句记录`
- `最终奖励`
- `已贴满`
- `继续贴贴`
- `今天的小进度被收起来了`

## MVP 路由

客户端路由：

- `/` landing page
- `/dashboard` 目标册列表
- `/goals/new` 创建目标表单
- `/goals/:goalId` 目标册详情页

完成一步的流程应作为目标详情页上的 modal 或 sheet 实现，不需要单独路由。

API 路由必须放在 `/api` 下，并返回 JSON。

必需接口：

- `GET /api/health`
- `GET /api/stickers`
- `GET /api/goals?userId=:userId`
- `POST /api/goals`
- `GET /api/goals/:goalId?userId=:userId`
- `POST /api/goals/:goalId/complete`
- `GET /api/goals/:goalId/completions?userId=:userId`

统一使用以下响应结构：

```ts
type ApiSuccess<T> = {
  ok: true;
  data: T;
};

type ApiError = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
};
```

## 匿名用户身份

v1 不实现完整登录。

首次访问时生成一个 UUID，并存入 localStorage：

```ts
const USER_ID_STORAGE_KEY = "sticker_goals_user_id";
```

将这个 user id 通过请求体或请求头发送给 API。所有目标和完成记录都必须按这个匿名 user id 隔离。

## 数据模型要求

使用 D1 和 Drizzle ORM。MVP schema 应包含：

- `users`
- `goals`
- `goal_slots`
- `stickers`
- `completions`
- `rewards`，作为未来功能的预留表

核心数据一致性规则：

- 一个目标只属于一个用户。
- 一个目标必须有且仅有 `total_steps` 个槽位。
- 一个槽位只能是 `empty` 或 `filled`。
- 已填充槽位必须有 sticker id 和 completion id。
- 一条 completion 必须属于一个 goal、一个 slot、一个 sticker 和一个 user。
- 完成一步时，永远填充按 `slot_index` 排序的第一个空槽。
- 已完成目标不能继续接收 completion。
- `completed_steps` 必须和已填充槽位数量一致。
- API handler 在返回或修改 goal 数据前，必须校验 `userId` 所有权。

`POST /api/goals/:goalId/complete` 应尽可能按 D1/Drizzle 能支持的方式保持原子性，避免部分更新。

## 贴纸种子数据

至少创建 24 个内置贴纸。

主题：

- `study`
- `fitness`
- `reading`
- `money`
- `daily`
- `cute`

MVP 阶段，贴纸图片使用 `public/stickers/` 下的轻量 SVG。不要因为 R2 上传流程阻塞 MVP。

## 前端规范

随着应用增长，优先采用以下结构：

```txt
src/
  app/
    App.tsx
    router.tsx
  components/
    Button.tsx
    Card.tsx
    EmptyState.tsx
    ProgressBar.tsx
    Modal.tsx
  features/
    goals/
      GoalCard.tsx
      GoalForm.tsx
      GoalAlbumPage.tsx
      GoalAlbumGrid.tsx
      GoalSlot.tsx
      CompleteStepModal.tsx
      CompletionDetailModal.tsx
      CompletedGoalPanel.tsx
      goalApi.ts
      goalTypes.ts
    stickers/
      StickerPicker.tsx
      StickerImage.tsx
      stickerApi.ts
      stickerTypes.ts
    user/
      anonymousUser.ts
  lib/
    apiClient.ts
    cn.ts
    dates.ts
    ids.ts
```

UI 要求：

- 移动优先布局。
- 大号可点击区域，适合触摸操作。
- 柔和背景。
- 圆角卡片和圆角槽位。
- 轻微阴影。
- 响应式贴纸网格。
- 空槽要像贴纸册占位，不要像任务项。
- 已填充槽位显示贴纸图片，并且可点击。
- 空槽不可点击，或呈 disabled 状态。
- 下一个空槽要有轻微高亮。
- Framer Motion 只用于轻量、有意义的动画，例如新贴纸 scale/fade in。
- 前端组件样式统一使用 Tailwind utility class；`src/index.css` 只保留 Tailwind 入口和必要的全局 base 样式，不新增组件级原生 CSS class。

避免：

- 密集 dashboard。
- 在核心产品流程里使用表格。
- 强硬的生产力软件文案。
- 排行榜、连续打卡惩罚或社交压力。
- 过度动画。

## Worker 和 API 规范

- 开始实现 API 后，使用 Hono 做路由。
- 路由模块保持小而清晰，并按领域组织，例如 `worker/routes/goals.ts`。
- D1 访问应放在 Drizzle schema/query helper 中，不要把 raw SQL 分散在 handler 里。
- 在 API 边界校验请求体和 query params。
- 返回合适的 HTTP 状态码：
  - `400`：校验错误。
  - `403`：匿名用户不拥有该目标。
  - `404`：目标或贴纸不存在。
  - `409`：尝试继续完成已经完成的目标。
  - `500`：仅用于未预期错误。
- Worker 代码不要使用 Node-only libraries。

## Wrangler 和绑定

`wrangler.jsonc` 应包含：

- Worker name。
- Compatibility date。
- Static assets config。
- D1 binding，名称为 `DB`。
- 可选 R2 bucket binding，名称为 `STICKER_ASSETS`。

绑定变更后，保持生成的 Worker 环境类型同步更新。

## 命令

统一使用 `pnpm`。

当前可用脚本：

```bash
pnpm dev
pnpm build
pnpm typecheck
pnpm lint
pnpm format
pnpm format:check
pnpm preview
pnpm run deploy
pnpm cf-typegen
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

完成有意义的代码改动前，运行仓库里已有的相关检查，通常是：

```bash
pnpm build
pnpm lint
```

如果添加了数据库脚本，还需要使用 Wrangler/D1 在本地验证 migration 和 seed 逻辑。

## 实现顺序

除非用户另有要求，否则按产品文档顺序推进：

1. 项目设置：Tailwind、Hono、Drizzle、Wrangler D1/R2 bindings。
2. 使用 mock data 搭建静态前端原型。
3. D1 schema、migrations 和贴纸种子数据。
4. API 路由。
5. 将前端接入真实 API。
6. 打磨贴纸册交互和移动端布局。

在核心贴纸册闭环能用 D1 持久化端到端跑通前，不要添加新产品功能。

## Agent 工作规范和约束

### 修改前

- 开始改动前先阅读相关文件，不要只根据文件名猜测实现。
- 优先使用 `rg` / `rg --files` 查找代码、路由、类型和配置。
- 如果需求涉及产品行为，先对照 `docs/project-goal.md`，再决定实现范围。
- 如果需求涉及架构、目录、API、数据模型、Cloudflare binding、脚本或运行方式，先对照并在完成修改时同步更新 `docs/architecture.md`。
- 当用户提出新需求或修改要求时，先给出简短 plan，说明准备修改的范围、步骤和验证方式；只有在用户明确同意后，才按 plan 执行代码或配置修改。
- 如果工作区已有未提交改动，默认视为用户改动，不要覆盖、格式化或回滚无关文件。
- 不要执行破坏性命令，例如 `git reset --hard`、`git checkout --`、批量删除文件，除非用户明确要求。

### 修改范围

- 保持改动聚焦在当前任务，不做顺手重构。
- 每次改动前都要考虑当前场景的最佳实践，并在不扩大范围、不违背项目约束的前提下采用更稳妥、可维护的实现方式。
- 修改代码时，不要顺手改变其他代码的格式；只格式化本次任务实际修改的代码块或文件中必须调整的最小范围。
- 不要因为局部实现引入新的架构层，除非它能明显减少复杂度，或项目已有类似模式。
- 不要把 mock data、临时代码或调试日志留在生产路径中。
- 不要修改生成文件，除非该文件本来就需要随配置或 schema 更新。
- 不要擅自改变项目技术栈、包管理器、路由方案或部署平台。

### 依赖约束

- 使用 `pnpm` 管理依赖。
- 新增依赖前必须确认它适用于当前运行环境，尤其是 Worker 代码不能依赖 Node-only API。
- 优先使用目标技术栈内的库：Hono、Drizzle、Tailwind、shadcn/ui、Framer Motion。
- 不要新增与禁用技术冲突的依赖，例如 Prisma、Express、Firebase、Supabase、Next.js。
- 如果一个需求可以用平台能力或少量本地代码解决，不要引入大型依赖。

### TypeScript 和代码风格

- 优先保持 TypeScript 类型明确，不使用 `any` 逃避建模；确实需要时要把范围限制在最小。
- API 请求、响应、数据库实体和前端领域模型应有明确类型。
- 不要在组件里堆积复杂业务逻辑；可复用逻辑放到 feature helper 或 `src/lib/`。
- 命名要表达业务含义，例如 `GoalAlbumPage`、`CompleteStepModal`、`getAnonymousUserId`。
- 写代码时在关键位置补充简洁注释，说明代码的目的、业务约束或不直观的技术原因。
- 注释要简洁高效、易于理解；不要啰嗦解释，也不要为每一行或显而易见的赋值写注释。

### 前端约束

- 先保证手机宽度体验，尤其是 390px 左右视口。
- 核心界面应直接呈现可用产品，不要把主要页面做成营销介绍页。
- 交互控件要有清晰 loading、disabled 和 error 状态。
- 表单提交过程中禁用重复提交。
- 客户端错误要用友好中文提示，不要直接暴露原始异常。
- 不要把贴纸册做成任务列表。视觉中心应是 album slots。

### Worker / API 约束

- 所有 API 返回统一的 `{ ok, data }` 或 `{ ok, error }` JSON 结构。
- 所有写操作必须校验 `userId` 和资源所有权。
- 所有输入都必须校验长度、必填项和取值范围。
- 不要信任客户端传来的进度、slot index、status 等派生状态。
- 完成一步时，由服务端查找第一个空 slot，并更新 goal/slot/completion。
- Worker 中不要使用 Node.js 文件系统、进程、长连接或其他不适用于 Cloudflare Workers 的 API。

### 数据库约束

- schema 变更必须配套 migration。
- seed 数据应可重复执行，避免重复插入导致失败。
- 插入 goal 时必须同时创建对应数量的 `goal_slots`。
- 更新完成进度时要避免出现 completion 已写入但 slot 或 goal 未更新的部分状态。
- 查询 goal detail 时应返回足够渲染 album 的 slots 和 sticker 信息，避免前端拼接不一致状态。

### 验证要求

- 文档改动不强制运行构建。
- 前端或 Worker 代码改动后，至少运行 `pnpm build` 和 `pnpm lint`，除非当前仓库缺少相关脚本或依赖。
- 修改 Wrangler binding 后运行 `pnpm cf-typegen`。
- 添加数据库脚本后验证 migration 和 seed 命令。
- 如果无法运行某项检查，需要在最终回复中说明原因。

### Git 和协作

- 不要自动提交 commit，除非用户明确要求。
- 如果用户要求创建 branch、准备 commit 或提交修改，必须先检查工作区是否包含不能上传的内容，例如私密信息、`.env`、token、密钥、临时文件、构建产物、大文件或与当前任务无关的修改。
- branch 命名和 commit message 必须遵循 `docs/git-rules.md`。
- 不要修改 `.gitignore`、锁文件或配置文件，除非任务需要。
- 如果必须修改锁文件，确保是由包管理器正常生成。
- 最终回复要说明改了哪些文件、是否运行验证、是否有未完成事项。
- 涉及架构升级或架构事实变化时，最终回复要说明 `docs/architecture.md` 是否已同步更新。

## 代码质量

- 优先写小而清晰的组件和 route handler。
- 行为逻辑应尽量靠近所属 feature。
- API contract 和领域数据使用 TypeScript 类型。
- 避免无关重构。
- 没有明确理由，不要引入目标技术栈之外的依赖。
- 保留工作区中的用户改动，不要擅自回滚。
- UI 文案保持简短，并适合中文用户。
