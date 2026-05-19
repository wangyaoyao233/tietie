import { Hono } from "hono";
import { completeGoalStep, createGoal, getGoalDetail, getGoalOwner, listCompletions, listGoals } from "../db/queries";
import type { WorkerEnv } from "../env";
import { fail, ok } from "./responses";
import { getOptionalString, getString, isUuidLike, readJson } from "./validation";

export const goalRoutes = new Hono<{ Bindings: WorkerEnv }>();

goalRoutes.get("/", async (c) => {
  const userId = getString(c.req.query("userId"));
  if (!isUuidLike(userId)) {
    return fail(c, 400, "invalid_user", "ユーザー情報が無効です");
  }

  try {
    return ok(c, await listGoals(c.env.DB, userId));
  } catch {
    return fail(c, 500, "internal_error", "目標アルバムを読み込めませんでした");
  }
});

goalRoutes.post("/", async (c) => {
  const body = await readJson(c.req.raw);
  if (!body) {
    return fail(c, 400, "invalid_json", "リクエスト内容が無効です");
  }

  const fields = body as Record<string, unknown>;
  const userId = getString(fields.userId);
  const title = getString(fields.title);
  const totalSteps = Number(fields.totalSteps);
  const finalReward = getOptionalString(fields.finalReward);
  const theme = getOptionalString(fields.theme);

  if (!isUuidLike(userId)) {
    return fail(c, 400, "invalid_user", "ユーザー情報が無効です");
  }
  if (!title || title.length > 80) {
    return fail(c, 400, "invalid_title", "タイトルを入力してください");
  }
  if (!Number.isInteger(totalSteps) || totalSteps < 1 || totalSteps > 100) {
    return fail(c, 400, "invalid_total_steps", "ステップ数は1から100の間で入力してください");
  }
  if (finalReward !== undefined && finalReward.length > 120) {
    return fail(c, 400, "invalid_reward", "最後のごほうびは120文字以内で入力してください");
  }
  if (theme !== undefined && theme.length > 40) {
    return fail(c, 400, "invalid_theme", "テーマは40文字以内で入力してください");
  }

  try {
    return ok(c, await createGoal(c.env.DB, { userId, title, totalSteps, finalReward, theme }), 201);
  } catch {
    return fail(c, 500, "internal_error", "目標アルバムを作成できませんでした");
  }
});

goalRoutes.get("/:goalId", async (c) => {
  const goalId = getString(c.req.param("goalId"));
  const userId = getString(c.req.query("userId"));
  if (!isUuidLike(userId)) {
    return fail(c, 400, "invalid_user", "ユーザー情報が無効です");
  }

  try {
    // 详情读取前先区分不存在和无权限，避免把别人的目标数据返回给当前匿名用户。
    const owner = await getGoalOwner(c.env.DB, goalId);
    if (!owner) {
      return fail(c, 404, "not_found", "目標が見つかりません");
    }
    if (owner !== userId) {
      return fail(c, 403, "forbidden", "ほかの人の目標アルバムは表示できません");
    }

    const goal = await getGoalDetail(c.env.DB, goalId, userId);
    return ok(c, goal);
  } catch {
    return fail(c, 500, "internal_error", "目標アルバムを読み込めませんでした");
  }
});

goalRoutes.post("/:goalId/complete", async (c) => {
  const goalId = getString(c.req.param("goalId"));
  const body = await readJson(c.req.raw);
  if (!body) {
    return fail(c, 400, "invalid_json", "リクエスト内容が無効です");
  }

  const fields = body as Record<string, unknown>;
  const userId = getString(fields.userId);
  const stickerId = getString(fields.stickerId);
  const note = getOptionalString(fields.note);

  if (!isUuidLike(userId)) {
    return fail(c, 400, "invalid_user", "ユーザー情報が無効です");
  }
  if (!stickerId) {
    return fail(c, 400, "invalid_sticker", "ステッカーを1枚選んでください");
  }
  if (note !== undefined && note.length > 240) {
    return fail(c, 400, "invalid_note", "メモは240文字以内で入力してください");
  }

  try {
    // completion 是写操作，必须先确认目标属于当前匿名用户。
    const owner = await getGoalOwner(c.env.DB, goalId);
    if (!owner) {
      return fail(c, 404, "not_found", "目標が見つかりません");
    }
    if (owner !== userId) {
      return fail(c, 403, "forbidden", "ほかの人の目標アルバムは変更できません");
    }

    const result = await completeGoalStep(c.env.DB, { goalId, userId, stickerId, note });
    if (result.kind === "completed") {
      return fail(c, 409, "goal_completed", "この目標アルバムはすでに完了しています");
    }
    if (result.kind === "missing_sticker") {
      return fail(c, 404, "sticker_not_found", "ステッカーが見つかりません");
    }
    if (result.kind === "not_found") {
      return fail(c, 404, "not_found", "目標が見つかりません");
    }
    return ok(c, { goal: result.goal, completion: result.completion });
  } catch {
    return fail(c, 500, "internal_error", "この一歩を保存できませんでした");
  }
});

goalRoutes.get("/:goalId/completions", async (c) => {
  const goalId = getString(c.req.param("goalId"));
  const userId = getString(c.req.query("userId"));
  if (!isUuidLike(userId)) {
    return fail(c, 400, "invalid_user", "ユーザー情報が無効です");
  }

  try {
    // 完成记录也按目标所有权隔离，避免通过 goalId 枚举读取他人记录。
    const owner = await getGoalOwner(c.env.DB, goalId);
    if (!owner) {
      return fail(c, 404, "not_found", "目標が見つかりません");
    }
    if (owner !== userId) {
      return fail(c, 403, "forbidden", "ほかの人の目標アルバムは表示できません");
    }

    return ok(c, await listCompletions(c.env.DB, goalId, userId));
  } catch {
    return fail(c, 500, "internal_error", "完了記録を読み込めませんでした");
  }
});
