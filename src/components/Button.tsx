import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
};

/** 项目通用按钮组件，统一处理按钮样式变体和原生 button 属性。 */
export function Button({ className, variant = "primary", children, ...props }: ButtonProps) {
  const variants = {
    primary: "bg-[#df6d43] text-white shadow-[0_10px_20px_rgb(198_81_44_/_20%)]",
    secondary: "bg-[#f4e7d0] text-[#4e3a24]",
    ghost: "bg-transparent text-[#6c5742]",
  };

  return (
    <button
      className={cn(
        "inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full border-0 px-[18px] font-extrabold transition-[transform,box-shadow,opacity] duration-150 hover:not-disabled:-translate-y-px disabled:opacity-55",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
