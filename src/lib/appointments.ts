import type { VisitTimeSlot } from "@prisma/client";

export const phonePattern = /^1[3-9]\d{9}$/;

export const customerTypeOptions = [
  { value: "government", label: "政府" },
  { value: "industry_association", label: "行业协会" },
  { value: "public_institution", label: "事业单位" },
  { value: "third_party_operator", label: "第三方运维商" },
  { value: "industrial_company", label: "工业企业" },
  { value: "partner", label: "集成商/合作伙伴" },
  { value: "school", label: "高校" },
  { value: "other", label: "其他" },
] as const;

export const interestAreaOptions = [
  { value: "automatic_pollution_monitoring", label: "污染源自动监控" },
  { value: "atmosphere_noise_environment", label: "大气与声环境" },
  { value: "environmental_monitoring_digital", label: "环境监测数智化" },
  { value: "offsite_smart_supervision", label: "非现场智慧监管执法" },
  { value: "enterprise_environmental_risk", label: "企业环境风险管控" },
  { value: "hazardous_solid_waste", label: "危固废" },
  { value: "third_party_operation", label: "第三方运维" },
  { value: "other", label: "其他" },
] as const;

export const solutionConsultingOptions = [
  { value: "yes", label: "是" },
  { value: "no", label: "否" },
  { value: "pending", label: "待沟通" },
] as const;

const customerTypeLabels = Object.fromEntries(customerTypeOptions.map((option) => [option.value, option.label]));
const interestAreaLabels = Object.fromEntries(interestAreaOptions.map((option) => [option.value, option.label]));
const solutionConsultingLabels = Object.fromEntries(solutionConsultingOptions.map((option) => [option.value, option.label]));

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

export function getVisitTimeSlotLabel(value: string) {
  return value === "morning" ? "上午" : "下午";
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

  return labels.length > 0 ? labels.join("、") : "-";
}

export function getSolutionConsultingLabel(value?: string | null) {
  if (!value) return "-";
  return solutionConsultingLabels[value] || value;
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
