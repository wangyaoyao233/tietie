# Sticker Goals 架构文档

本文档记录 Sticker Goals MVP 的当前架构。后续如果目录结构、运行时、数据模型、API contract、Cloudflare binding、数据库脚本或前端路由发生变化，需要同步更新本文档。

## 1. 架构概览

Sticker Goals 是一个移动优先的单页 Web 应用，当前采用 Cloudflare Workers + Vite + React + TypeScript 的一体化结构：

- 前端由 Vite 构建，入口为 `src/main.tsx`，应用主体在 `src/app/App.tsx`。
- 客户端路由由 `src/app/router.tsx` 基于 History API 实现，当前没有引入 React Router。
- Worker 入口为 `worker/index.ts`，使用 Hono 挂载 `/api` 下的 JSON API。
- 数据持久化使用 Cloudflare D1，schema 定义在 `worker/db/schema.ts`，数据库访问集中在 `worker/db/queries.ts`。
- Drizzle 用于 schema 建模和 migration 生成；当前查询实现主要使用 D1 `prepare` / `batch`，避免把 SQL 分散到 route handler。
- 内置贴纸资源使用 `public/stickers/` 下的 SVG 文件，MVP 不实现上传。
- R2 binding 已预留为 `STICKER_ASSETS`，用于未来贴纸资源存储。

目标是先跑通“创建目标册 -> 查看贴纸册 -> 完成一步 -> 贴纸落入下一个空槽 -> D1 持久化”的核心闭环。

## 2. 前端架构

当前前端目录按应用层、共享组件、业务 feature 和通用 lib 分层：

```txt
src/
  main.tsx
  index.css
  app/
    App.tsx
    router.tsx
  components/
    Button.tsx
    Card.tsx
    EmptyState.tsx
    Modal.tsx
    ProgressBar.tsx
  features/
    goals/
      GoalAlbumGrid.tsx
      GoalAlbumPage.tsx
      GoalCard.tsx
      GoalForm.tsx
      GoalSlot.tsx
      CompleteStepModal.tsx
      CompletionDetailModal.tsx
      CompletedGoalPanel.tsx
      goalApi.ts
      goalTypes.ts
    stickers/
      StickerImage.tsx
      StickerPicker.tsx
      stickerApi.ts
      stickerTypes.ts
    user/
      anonymousUser.ts
  lib/
    apiClient.ts
    cn.ts
    dates.ts
```

前端样式统一使用 Tailwind CSS utility class 写在组件 `className` 中。`src/index.css` 只作为 Tailwind v4 入口，并保留字体、页面最小尺寸、根节点高度等必要全局 base 样式；组件级样式不再放入独立原生 CSS 文件。

### 2.1 路由

客户端路由在 `src/app/router.tsx` 中解析：

- `/`：landing page。
- `/dashboard`：目标册列表。
- `/goals/new`：创建目标册。
- `/goals/:goalId`：目标册详情。

路由切换通过 `navigateTo(path)` 调用 `history.pushState`，并派发 `popstate` 触发 React 状态更新。

### 2.2 数据访问

前端通过 `src/lib/apiClient.ts` 访问 API：

- `apiGet<T>(path)`
- `apiPost<T>(path, body)`

API client 只接受统一响应结构：

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

业务 API 封装放在 feature 内：

- `src/features/goals/goalApi.ts`
- `src/features/stickers/stickerApi.ts`

### 2.3 匿名用户

v1 不实现完整登录。匿名用户 ID 由 `src/features/user/anonymousUser.ts` 管理，首次访问生成 UUID，并存入 localStorage：

```ts
const USER_ID_STORAGE_KEY = "sticker_goals_user_id";
```

前端请求目标相关接口时必须携带该 user id。服务端在读取或修改目标前校验目标所有权。

## 3. Worker 与 API 架构

Worker 入口为 `worker/index.ts`：

```txt
worker/
  index.ts
  env.ts
  routes/
    health.ts
    goals.ts
    stickers.ts
    responses.ts
    validation.ts
  db/
    schema.ts
    queries.ts
```

Hono app 使用 `/api` 作为 base path，并挂载：

- `/api/health`
- `/api/stickers`
- `/api/goals`

Route handler 负责：

- 读取 query params / request body。
- 做 API 边界校验。
- 调用 `worker/db/queries.ts`。
- 返回统一 `{ ok, data }` 或 `{ ok, error }` JSON。

数据库读取和写入逻辑应保留在 `worker/db/queries.ts` 或后续同层 query helper 中，避免 raw SQL 分散到 handler。

## 4. API Contract

当前 MVP API：

- `GET /api/health`
- `GET /api/stickers`
- `GET /api/goals?userId=:userId`
- `POST /api/goals`
- `GET /api/goals/:goalId?userId=:userId`
- `POST /api/goals/:goalId/complete`
- `GET /api/goals/:goalId/completions?userId=:userId`

所有 API 必须返回 JSON，并使用统一结构：

- 成功：`{ ok: true, data }`
- 失败：`{ ok: false, error: { code, message } }`

约定状态码：

- `400`：请求参数或请求体校验失败。
- `403`：匿名用户不拥有该目标。
- `404`：目标或贴纸不存在。
- `409`：目标已完成，不能继续 completion。
- `500`：未预期错误。

## 5. 数据架构

D1 schema 定义在 `worker/db/schema.ts`，migration 位于 `migrations/`。

当前表：

- `users`：匿名用户。
- `goals`：目标册主表。
- `goal_slots`：目标册槽位，每个 goal 必须有 `total_steps` 个 slot。
- `stickers`：内置贴纸。
- `completions`：一次完成记录。
- `rewards`：未来奖励功能预留表。

核心一致性规则：

- 一个目标只属于一个 `user_id`。
- 创建目标时同时创建对应数量的 `goal_slots`。
- 完成一步时，服务端查找按 `slot_index` 排序的第一个空槽。
- 客户端不能指定 slot、进度或 goal status。
- 填充槽位时写入 completion，并更新 slot 和 goal progress。
- 已完成目标不能继续新增 completion。
- 查询 goal detail 时返回 slots、sticker 和 completion 信息，保证前端以服务端状态为准。

当前 `completeGoalStep` 使用 D1 `batch` 依次写入 completion、更新 slot、更新 goal。后续如果升级为更强事务语义，需要同步更新本文档。

## 6. 贴纸资源

MVP 使用内置 SVG 贴纸：

- 文件目录：`public/stickers/`
- 种子数据：`migrations/0001_seed_stickers.sql`
- 主题：`study`、`fitness`、`reading`、`money`、`daily`、`cute`

R2 binding `STICKER_ASSETS` 仅预留，不阻塞 MVP。当前不实现上传、用户生成贴纸市场或远程资源管理流程。

## 7. 配置与脚本

主要配置：

- `.github/workflows/ci.yml`：pull request 到 `main` 时运行 lint 和 build。
- `.github/workflows/deploy.yml`：`main` 更新后运行 lint、build，并通过 Wrangler 自动部署到 Cloudflare。
- `vite.config.ts`：Vite 与 Cloudflare/Vite plugin 配置。
- `wrangler.jsonc`：Worker、assets、D1、R2 与 compatibility 配置。
- `drizzle.config.ts`：Drizzle schema 与 migration 输出配置。
- `tsconfig*.json`：前端、Node 工具与 Worker TypeScript 配置。
- `worker-configuration.d.ts`：Wrangler 生成的 Worker 环境类型。

当前常用脚本：

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

修改 Wrangler binding 后需要运行 `pnpm cf-typegen`。修改 schema 后需要配套 migration，并验证本地 D1 migration 和 seed 逻辑。

## 8. 架构变更维护规则

以下变化必须同步更新本文档：

- 新增、删除或重命名前端主目录、feature、共享组件层或路由层。
- 客户端路由方案变化，例如引入 React Router。
- API path、请求字段、响应结构或错误码变化。
- Worker route/module 分层变化。
- 数据库表、字段、索引、migration 或 seed 机制变化。
- D1、R2、assets、compatibility flag 等 Cloudflare binding/config 变化。
- 匿名用户身份策略变化。
- 新增依赖会改变运行时架构或部署方式。
- 新增脚本改变开发、数据库或部署流程。

`AGENTS.md` 记录协作规则和高层约束；本文档记录实际架构。两者冲突时，应先修正文档，使它们与当前代码和产品目标保持一致。
