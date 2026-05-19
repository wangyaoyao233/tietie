import { Modal } from "../../components/Modal";
import { formatDate } from "../../lib/dates";
import { getStickerDisplayName } from "../stickers/stickerDisplayName";
import { StickerImage } from "../stickers/StickerImage";
import type { GoalSlot } from "./goalTypes";

type CompletionDetailModalProps = {
  slot: GoalSlot | null;
  onClose: () => void;
};

const eyebrowClass = "text-[0.78rem] font-extrabold tracking-normal text-[#a66235] uppercase";
const noteBoxClass = "rounded-2xl bg-[#f7ead5] p-3.5 leading-[1.6]";

/** 展示已填槽位的贴纸、日期和用户记录。 */
export function CompletionDetailModal({ slot, onClose }: CompletionDetailModalProps) {
  const completion = slot?.completion;
  const sticker = slot?.sticker;

  return (
    <Modal title="このステッカーの記録" open={Boolean(slot && completion && sticker)} onClose={onClose}>
      {slot && completion && sticker ? (
        <div className="grid gap-3.5">
          <StickerImage sticker={sticker} size="detail" />
          <div>
            <p className={eyebrowClass}>{slot.slotIndex} マス目</p>
            <h3 className="text-base tracking-normal text-[#241e18]">{getStickerDisplayName(sticker)}</h3>
            <p className="text-[#817365]">{formatDate(completion.createdAt)}</p>
          </div>
          {completion.note ? (
            <p className={noteBoxClass}>{completion.note}</p>
          ) : (
            <p className={`${noteBoxClass} text-[#817365]`}>この一歩にはメモがありません。</p>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
