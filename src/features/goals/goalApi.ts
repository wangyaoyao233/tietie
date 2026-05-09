import { apiGet, apiPost } from "../../lib/apiClient";
import type { Completion, CreateGoalInput, Goal } from "./goalTypes";

/** 读取当前匿名用户拥有的全部目标册。 */
export const fetchGoals = (userId: string) => apiGet<Goal[]>(`/api/goals?userId=${encodeURIComponent(userId)}`);

/** 创建一本目标册，服务端会同时生成固定数量的空槽。 */
export const createGoalAlbum = (input: CreateGoalInput) => apiPost<Goal>("/api/goals", input);

/** 读取目标册详情，包括槽位、贴纸和完成记录。 */
export const fetchGoal = (goalId: string, userId: string) =>
  apiGet<Goal>(`/api/goals/${encodeURIComponent(goalId)}?userId=${encodeURIComponent(userId)}`);

/** 提交一次完成记录，由服务端把贴纸贴到下一个空槽。 */
export const completeGoalStep = (goalId: string, input: { userId: string; stickerId: string; note?: string }) =>
  apiPost<{ goal: Goal; completion: Completion }>(`/api/goals/${encodeURIComponent(goalId)}/complete`, input);

/** 读取目标册的历史完成记录，供后续记录列表或详情使用。 */
export const fetchCompletions = (goalId: string, userId: string) =>
  apiGet<Completion[]>(`/api/goals/${encodeURIComponent(goalId)}/completions?userId=${encodeURIComponent(userId)}`);
