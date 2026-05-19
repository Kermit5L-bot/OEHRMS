import type { VisitTimeSlot } from "@prisma/client";

export const phonePattern = /^1[3-9]\d{9}$/;

export function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function isValidVisitTimeSlot(value: unknown): value is VisitTimeSlot {
  return value === "morning" || value === "afternoon";
}

export function getVisitTimeSlotLabel(value: string) {
  return value === "morning" ? "上午" : "下午";
}

export function maskPhone(phone: string) {
  if (phone.length < 7) {
    return phone;
  }

  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

export function formatDateForAppointmentNo(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}
