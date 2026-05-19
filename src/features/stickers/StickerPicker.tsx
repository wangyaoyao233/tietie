import { cn } from "../../lib/cn";
import { getStickerDisplayName } from "./stickerDisplayName";
import { StickerImage } from "./StickerImage";
import type { Sticker } from "./stickerTypes";

type StickerPickerProps = {
  stickers: Sticker[];
  selectedStickerId: string;
  onSelect: (stickerId: string) => void;
};

const themeLabels: Record<string, string> = {
  study: "学習",
  fitness: "運動",
  reading: "読書",
  money: "貯金",
  daily: "日常",
  cute: "かわいい",
};

const stickerOptionClass =
  "grid min-h-[86px] justify-items-center gap-1.5 rounded-2xl border border-[#eadfcd] bg-[#fffdf8] px-1.5 py-2.5 text-[#5a4d3e]";

/** 按主题分组展示贴纸，并把当前选择回传给完成流程。 */
export function StickerPicker({ stickers, selectedStickerId, onSelect }: StickerPickerProps) {
  const grouped = stickers.reduce<Record<string, Sticker[]>>((groups, sticker) => {
    const key = sticker.theme ?? "daily";
    groups[key] = [...(groups[key] ?? []), sticker];
    return groups;
  }, {});

  return (
    <div className="grid gap-3.5">
      {Object.entries(grouped).map(([theme, items]) => (
        <section className="grid gap-2" key={theme}>
          <h3 className="text-base tracking-normal text-[#241e18]">{themeLabels[theme] ?? theme}</h3>
          <div className="grid grid-cols-3 gap-2 min-[700px]:grid-cols-4">
            {items.map((sticker) => (
              <button
                className={cn(
                  stickerOptionClass,
                  selectedStickerId === sticker.id &&
                    "border-[#df6d43] bg-[#fff0d2] shadow-[0_0_0_3px_rgb(223_109_67_/_12%)]",
                )}
                type="button"
                key={sticker.id}
                onClick={() => onSelect(sticker.id)}
                aria-pressed={selectedStickerId === sticker.id}
              >
                <StickerImage sticker={sticker} size="small" />
                <span className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[0.78rem] font-extrabold">
                  {getStickerDisplayName(sticker)}
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
