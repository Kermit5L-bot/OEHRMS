import type { VisitTimeSlot } from "@prisma/client";

export const phonePattern = /^1[3-9]\d{9}$/;

export const customerTypeOptions = [
  { value: "government", label: "\u653f\u5e9c" },
  { value: "industry_association", label: "\u884c\u4e1a\u534f\u4f1a" },
  { value: "public_institution", label: "\u4e8b\u4e1a\u5355\u4f4d" },
  { value: "third_party_operator", label: "\u7b2c\u4e09\u65b9\u8fd0\u7ef4\u5546" },
  { value: "industrial_company", label: "\u5de5\u4e1a\u4f01\u4e1a" },
  { value: "partner", label: "\u96c6\u6210\u5546/\u5408\u4f5c\u4f19\u4f34" },
  { value: "school", label: "\u9ad8\u6821" },
  { value: "other", label: "\u5176\u4ed6" },
] as const;

export const interestAreaOptions = [
  { value: "automatic_pollution_monitoring", label: "\u6c61\u67d3\u6e90\u81ea\u52a8\u76d1\u63a7" },
  { value: "ai_big_data", label: "AI\u5927\u6570\u636e" },
  { value: "environmental_monitoring_digital", label: "\u73af\u5883\u76d1\u6d4b\u6570\u667a\u5316" },
  { value: "atmosphere_noise_environment", label: "\u5927\u6c14\u4e0e\u58f0\u73af\u5883" },
  { value: "catering_oil_fume", label: "\u9910\u996e\u6cb9\u70df" },
  { value: "hazardous_solid_waste_management", label: "\u5371\u56fa\u5e9f\u7ba1\u7406" },
  { value: "enterprise_environment_software_platform", label: "\u4f01\u4e1a\u73af\u5883\u8f6f\u4ef6\u5e73\u53f0" },
  { value: "other", label: "\u5176\u4ed6" },
] as const;

export const provinceOptions = [
  "\u5317\u4eac\u5e02",
  "\u5929\u6d25\u5e02",
  "\u6cb3\u5317\u7701",
  "\u5c71\u897f\u7701",
  "\u5185\u8499\u53e4\u81ea\u6cbb\u533a",
  "\u8fbd\u5b81\u7701",
  "\u5409\u6797\u7701",
  "\u9ed1\u9f99\u6c5f\u7701",
  "\u4e0a\u6d77\u5e02",
  "\u6c5f\u82cf\u7701",
  "\u6d59\u6c5f\u7701",
  "\u5b89\u5fbd\u7701",
  "\u798f\u5efa\u7701",
  "\u6c5f\u897f\u7701",
  "\u5c71\u4e1c\u7701",
  "\u6cb3\u5357\u7701",
  "\u6e56\u5317\u7701",
  "\u6e56\u5357\u7701",
  "\u5e7f\u4e1c\u7701",
  "\u5e7f\u897f\u58ee\u65cf\u81ea\u6cbb\u533a",
  "\u6d77\u5357\u7701",
  "\u91cd\u5e86\u5e02",
  "\u56db\u5ddd\u7701",
  "\u8d35\u5dde\u7701",
  "\u4e91\u5357\u7701",
  "\u897f\u85cf\u81ea\u6cbb\u533a",
  "\u9655\u897f\u7701",
  "\u7518\u8083\u7701",
  "\u9752\u6d77\u7701",
  "\u5b81\u590f\u56de\u65cf\u81ea\u6cbb\u533a",
  "\u65b0\u7586\u7ef4\u543e\u5c14\u81ea\u6cbb\u533a",
  "\u9999\u6e2f\u7279\u522b\u884c\u653f\u533a",
  "\u6fb3\u95e8\u7279\u522b\u884c\u653f\u533a",
  "\u53f0\u6e7e\u7701",
] as const;

export const solutionConsultingOptions = [
  { value: "pending", label: "\u5f85\u786e\u8ba4" },
  { value: "no", label: "\u4e0d\u9700\u8981" },
  { value: "yes", label: "\u9700\u8981" },
] as const;

const customerTypeLabels = Object.fromEntries(customerTypeOptions.map((option) => [option.value, option.label]));
const interestAreaLabels = Object.fromEntries(interestAreaOptions.map((option) => [option.value, option.label]));
const solutionConsultingLabels = Object.fromEntries(solutionConsultingOptions.map((option) => [option.value, option.label]));
const provinceLabels = new Set<string>(provinceOptions);

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

export function isValidCustomerType(value: unknown): value is string {
  return typeof value === "string" && value in customerTypeLabels;
}

export function isValidInterestArea(value: unknown): value is string {
  return typeof value === "string" && value in interestAreaLabels;
}

export function isValidSolutionConsulting(value: unknown): value is string {
  return typeof value === "string" && value in solutionConsultingLabels;
}

export function isValidProvince(value: unknown): value is string {
  return typeof value === "string" && provinceLabels.has(value);
}

export function getVisitTimeSlotLabel(value: string) {
  return value === "morning" ? "\u4e0a\u5348" : "\u4e0b\u5348";
}

export function getCustomerTypeLabel(value?: string | null) {
  if (!value) return "-";
  return customerTypeLabels[value] || value;
}

export function getInterestAreaLabels(value?: string | null) {
  if (!value) return "-";
  const labels = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => interestAreaLabels[item] || item);

  return labels.length > 0 ? labels.join("\u3001") : "-";
}

export function getSolutionConsultingLabel(value?: string | null) {
  if (!value) return "-";
  return solutionConsultingLabels[value] || value;
}

export function getProvinceLabel(value?: string | null) {
  if (!value) return "-";
  return provinceLabels.has(value) ? value : value;
}

export function normalizeInterestAreas(value: unknown) {
  if (!Array.isArray(value)) return null;
  const values = value.filter(isValidInterestArea);
  return values.length > 0 ? Array.from(new Set(values)).join(",") : null;
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
