import type { Showroom } from "@prisma/client";

export type ShowroomSummary = Pick<
  Showroom,
  | "id"
  | "name"
  | "city"
  | "type"
  | "coverImage"
  | "summary"
  | "description"
  | "address"
  | "openingHours"
  | "suggestedDuration"
  | "status"
  | "sortOrder"
>;

export function getShowroomTypeLabel(type: ShowroomSummary["type"]) {
  return type === "company" ? "公司展厅" : "实训基地展厅";
}

export function getShowroomStatusLabel(status: ShowroomSummary["status"]) {
  return status === "open" ? "开放预约" : "暂停预约";
}

export function normalizeShowroomCoverSrc(coverImage?: string | null) {
  if (!coverImage) return "";

  const normalized = coverImage.replaceAll("\\", "/");
  const publicIndex = normalized.lastIndexOf("/public/");
  if (publicIndex >= 0) {
    return normalized.slice(publicIndex + "/public".length);
  }

  return coverImage;
}
