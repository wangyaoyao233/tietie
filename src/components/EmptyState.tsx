import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  body: string;
  action?: ReactNode;
};

/** 展示空列表或加载失败后的轻量提示，并可附带一个操作入口。 */
export function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <div className="grid justify-items-center gap-3 px-5 py-[34px] text-center text-[#756758]">
      <div className="grid size-[58px] place-items-center rounded-[18px] bg-[#f7dfb1] text-[1.4rem] text-[#ab6a3c]">
        ✦
      </div>
      <h2 className="text-xl leading-[1.22] text-[#241e18]">{title}</h2>
      <p>{body}</p>
      {action}
    </div>
  );
}
