import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

/** 通用内容卡片容器，保留外部传入的 className 和 div 属性。 */
export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[18px] border border-[#eadfcd] bg-[#fffaf1] shadow-[0_14px_30px_rgb(83_61_36_/_9%)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
