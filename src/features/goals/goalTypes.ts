import type { Sticker } from "../stickers/stickerTypes";

export type GoalStatus = "active" | "completed";
export type SlotStatus = "empty" | "filled";

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
  status: GoalStatus;
  createdAt: string;
  completedAt: string | null;
  slots?: GoalSlot[];
};

export type CreateGoalInput = {
  userId: string;
  title: string;
  totalSteps: number;
  finalReward?: string;
  theme?: string;
};
