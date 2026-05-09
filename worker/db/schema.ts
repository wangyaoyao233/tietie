import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  displayName: text("display_name"),
  createdAt: text("created_at").notNull(),
});

export const goals = sqliteTable("goals", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  totalSteps: integer("total_steps").notNull(),
  completedSteps: integer("completed_steps").notNull().default(0),
  finalReward: text("final_reward"),
  theme: text("theme"),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").notNull(),
  completedAt: text("completed_at"),
});

export const stickers = sqliteTable("stickers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  theme: text("theme"),
  imageUrl: text("image_url").notNull(),
  rarity: text("rarity").notNull().default("normal"),
  createdAt: text("created_at").notNull(),
});

export const goalSlots = sqliteTable(
  "goal_slots",
  {
    id: text("id").primaryKey(),
    goalId: text("goal_id").notNull(),
    slotIndex: integer("slot_index").notNull(),
    stickerId: text("sticker_id"),
    completionId: text("completion_id"),
    status: text("status").notNull().default("empty"),
    createdAt: text("created_at").notNull(),
    filledAt: text("filled_at"),
  },
  (table) => [uniqueIndex("idx_goal_slots_goal_slot").on(table.goalId, table.slotIndex)],
);

export const completions = sqliteTable("completions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  goalId: text("goal_id").notNull(),
  slotId: text("slot_id").notNull(),
  stickerId: text("sticker_id").notNull(),
  note: text("note"),
  createdAt: text("created_at").notNull(),
});

export const rewards = sqliteTable("rewards", {
  id: text("id").primaryKey(),
  goalId: text("goal_id").notNull(),
  title: text("title").notNull(),
  triggerStep: integer("trigger_step").notNull(),
  isClaimed: integer("is_claimed").notNull().default(0),
  claimedAt: text("claimed_at"),
  createdAt: text("created_at").notNull(),
});
