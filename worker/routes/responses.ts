import type { Context } from "hono";

/** 返回统一成功响应，避免各个 handler 重复拼装 ok/data。 */
export const ok = <T>(c: Context, data: T, status: 200 | 201 = 200) => c.json({ ok: true as const, data }, status);

/** 返回统一错误响应，确保错误 code 和日语 message 结构一致。 */
export const fail = (c: Context, status: 400 | 403 | 404 | 409 | 500, code: string, message: string) =>
  c.json({ ok: false as const, error: { code, message } }, status);
