import { Hono } from "hono";
import { listStickers } from "../db/queries";
import type { WorkerEnv } from "../env";
import { fail, ok } from "./responses";

export const stickerRoutes = new Hono<{ Bindings: WorkerEnv }>();

stickerRoutes.get("/", async (c) => {
  try {
    return ok(c, await listStickers(c.env.DB));
  } catch {
    return fail(c, 500, "internal_error", "ステッカーを読み込めませんでした");
  }
});
