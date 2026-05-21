import type { Showroom } from "@prisma/client";

export type ShowroomStatusValue = "open" | "closed" | "hidden" | "deleted";

export type ShowroomSummary = Omit<Showroom, "status"> & {
  status: ShowroomStatusValue;
};

export const showroomStatusLabels: Record<ShowroomStatusValue, string> = {
  open: "开放预约",
  closed: "暂停预约",
  hidden: "已隐藏",
  deleted: "已删除",
};

export const publicShowroomStatuses: ShowroomStatusValue[] = ["open", "closed"];

export function isShowroomStatus(value: unknown): value is ShowroomStatusValue {
  return value === "open" || value === "closed" || value === "hidden" || value === "deleted";
}

export function isPublicShowroomStatus(value: unknown): value is "open" | "closed" {
  return value === "open" || value === "closed";
}

export function getShowroomTypeLabel(type: Showroom["type"]) {
  return type === "company" ? "公司展厅" : "实训基地展厅";
}

export function getShowroomStatusLabel(status: ShowroomStatusValue) {
  return showroomStatusLabels[status];
}

export function getShowroomStatusClass(status: ShowroomStatusValue) {
  switch (status) {
    case "open":
      return "bg-emerald-50 text-emerald-700 ring-emerald-100";
    case "closed":
      return "bg-slate-100 text-slate-600 ring-slate-200";
    case "hidden":
      return "bg-amber-50 text-amber-700 ring-amber-100";
    case "deleted":
      return "bg-red-50 text-red-700 ring-red-100";
  }
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
