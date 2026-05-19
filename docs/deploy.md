# Cloudflare 部署流程

本文档记录 Sticker Goals 部署到 Cloudflare 的操作流程。当前项目使用 Cloudflare Workers 托管 Worker API 和 Vite 静态资源，使用 D1 保存数据，并预留 R2 bucket `STICKER_ASSETS`。

## 1. 前置条件

本地需要准备：

- Node.js 和 pnpm。
- Cloudflare 账号。
- 已安装项目依赖：

```bash
pnpm install
```

- 已登录 Wrangler：

```bash
pnpm exec wrangler login
```

确认 Wrangler 能访问账号：

```bash
pnpm exec wrangler whoami
```

## 2. 检查 Cloudflare 配置

主要部署配置在 `wrangler.jsonc`：

- Worker name: `tietie`
- Worker entry: `worker/index.ts`
- Static assets: SPA fallback
- D1 binding: `DB`
- R2 binding: `STICKER_ASSETS`

首次部署到真实 Cloudflare 环境前，需要把 D1 的 `database_id` 从本地占位值替换成 Cloudflare 创建出的真实 ID。

## 3. 创建生产 D1 数据库

创建 D1 数据库：

```bash
pnpm exec wrangler d1 create sticker-goals
```

命令会输出类似配置片段：

```jsonc
{
  "binding": "DB",
  "database_name": "sticker-goals",
  "database_id": "<cloudflare-d1-database-id>",
}
```

把输出中的 `database_name` 和 `database_id` 写入 `wrangler.jsonc` 的 `d1_databases` 配置，并保持 binding 名称为 `DB`。

如果修改了 binding 或配置字段，重新生成 Worker 环境类型：

```bash
pnpm cf-typegen
```

## 4. 创建 R2 bucket

MVP 当前不实现贴纸上传，但 `wrangler.jsonc` 已预留 R2 binding `STICKER_ASSETS`。如果 Cloudflare 账号中还没有对应 bucket，创建它：

```bash
pnpm exec wrangler r2 bucket create sticker-goals-assets
```

保持 `wrangler.jsonc` 中的配置：

```jsonc
{
  "binding": "STICKER_ASSETS",
  "bucket_name": "sticker-goals-assets",
}
```

## 5. 本地验证

部署前先运行检查：

```bash
pnpm lint
pnpm build
```

如果本地数据库需要重新准备，可以应用本地 migration 和贴纸种子数据：

```bash
pnpm db:migrate
pnpm db:seed
```

## 6. 首次初始化远程 D1

第一次创建生产 D1 后，远程数据库是空的。部署前必须先把表结构和内置贴纸数据写入远程 D1，否则线上 API 会因为缺表或缺少贴纸数据而不能正常工作。

先应用所有远程 migration：

```bash
pnpm exec wrangler d1 migrations apply DB --remote
```

当前 migration 包含：

- `0000_initial.sql`：创建 `users`、`goals`、`goal_slots`、`stickers`、`completions`、`rewards` 等表。
- `0001_seed_stickers.sql`：写入 MVP 内置贴纸数据。

`wrangler d1 migrations apply DB --remote` 首次执行时会按顺序应用以上 migration。为了确认贴纸 seed 已经写入，也可以在首次初始化后单独重复执行一次 seed 文件：

```bash
pnpm exec wrangler d1 execute DB --remote --file=./migrations/0001_seed_stickers.sql
```

该 seed 使用 `INSERT OR IGNORE`，重复执行不会因为同一贴纸 ID 已存在而失败。

初始化完成后，建议查询远程 D1 确认贴纸数量：

```bash
pnpm exec wrangler d1 execute DB --remote --command="SELECT COUNT(*) AS count FROM stickers;"
```

预期 `count` 至少为 `24`。

## 7. 部署 Worker 和前端资源

执行部署：

```bash
pnpm run deploy
```

该脚本会先执行 `pnpm run build`，再执行 `wrangler deploy`。部署成功后，Wrangler 会输出 Worker 的访问地址。

## 8. 部署后验证

部署完成后检查健康接口：

```bash
curl https://<your-worker-domain>/api/health
```

预期返回统一 JSON 成功结构：

```json
{
  "ok": true,
  "data": {
    "status": "ok"
  }
}
```

再用浏览器打开 Worker 地址，完成以下手动检查：

1. 进入 `/dashboard`。
2. 创建一个目标册。
3. 进入目标详情页。
4. 点击“完成一步”。
5. 选择贴纸并提交。
6. 确认贴纸出现在下一个空槽，刷新页面后状态仍保留。

## 9. 后续更新流程

常规代码更新：

```bash
pnpm lint
pnpm build
pnpm run deploy
```

如果修改了数据库 schema：

```bash
pnpm db:generate
pnpm exec wrangler d1 migrations apply DB --remote
pnpm run deploy
```

如果修改了 Wrangler binding：

```bash
pnpm cf-typegen
pnpm lint
pnpm build
pnpm run deploy
```

## 10. 注意事项

- 不要把 `.env`、token、账号密钥或临时文件提交到仓库。
- 生产 D1 数据库的 `database_id` 必须使用 Cloudflare 返回的真实 ID。
- API 必须继续挂载在 `/api` 下，并保持统一响应结构。
- 匿名用户 ID 存在浏览器 localStorage 中，换浏览器或清理站点数据后会生成新的匿名用户。
- R2 当前只是预留绑定，MVP 贴纸仍来自 `public/stickers/`。
