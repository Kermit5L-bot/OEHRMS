import type { AppointmentStatus } from "@prisma/client";

export const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  pending: "待审批",
  approved: "已通过",
  rejected: "已拒绝",
  completed: "已完成",
  cancelled: "已取消",
};

export function getAppointmentStatusClass(status: AppointmentStatus) {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-800 ring-amber-200";
    case "approved":
      return "bg-emerald-100 text-emerald-800 ring-emerald-200";
    case "rejected":
      return "bg-red-100 text-red-800 ring-red-200";
    case "completed":
      return "bg-blue-100 text-blue-800 ring-blue-200";
    case "cancelled":
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
