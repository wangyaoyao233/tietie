import { Hono } from "hono";
import type { WorkerEnv } from "../env";
import { ok } from "./responses";

export const healthRoutes = new Hono<{ Bindings: WorkerEnv }>();

healthRoutes.get("/", (c) => ok(c, { status: "ok" }));
