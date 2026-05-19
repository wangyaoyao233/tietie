import { GoalSlot } from "./GoalSlot";
import type { GoalSlot as GoalSlotType } from "./goalTypes";

type GoalAlbumGridProps = {
  slots: GoalSlotType[];
  recentlyFilledSlotId: string | null;
  onInspect: (slot: GoalSlotType) => void;
};

/** 渲染目标册槽位网格，并标记当前应该被填充的下一个空槽。 */
export function GoalAlbumGrid({ slots, recentlyFilledSlotId, onInspect }: GoalAlbumGridProps) {
  const nextEmptySlotId = slots.find((slot) => slot.status === "empty")?.id ?? null;

  return (
    <div
      className="grid grid-cols-4 gap-2.5 rounded-[20px] border border-[#eadfcd] bg-[#fffaf1] p-3.5 shadow-[0_20px_40px_rgb(81_55_32_/_10%)] min-[700px]:grid-cols-5 min-[700px]:gap-3"
      aria-label="目標ステッカーアルバム"
    >
      {slots.map((slot) => (
        <GoalSlot
          key={slot.id}
          slot={slot}
          isNext={slot.id === nextEmptySlotId}
          recentlyFilledSlotId={recentlyFilledSlotId}
          onInspect={onInspect}
        />
      ))}
    </div>
  );
}
