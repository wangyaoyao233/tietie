import { Hono } from "hono";
import { completeGoalStep, createGoal, getGoalDetail, getGoalOwner, listCompletions, listGoals } from "../db/queries";
import type { WorkerEnv } from "../env";
import { fail, ok } from "./responses";
import { getOptionalString, getString, isUuidLike, readJson } from "./validation";

export const goalRoutes = new Hono<{ Bindings: WorkerEnv }>();

goalRoutes.get("/", async (c) => {
  const userId = getString(c.req.query("userId"));
  if (!isUuidLike(userId)) {
    return fail(c, 400, "invalid_user", "用户信息无效");
  }

  try {
    return ok(c, await listGoals(c.env.DB, userId));
  } catch {
    return fail(c, 500, "internal_error", "目标册暂时无法加载");
  }
});

goalRoutes.post("/", async (c) => {
  const body = await readJson(c.req.raw);
  if (!body) {
    return fail(c, 400, "invalid_json", "请求内容无效");
  }

  const fields = body as Record<string, unknown>;
  const userId = getString(fields.userId);
  const title = getString(fields.title);
  const totalSteps = Number(fields.totalSteps);
  const finalReward = getOptionalString(fields.finalReward);
  const theme = getOptionalString(fields.theme);

  if (!isUuidLike(userId)) {
    return fail(c, 400, "invalid_user", "用户信息无效");
  }
  if (!title || title.length > 80) {
    return fail(c, 400, "invalid_title", "标题不能为空");
  }
  if (!Number.isInteger(totalSteps) || totalSteps < 1 || totalSteps > 100) {
    return fail(c, 400, "invalid_total_steps", "步数需要在 1 到 100 之间");
  }
  if (finalReward !== undefined && finalReward.length > 120) {
    return fail(c, 400, "invalid_reward", "最终奖励最多 120 个字");
  }
  if (theme !== undefined && theme.length > 40) {
    return fail(c, 400, "invalid_theme", "主题最多 40 个字");
  }

  try {
    return ok(c, await createGoal(c.env.DB, { userId, title, totalSteps, finalReward, theme }), 201);
  } catch {
    return fail(c, 500, "internal_error", "目标册暂时无法创建");
  }
});

goalRoutes.get("/:goalId", async (c) => {
  const goalId = getString(c.req.param("goalId"));
  const userId = getString(c.req.query("userId"));
  if (!isUuidLike(userId)) {
    return fail(c, 400, "invalid_user", "用户信息无效");
  }

  try {
    // 详情读取前先区分不存在和无权限，避免把别人的目标数据返回给当前匿名用户。
    const owner = await getGoalOwner(c.env.DB, goalId);
    if (!owner) {
      return fail(c, 404, "not_found", "目标不存在");
    }
    if (owner !== userId) {
      return fail(c, 403, "forbidden", "不能查看别人的目标册");
    }

    const goal = await getGoalDetail(c.env.DB, goalId, userId);
    return ok(c, goal);
  } catch {
    return fail(c, 500, "internal_error", "目标册暂时无法加载");
  }
});

goalRoutes.post("/:goalId/complete", async (c) => {
  const goalId = getString(c.req.param("goalId"));
  const body = await readJson(c.req.raw);
  if (!body) {
    return fail(c, 400, "invalid_json", "请求内容无效");
  }

  const fields = body as Record<string, unknown>;
  const userId = getString(fields.userId);
  const stickerId = getString(fields.stickerId);
  const note = getOptionalString(fields.note);

  if (!isUuidLike(userId)) {
    return fail(c, 400, "invalid_user", "用户信息无效");
  }
  if (!stickerId) {
    return fail(c, 400, "invalid_sticker", "请选择一张贴纸");
  }
  if (note !== undefined && note.length > 240) {
    return fail(c, 400, "invalid_note", "记录最多 240 个字");
  }

  try {
    // completion 是写操作，必须先确认目标属于当前匿名用户。
    const owner = await getGoalOwner(c.env.DB, goalId);
    if (!owner) {
      return fail(c, 404, "not_found", "目标不存在");
    }
    if (owner !== userId) {
      return fail(c, 403, "forbidden", "不能修改别人的目标册");
    }

    const result = await completeGoalStep(c.env.DB, { goalId, userId, stickerId, note });
    if (result.kind === "completed") {
      return fail(c, 409, "goal_completed", "这本目标册已经完成了");
    }
    if (result.kind === "missing_sticker") {
      return fail(c, 404, "sticker_not_found", "贴纸不存在");
    }
    if (result.kind === "not_found") {
      return fail(c, 404, "not_found", "目标不存在");
    }
    return ok(c, { goal: result.goal, completion: result.completion });
  } catch {
    return fail(c, 500, "internal_error", "这一步暂时无法保存");
  }
});

goalRoutes.get("/:goalId/completions", async (c) => {
  const goalId = getString(c.req.param("goalId"));
  const userId = getString(c.req.query("userId"));
  if (!isUuidLike(userId)) {
    return fail(c, 400, "invalid_user", "用户信息无效");
  }

  try {
    // 完成记录也按目标所有权隔离，避免通过 goalId 枚举读取他人记录。
    const owner = await getGoalOwner(c.env.DB, goalId);
    if (!owner) {
      return fail(c, 404, "not_found", "目标不存在");
    }
    if (owner !== userId) {
      return fail(c, 403, "forbidden", "不能查看别人的目标册");
    }

    return ok(c, await listCompletions(c.env.DB, goalId, userId));
  } catch {
    return fail(c, 500, "internal_error", "完成记录暂时无法加载");
  }
});
