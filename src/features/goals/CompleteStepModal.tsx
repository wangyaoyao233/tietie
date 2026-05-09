import { useState } from "react";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { StickerPicker } from "../stickers/StickerPicker";
import type { Sticker } from "../stickers/stickerTypes";

type CompleteStepModalProps = {
  open: boolean;
  stickers: Sticker[];
  submitting: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (input: { stickerId: string; note: string }) => void;
};

const fieldClass = "grid gap-2 font-extrabold text-[#5a4d3e]";
const inputClass =
  "w-full resize-y rounded-[14px] border border-[#d8c8ae] bg-[#fffdf8] px-3.5 py-[13px] text-[#302a24] outline-none focus:border-[#df6d43] focus:shadow-[0_0_0_3px_rgb(223_109_67_/_14%)]";
const formErrorClass = "rounded-[14px] bg-[#ffe8df] px-3.5 py-3 text-[#8f2d20]";

/** 完成一步弹层，收集本次贴纸选择和可选记录。 */
export function CompleteStepModal({ open, stickers, submitting, error, onClose, onSubmit }: CompleteStepModalProps) {
  const [selectedStickerId, setSelectedStickerId] = useState("");
  const [note, setNote] = useState("");

  return (
    <Modal title="完成一步" open={open} onClose={submitting ? () => undefined : onClose}>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({ stickerId: selectedStickerId, note });
        }}
      >
        <StickerPicker stickers={stickers} selectedStickerId={selectedStickerId} onSelect={setSelectedStickerId} />
        <label className={fieldClass}>
          <span>写一句记录</span>
          <textarea
            className={inputClass}
            value={note}
            maxLength={240}
            rows={3}
            onChange={(event) => setNote(event.target.value)}
            placeholder="今天的小进度被收起来了"
          />
        </label>
        {error ? <p className={formErrorClass}>{error}</p> : null}
        <div className="grid grid-cols-2 gap-2.5">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            取消
          </Button>
          <Button type="submit" disabled={submitting || !selectedStickerId}>
            {submitting ? "保存中" : "贴上一张"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
