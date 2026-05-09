import { Hono } from "hono";
import type { WorkerEnv } from "./env";
import { goalRoutes } from "./routes/goals";
import { healthRoutes } from "./routes/health";
import { stickerRoutes } from "./routes/stickers";

const app = new Hono<{ Bindings: WorkerEnv }>().basePath("/api");

app.route("/health", healthRoutes);
app.route("/stickers", stickerRoutes);
app.route("/goals", goalRoutes);

app.notFound((c) =>
  c.json(
    {
      ok: false as const,
      error: {
        code: "not_found",
        message: "接口不存在",
      },
    },
    404,
  ),
);

export default app satisfies ExportedHandler<WorkerEnv>;
