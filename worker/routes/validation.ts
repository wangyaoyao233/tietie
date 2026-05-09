/** 安全读取 JSON 对象请求体，失败时返回 null 交给 handler 处理。 */
export const readJson = async (request: Request) => {
  try {
    // API handler 只接受对象请求体，数组、字符串和损坏 JSON 都按校验失败处理。
    const value: unknown = await request.json();
    return value && typeof value === "object" ? value : null;
  } catch {
    return null;
  }
};

/** 从未知输入中取出去空格后的字符串，非字符串按空值处理。 */
export const getString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

/** 读取可选字符串字段，保留 undefined 用来区分未传和传空字符串。 */
export const getOptionalString = (value: unknown) => {
  if (value === undefined || value === null) {
    return undefined;
  }
  return typeof value === "string" ? value.trim() : "";
};

/** 对匿名用户 ID 做宽松校验，避免把空值或明显异常值传入查询。 */
export const isUuidLike = (value: string) => value.length >= 8 && value.length <= 80;
