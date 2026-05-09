export const USER_ID_STORAGE_KEY = "sticker_goals_user_id";

/** 获取或创建匿名用户 ID，作为本地 MVP 的用户身份。 */
export const getAnonymousUserId = () => {
  // v1 没有登录系统，用本地 UUID 作为 API 侧目标和完成记录的隔离键。
  const existing = localStorage.getItem(USER_ID_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const nextId = crypto.randomUUID();
  localStorage.setItem(USER_ID_STORAGE_KEY, nextId);
  return nextId;
};
