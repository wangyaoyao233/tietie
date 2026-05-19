import type { Sticker } from "./stickerTypes";

const stickerLabels: Record<string, string> = {
  "study-star": "星のノート",
  "study-pencil": "えんぴつ",
  "study-lamp": "小さなランプ",
  "study-medal": "学習メダル",
  "fitness-shoe": "運動ぐつ",
  "fitness-heart": "元気ハート",
  "fitness-water": "水ボトル",
  "fitness-sun": "朝の光",
  "reading-book": "開いた本",
  "reading-moon": "月のしおり",
  "reading-tea": "温かいお茶",
  "reading-cloud": "雲のページ",
  "money-coin": "コイン",
  "money-leaf": "小さな葉っぱ",
  "money-jar": "貯金びん",
  "money-gem": "きらきら",
  "daily-flower": "小さな花",
  "daily-coffee": "コーヒー",
  "daily-home": "小さな家",
  "daily-spark": "きらめき",
  "cute-cat": "小さな猫",
  "cute-bow": "リボン",
  "cute-bear": "ハグベア",
  "cute-cake": "小さなケーキ",
};

export const getStickerDisplayName = (sticker: Sticker) => stickerLabels[sticker.id] ?? sticker.name;
