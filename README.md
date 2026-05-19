# Sticker Goals

Sticker Goals 是一个移动优先的目标贴纸册原型。用户把一个目标创建成一本贴纸收集册，每完成一个小步骤，就选择一张贴纸、写一句可选记录，并把贴纸贴到下一个空槽里。

MVP 要验证的核心问题是：用户贴上第一张贴纸之后，是否还想继续把这本册子贴满？

## 当前状态

项目当前已经接入：

- React + Vite + TypeScript 前端。
- Tailwind CSS 样式。
- Cloudflare Workers 运行时。
- Hono API 路由，统一挂载在 `/api` 下。
- Cloudflare D1 数据库。
- Drizzle schema 与 migration 配置。
- 内置 SVG 贴纸资源和种子数据。
- 预留 R2 binding `STICKER_ASSETS`，MVP 不实现上传。

## 技术栈

- React
- Vite
- TypeScript
- Tailwind CSS
- Framer Motion
- Cloudflare Workers
- Hono
- Cloudflare D1
- Drizzle ORM
- Wrangler
- pnpm

## 核心产品闭环

1. 用户创建目标册。
2. 系统按总步数创建固定数量的空槽。
3. 用户进入目标册详情页。
4. 用户点击“完成一步”。
5. 用户选择一张贴纸，并可选写一句记录。
6. 服务端把贴纸贴到按 `slot_index` 排序的第一个空槽。
7. D1 保存 completion、slot 状态和 goal 进度。
8. 所有槽位填满后，目标册进入完成状态。

v1 不实现完整登录。首次访问会生成匿名 UUID，存入 `localStorage` 的 `sticker_goals_user_id`，目标和完成记录都按这个 user id 隔离。

## 目录结构

```txt
src/
  main.tsx
  index.css
  app/
    App.tsx
    router.tsx
  components/
  features/
    goals/
    stickers/
    user/
  lib/

worker/
  index.ts
  env.ts
  routes/
  db/

migrations/
public/stickers/
docs/
```

更多架构细节见 `docs/architecture.md`。

## API

所有 API 路由位于 `/api` 下，并返回统一 JSON 结构：

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

当前 MVP API：

- `GET /api/health`
- `GET /api/stickers`
- `GET /api/goals?userId=:userId`
- `POST /api/goals`
- `GET /api/goals/:goalId?userId=:userId`
- `POST /api/goals/:goalId/complete`
- `GET /api/goals/:goalId/completions?userId=:userId`

## 本地开发

安装依赖：

```bash
pnpm install
```

启动开发服务器：

```bash
pnpm dev
```

常用检查：

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
```

格式化代码：

```bash
pnpm format
```

## 数据库

Drizzle schema 位于 `worker/db/schema.ts`，migration 输出目录为 `migrations/`。

生成 migration：

```bash
pnpm db:generate
```

应用本地 D1 migration：

```bash
pnpm db:migrate
```

写入内置贴纸种子数据：

```bash
pnpm db:seed
```

## Cloudflare 配置

主要配置位于 `wrangler.jsonc`：

- Worker name: `tietie`
- Worker entry: `worker/index.ts`
- D1 binding: `DB`
- R2 binding: `STICKER_ASSETS`
- Static assets: SPA fallback

修改 binding 后需要同步生成 Worker 环境类型：

```bash
pnpm cf-typegen
```

部署：

```bash
pnpm run deploy
```

## 文档

- `docs/project-goal.md`：产品目标、MVP 范围和验收标准。
- `docs/architecture.md`：当前架构、数据模型、API、配置和维护规则。
- `docs/deploy.md`：部署到 Cloudflare 的操作流程。
- `AGENTS.md`：Agent 协作规范、实现约束和项目规则。

当 README、产品文档、架构文档、Agent 规则或其他说明文档涉及同一事实时，修改时需要同步检查并保持一致。
