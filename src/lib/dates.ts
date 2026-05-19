/** 把服务端 ISO 日期转成适合贴纸记录展示的日语短日期。 */
export const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
  }).format(new Date(value));
};
