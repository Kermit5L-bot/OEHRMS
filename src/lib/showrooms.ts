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

export function getShowroomCoverStyle(showroom: ShowroomSummary) {
  if (showroom.coverImage) {
    return {
      backgroundImage: `url(${showroom.coverImage})`,
    };
  }

  return {
    backgroundImage:
      "linear-gradient(135deg, rgba(14, 116, 144, 0.9), rgba(37, 99, 235, 0.85)), linear-gradient(45deg, #e2e8f0, #f8fafc)",
  };
}
