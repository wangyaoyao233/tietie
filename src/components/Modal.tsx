import type { ReactNode } from "react";
import { Button } from "./Button";

type ModalProps = {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

/** 底部弹层容器，用于完成一步和查看贴纸记录等移动端流程。 */
export function Modal({ title, open, onClose, children }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-40 grid items-end bg-[rgb(42_34_25_/_42%)] p-3 min-[700px]:items-center"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="mx-auto max-h-[min(86svh,760px)] w-[min(100%,680px)] overflow-auto rounded-3xl bg-[#fffaf1] p-[18px] shadow-[0_30px_80px_rgb(41_30_20_/_26%)]"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="mb-3.5 flex items-center justify-between gap-3">
          <h2 className="text-xl leading-[1.22] text-[#241e18]">{title}</h2>
          <Button
            type="button"
            variant="ghost"
            className="size-[42px] min-h-[42px] p-0 text-2xl"
            onClick={onClose}
            aria-label="閉じる"
          >
            ×
          </Button>
        </header>
        {children}
      </section>
    </div>
  );
}
