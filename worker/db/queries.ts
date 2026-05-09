import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type ApiGoalStatus = "active" | "completed";
export type SlotStatus = "empty" | "filled";

export type Sticker = {
  id: string;
  name: string;
  theme: string | null;
  imageUrl: string;
  rarity: string;
};

export type Completion = {
  id: string;
  userId: string;
  goalId: string;
  slotId: string;
  stickerId: string;
  note: string | null;
  createdAt: string;
  sticker?: Sticker;
};

export type GoalSlot = {
  id: string;
  goalId: string;
  slotIndex: number;
  status: SlotStatus;
  stickerId: string | null;
  completionId: string | null;
  createdAt: string;
  filledAt: string | null;
  sticker: Sticker | null;
  completion: Completion | null;
};

export type Goal = {
  id: string;
  userId: string;
  title: string;
  totalSteps: number;
  completedSteps: number;
  finalReward: string | null;
  theme: string | null;
  status: ApiGoalStatus;
  createdAt: string;
  completedAt: string | null;
  slots?: GoalSlot[];
};

type StickerRow = {
  id: string;
  name: string;
  theme: string | null;
  image_url: string;
  rarity: string;
};

type GoalRow = {
  id: string;
  user_id: string;
  title: string;
  total_steps: number;
  completed_steps: number;
  final_reward: string | null;
  theme: string | null;
  status: string;
  created_at: string;
  completed_at: string | null;
};

type SlotRow = {
  id: string;
  goal_id: string;
  slot_index: number;
  status: string;
  sticker_id: string | null;
  completion_id: string | null;
  created_at: string;
  filled_at: string | null;
  sticker_name: string | null;
  sticker_theme: string | null;
  sticker_image_url: string | null;
  sticker_rarity: string | null;
  completion_note: string | null;
  completion_created_at: string | null;
};

type CompletionRow = {
  id: string;
  user_id: string;
  goal_id: string;
  slot_id: string;
  sticker_id: string;
  note: string | null;
  created_at: string;
  sticker_name: string | null;
  sticker_theme: string | null;
  sticker_image_url: string | null;
  sticker_rarity: string | null;
};

/** 清理可选文本字段，空字符串统一存为 null。 */
const normalizeText = (value: string | undefined | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

/** 将 D1 的 snake_case sticker 行转换成 API 使用的 camelCase 类型。 */
const mapSticker = (row: StickerRow): Sticker => ({
  id: row.id,
  name: row.name,
  theme: row.theme,
  imageUrl: row.image_url,
  rarity: row.rarity,
});

/** 将 goal 表行转换成前端领域模型，并收窄 status 取值。 */
const mapGoal = (row: GoalRow): Goal => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  totalSteps: row.total_steps,
  completedSteps: row.completed_steps,
  finalReward: row.final_reward,
  theme: row.theme,
  status: row.status === "completed" ? "completed" : "active",
  createdAt: row.created_at,
  completedAt: row.completed_at,
});

/** 将 completion 查询结果转换成 API 模型，并携带可选贴纸信息。 */
const mapCompletion = (row: CompletionRow): Completion => ({
  id: row.id,
  userId: row.user_id,
  goalId: row.goal_id,
  slotId: row.slot_id,
  stickerId: row.sticker_id,
  note: row.note,
  createdAt: row.created_at,
  sticker: row.sticker_name
    ? {
        id: row.sticker_id,
        name: row.sticker_name,
        theme: row.sticker_theme,
        imageUrl: row.sticker_image_url ?? "",
        rarity: row.sticker_rarity ?? "normal",
      }
    : undefined,
});

/** 初始化 Drizzle 实例，让 schema 类型和 D1 binding 关联在同一处。 */
const getDrizzleDb = (db: D1Database) => drizzle(db, { schema });

/** 列出内置贴纸，按主题和 id 排序，保证选择器展示稳定。 */
export const listStickers = async (db: D1Database) => {
  // 保留 Drizzle schema 初始化，确保类型和迁移建模继续围绕同一份 schema。
  const _drizzle = getDrizzleDb(db);
  void _drizzle;
  const result = await db
    .prepare("SELECT id, name, theme, image_url, rarity FROM stickers ORDER BY theme, id")
    .all<StickerRow>();
  return result.results.map(mapSticker);
};

/** 创建目标册，并一次性生成该目标需要的全部空槽。 */
export const createGoal = async (
  db: D1Database,
  input: {
    userId: string;
    title: string;
    totalSteps: number;
    finalReward?: string | null;
    theme?: string | null;
  },
) => {
  const now = new Date().toISOString();
  const goalId = crypto.randomUUID();
  // 创建目标册时同时写入用户、目标和固定数量槽位，前端只消费完整贴纸册。
  const statements = [
    db
      .prepare("INSERT OR IGNORE INTO users (id, display_name, created_at) VALUES (?, NULL, ?)")
      .bind(input.userId, now),
    db
      .prepare(
        "INSERT INTO goals (id, user_id, title, total_steps, completed_steps, final_reward, theme, status, created_at) VALUES (?, ?, ?, ?, 0, ?, ?, 'active', ?)",
      )
      .bind(
        goalId,
        input.userId,
        input.title.trim(),
        input.totalSteps,
        normalizeText(input.finalReward),
        normalizeText(input.theme),
        now,
      ),
  ];

  for (let slotIndex = 1; slotIndex <= input.totalSteps; slotIndex += 1) {
    statements.push(
      db
        .prepare("INSERT INTO goal_slots (id, goal_id, slot_index, status, created_at) VALUES (?, ?, ?, 'empty', ?)")
        .bind(crypto.randomUUID(), goalId, slotIndex, now),
    );
  }

  await db.batch(statements);
  const goal = await getGoalDetail(db, goalId, input.userId);
  if (!goal) {
    throw new Error("Created goal could not be loaded");
  }
  return goal;
};

/** 列出用户自己的目标册摘要，用于 dashboard。 */
export const listGoals = async (db: D1Database, userId: string) => {
  const result = await db
    .prepare(
      "SELECT id, user_id, title, total_steps, completed_steps, final_reward, theme, status, created_at, completed_at FROM goals WHERE user_id = ? ORDER BY created_at DESC",
    )
    .bind(userId)
    .all<GoalRow>();
  return result.results.map(mapGoal);
};

/** 查询目标所有者，供 route handler 在读取详情前做权限判断。 */
export const getGoalOwner = async (db: D1Database, goalId: string) => {
  const row = await db.prepare("SELECT user_id FROM goals WHERE id = ?").bind(goalId).first<{ user_id: string }>();
  return row?.user_id ?? null;
};

/** 读取目标册完整详情，包含按 slot_index 排序的槽位状态。 */
export const getGoalDetail = async (db: D1Database, goalId: string, userId: string) => {
  const goalRow = await db
    .prepare(
      "SELECT id, user_id, title, total_steps, completed_steps, final_reward, theme, status, created_at, completed_at FROM goals WHERE id = ? AND user_id = ?",
    )
    .bind(goalId, userId)
    .first<GoalRow>();

  if (!goalRow) {
    return null;
  }

  const slotsResult = await db
    .prepare(
      `SELECT
        s.id,
        s.goal_id,
        s.slot_index,
        s.status,
        s.sticker_id,
        s.completion_id,
        s.created_at,
        s.filled_at,
        st.name AS sticker_name,
        st.theme AS sticker_theme,
        st.image_url AS sticker_image_url,
        st.rarity AS sticker_rarity,
        c.note AS completion_note,
        c.created_at AS completion_created_at
      FROM goal_slots s
      LEFT JOIN stickers st ON st.id = s.sticker_id
      LEFT JOIN completions c ON c.id = s.completion_id
      WHERE s.goal_id = ?
      ORDER BY s.slot_index ASC`,
    )
    .bind(goalId)
    .all<SlotRow>();

  // 详情接口把槽位、贴纸和完成记录组装好，避免前端自行拼接不一致状态。
  const slots = slotsResult.results.map<GoalSlot>((row) => {
    const sticker =
      row.sticker_id && row.sticker_name
        ? {
            id: row.sticker_id,
            name: row.sticker_name,
            theme: row.sticker_theme,
            imageUrl: row.sticker_image_url ?? "",
            rarity: row.sticker_rarity ?? "normal",
          }
        : null;

    return {
      id: row.id,
      goalId: row.goal_id,
      slotIndex: row.slot_index,
      status: row.status === "filled" ? "filled" : "empty",
      stickerId: row.sticker_id,
      completionId: row.completion_id,
      createdAt: row.created_at,
      filledAt: row.filled_at,
      sticker,
      completion: row.completion_id
        ? {
            id: row.completion_id,
            userId,
            goalId,
            slotId: row.id,
            stickerId: row.sticker_id ?? "",
            note: row.completion_note,
            createdAt: row.completion_created_at ?? row.filled_at ?? row.created_at,
            sticker: sticker ?? undefined,
          }
        : null,
    };
  });

  return { ...mapGoal(goalRow), slots };
};

/** 列出某个目标册下当前用户的完成记录。 */
export const listCompletions = async (db: D1Database, goalId: string, userId: string) => {
  const result = await db
    .prepare(
      `SELECT
        c.id,
        c.user_id,
        c.goal_id,
        c.slot_id,
        c.sticker_id,
        c.note,
        c.created_at,
        st.name AS sticker_name,
        st.theme AS sticker_theme,
        st.image_url AS sticker_image_url,
        st.rarity AS sticker_rarity
      FROM completions c
      LEFT JOIN stickers st ON st.id = c.sticker_id
      WHERE c.goal_id = ? AND c.user_id = ?
      ORDER BY c.created_at ASC`,
    )
    .bind(goalId, userId)
    .all<CompletionRow>();
  return result.results.map(mapCompletion);
};

/** 完成目标的一步：校验状态、写入 completion、填充第一个空槽并更新进度。 */
export const completeGoalStep = async (
  db: D1Database,
  input: { goalId: string; userId: string; stickerId: string; note?: string | null },
) => {
  const goal = await getGoalDetail(db, input.goalId, input.userId);
  if (!goal) {
    return { kind: "not_found" as const };
  }
  if (goal.status === "completed") {
    return { kind: "completed" as const };
  }

  // 完成一步始终填第一个空槽，客户端不能指定 slot 或进度。
  const slot = goal.slots?.find((item) => item.status === "empty");
  if (!slot) {
    return { kind: "completed" as const };
  }

  const sticker = await db
    .prepare("SELECT id, name, theme, image_url, rarity FROM stickers WHERE id = ?")
    .bind(input.stickerId)
    .first<StickerRow>();
  if (!sticker) {
    return { kind: "missing_sticker" as const };
  }

  const now = new Date().toISOString();
  const completionId = crypto.randomUUID();
  const nextCompletedSteps = goal.completedSteps + 1;
  const isCompleted = nextCompletedSteps >= goal.totalSteps;

  // D1 batch 将 completion、slot 和 goal 进度放在同一批写入，降低部分更新风险。
  await db.batch([
    db
      .prepare(
        "INSERT INTO completions (id, user_id, goal_id, slot_id, sticker_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(completionId, input.userId, input.goalId, slot.id, input.stickerId, normalizeText(input.note), now),
    db
      .prepare(
        "UPDATE goal_slots SET status = 'filled', sticker_id = ?, completion_id = ?, filled_at = ? WHERE id = ? AND status = 'empty'",
      )
      .bind(input.stickerId, completionId, now, slot.id),
    db
      .prepare("UPDATE goals SET completed_steps = ?, status = ?, completed_at = ? WHERE id = ? AND user_id = ?")
      .bind(
        nextCompletedSteps,
        isCompleted ? "completed" : "active",
        isCompleted ? now : null,
        input.goalId,
        input.userId,
      ),
  ]);

  const updatedGoal = await getGoalDetail(db, input.goalId, input.userId);
  const completion = await db
    .prepare(
      `SELECT
        c.id,
        c.user_id,
        c.goal_id,
        c.slot_id,
        c.sticker_id,
        c.note,
        c.created_at,
        st.name AS sticker_name,
        st.theme AS sticker_theme,
        st.image_url AS sticker_image_url,
        st.rarity AS sticker_rarity
      FROM completions c
      LEFT JOIN stickers st ON st.id = c.sticker_id
      WHERE c.id = ?`,
    )
    .bind(completionId)
    .first<CompletionRow>();

  if (!updatedGoal || !completion) {
    throw new Error("Completion could not be loaded");
  }

  return { kind: "ok" as const, goal: updatedGoal, completion: mapCompletion(completion) };
};
