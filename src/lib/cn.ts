/** 合并 CSS class，过滤掉条件渲染时产生的空值和 false。 */
export const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");
