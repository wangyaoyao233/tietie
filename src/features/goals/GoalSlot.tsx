import { motion } from "framer-motion";
import { cn } from "../../lib/cn";
import { StickerImage } from "../stickers/StickerImage";
import type { GoalSlot as GoalSlotType } from "./goalTypes";

type GoalSlotProps = {
  slot: GoalSlotType;
  isNext: boolean;
  recentlyFilledSlotId: string | null;
  onInspect: (slot: GoalSlotType) => void;
};

/** 单个贴纸槽位：空槽只展示占位，已填槽可点击查看完成记录。 */
export function GoalSlot({ slot, isNext, recentlyFilledSlotId, onInspect }: GoalSlotProps) {
  const sticker = slot.status === "filled" ? slot.sticker : null;
  const slotClass = "aspect-square min-w-0";
  const slotSurfaceClass = "relative grid size-full place-items-center rounded-2xl";
  const slotIndexClass = "absolute right-2 bottom-1.5 text-[0.72rem] font-extrabold text-[#ab9272]";
  const content = sticker ? (
    <button
      className={cn(
        slotSurfaceClass,
        "border border-[#f1d590] bg-[#fff7df] shadow-[inset_0_-8px_16px_rgb(255_211_129_/_30%)]",
      )}
      type="button"
      onClick={() => onInspect(slot)}
      aria-label={`查看第 ${slot.slotIndex} 格`}
    >
      <StickerImage sticker={sticker} size="large" />
      <span className={slotIndexClass}>{slot.slotIndex}</span>
    </button>
  ) : (
    <div
      className={cn(
        slotSurfaceClass,
        "border border-dashed border-[#d8c8ae] bg-[repeating-linear-gradient(135deg,#fffdf8,#fffdf8_8px,#fbf2e3_8px,#fbf2e3_16px)] text-[#b3a18a]",
        isNext && "border-[#df6d43] bg-[#fff0d2] shadow-[0_0_0_4px_rgb(223_109_67_/_10%)]",
      )}
      aria-disabled="true"
    >
      <span className={slotIndexClass}>{slot.slotIndex}</span>
    </div>
  );

  return recentlyFilledSlotId === slot.id ? (
    <motion.div
      className={slotClass}
      initial={{ opacity: 0.5, scale: 0.86 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.24 }}
    >
      {content}
    </motion.div>
  ) : (
    <div className={slotClass}>{content}</div>
  );
}
