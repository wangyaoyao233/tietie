import { apiGet } from "../../lib/apiClient";
import type { Sticker } from "./stickerTypes";

/** 读取内置贴纸库，供完成一步时选择贴纸。 */
export const fetchStickers = () => apiGet<Sticker[]>("/api/stickers");
