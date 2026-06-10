import dayjs from "dayjs";
import "dayjs/locale/ko";

dayjs.locale("ko");

/**
 * Format epoch seconds to relative/absolute time string for message display.
 * - Under 1 minute: "방금 전"
 * - Under 1 hour: "N분 전"
 * - Under 24 hours: "N시간 전"
 * - Yesterday: "어제"
 * - This year: "MM.DD"
 * - Older: "YYYY.MM.DD"
 */
export function formatMessageTime(epochSeconds: number): string {
  const now = dayjs();
  const date = dayjs.unix(epochSeconds);
  const diffMinutes = now.diff(date, "minute");
  const diffHours = now.diff(date, "hour");

  if (diffMinutes < 1) return "방금 전";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;

  const isYesterday = now.subtract(1, "day").isSame(date, "day");
  if (isYesterday) return "어제";

  if (now.isSame(date, "year")) return date.format("MM.DD");
  return date.format("YYYY.MM.DD");
}

/**
 * Format epoch seconds to absolute date string for message detail view.
 * - Today: "오늘"
 * - Yesterday: "어제"
 * - This year: "YYYY.MM.DD"
 * - Older: "YYYY.MM.DD"
 */
export function formatMessageDate(epochSeconds: number): string {
  const now = dayjs();
  const date = dayjs.unix(epochSeconds);

  if (now.isSame(date, "day")) return "오늘";

  const isYesterday = now.subtract(1, "day").isSame(date, "day");
  if (isYesterday) return "어제";

  return date.format("YYYY.MM.DD");
}
