import type { Sticker } from "./stickerTypes";

type StickerImageProps = {
  sticker: Sticker;
  size?: "small" | "medium" | "large" | "detail";
};

const sizeClasses = {
  small: "size-11",
  medium: "size-[58px]",
  large: "size-[74%]",
  detail: "mx-auto size-[140px]",
};

/** 统一渲染贴纸图片尺寸和替代文本。 */
export function StickerImage({ sticker, size = "medium" }: StickerImageProps) {
  return (
    <img
      className={`block object-contain ${sizeClasses[size]}`}
      src={sticker.imageUrl}
      alt={sticker.name}
      loading="lazy"
    />
  );
}
