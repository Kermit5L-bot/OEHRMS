import type { Prisma, VisitTimeSlot } from "@prisma/client";
import {
  appointmentExcelExampleRow,
  appointmentExcelFieldLabels,
  appointmentExcelHeaders,
} from "@/lib/appointment-excel-fields";
import {
  customerTypeOptions,
  formatDateForAppointmentNo,
  interestAreaOptions,
  isValidSolutionConsulting,
  phonePattern,
  provinceOptions,
} from "@/lib/appointments";

export const appointmentImportHeaders = appointmentExcelHeaders;
export const appointmentImportExampleRow = appointmentExcelExampleRow;

const customerTypeValues = new Set<string>(customerTypeOptions.map((option) => option.value));
const customerTypeLabelAliases = new Map<string, string>(
  customerTypeOptions.map((option) => [option.label, option.value]),
);
const interestAreaValues = new Set<string>(interestAreaOptions.map((option) => option.value));
const interestAreaLabelAliases = new Map<string, string>(
  interestAreaOptions.map((option) => [option.label, option.value]),
);
const provinceNames = new Set<string>(provinceOptions);

export type ParsedImportRow = {
  showroomName: string;
  visitDate: string;
  visitTimeSlot: VisitTimeSlot;
  visitorCount: number;
  contactName: string;
  contactPhone: string;
  companyName: string;
  position: string | null;
  province: string;
  internalContactInfo: string | null;
  customerLevel: string | null;
  mainVisitorInfo: string | null;
  customerType: string;
  interestAreas: string | null;
  needSolutionConsulting: string | null;
  needGuide: boolean;
  visitPurpose: string | null;
  customerRemark: string | null;
  receptionist: string | null;
  receptionNote: string | null;
  actualReceptionLocation: string | null;
  visitStartTime: Date | null;
  visitEndTime: Date | null;
  needVehicle: string | null;
  vehicleRequirement: string | null;
  needAccommodation: string | null;
  accommodationRequirement: string | null;
  needDining: string | null;
  diningRequirement: string | null;
  giftPreparation: string | null;
  giftRequirement: string | null;
  receptionScheduleNote: string | null;
  receptionPreparationNote: string | null;
  followUpNote: string | null;
};

export function normalizeImportText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function optionalText(value: unknown) {
  const text = normalizeImportText(value);
  return text || null;
}

function parseExcelSerialDate(value: number) {
  if (!Number.isFinite(value)) return null;
  const utcMs = Math.round((value - 25569) * 86_400_000);
  const date = new Date(utcMs);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeDateText(value: unknown) {
  return normalizeImportText(value)
    .replace(/[年月./]/g, "-")
    .replace(/日/g, "")
    .replace("T", " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseImportDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number") {
    const date = parseExcelSerialDate(value);
    return date ? date.toISOString().slice(0, 10) : null;
  }

  const text = normalizeDateText(value);
  const match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;
  const [, year, month, day] = match;
  const normalized = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  const date = new Date(`${normalized}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : normalized;
}

export function parseImportDateTime(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number") return parseExcelSerialDate(value);

  const text = normalizeDateText(value);
  if (!text) return null;

  const match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
  if (!match) return null;
  const [, year, month, day, hour = "0", minute = "0", second = "0"] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );

  return Number.isNaN(date.getTime()) ? null : date;
}

export function parseVisitTimeSlot(value: unknown): VisitTimeSlot | null {
  const text = normalizeImportText(value).toLowerCase();
  if (text === "上午" || text === "morning" || text === "am") return "morning";
  if (text === "下午" || text === "afternoon" || text === "pm") return "afternoon";
  return null;
}

export function parseNeedGuide(value: unknown) {
  const text = normalizeImportText(value).toLowerCase();
  if (!text) return true;
  if (["是", "需要", "yes", "y", "true", "1"].includes(text)) return true;
  if (["否", "不需要", "no", "n", "false", "0"].includes(text)) return false;
  return null;
}

function parseRequestOption(value: unknown) {
  const text = normalizeImportText(value).toLowerCase();
  if (!text) return "pending";
  if (["是", "需要", "yes", "y", "true", "1"].includes(text)) return "yes";
  if (["否", "不需要", "no", "n", "false", "0"].includes(text)) return "no";
  if (["待确认", "待定", "pending"].includes(text)) return "pending";
  return null;
}

export function parseCustomerType(value: unknown) {
  const text = normalizeImportText(value);
  if (!text) return null;
  if (customerTypeValues.has(text)) return text;
  return customerTypeLabelAliases.get(text) || null;
}

export function parseInterestAreas(value: unknown) {
  const text = normalizeImportText(value);
  if (!text) return null;

  const values = text
    .split(/[,，、;；\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      if (interestAreaValues.has(item)) return item;
      return interestAreaLabelAliases.get(item) || null;
    });

  if (values.some((item) => !item)) return { error: "关注方向不合法" };

  return {
    value: Array.from(new Set(values as string[])).join(","),
  };
}

export function parseProvince(value: unknown) {
  const text = normalizeImportText(value);
  return provinceNames.has(text) ? text : null;
}

export function parseAppointmentImportRow(getValue: (header: string) => unknown): { data?: ParsedImportRow; error?: string } {
  const labels = appointmentExcelFieldLabels;
  const showroomName = normalizeImportText(getValue(labels.showroom));
  const visitDate = parseImportDate(getValue(labels.visitDate));
  const visitTimeSlot = parseVisitTimeSlot(getValue(labels.visitTimeSlot));
  const visitorCount = Number(normalizeImportText(getValue(labels.visitorCount)));
  const contactName = normalizeImportText(getValue(labels.contactName));
  const contactPhone = normalizeImportText(getValue(labels.contactPhone));
  const companyName = normalizeImportText(getValue(labels.companyName));
  const province = parseProvince(getValue(labels.province));
  const customerType = parseCustomerType(getValue(labels.customerType));
  const interestAreas = parseInterestAreas(getValue(labels.interestAreas));
  const needSolutionConsulting = parseRequestOption(getValue(labels.needSolutionConsulting));
  const needGuide = parseNeedGuide(getValue(labels.needGuide));
  const needVehicle = parseRequestOption(getValue(labels.needVehicle));
  const needAccommodation = parseRequestOption(getValue(labels.needAccommodation));
  const needDining = parseRequestOption(getValue(labels.needDining));
  const giftPreparation = parseRequestOption(getValue(labels.giftPreparation));
  const visitStartTimeText = normalizeImportText(getValue(labels.visitStartTime));
  const visitEndTimeText = normalizeImportText(getValue(labels.visitEndTime));
  const visitStartTime = parseImportDateTime(getValue(labels.visitStartTime));
  const visitEndTime = parseImportDateTime(getValue(labels.visitEndTime));

  if (!showroomName) return { error: "展厅不能为空" };
  if (!visitDate) return { error: "参观日期格式不正确" };
  if (!visitTimeSlot) return { error: "参观时间段不合法，请填写上午/下午" };
  if (!Number.isInteger(visitorCount) || visitorCount < 1) return { error: "参观人数必须为大于 0 的整数" };
  if (!contactName) return { error: "联系人姓名不能为空" };
  if (!phonePattern.test(contactPhone)) return { error: "联系电话格式不正确" };
  if (!companyName) return { error: "公司名称不能为空" };
  if (!province) return { error: "所属省份不属于中国 34 个省级行政区" };
  if (!customerType) return { error: "客户类型不合法" };
  if (interestAreas && "error" in interestAreas) return { error: interestAreas.error };
  if (needSolutionConsulting === null || !isValidSolutionConsulting(needSolutionConsulting)) {
    return { error: "是否需要方案交流不合法，请填写需要/不需要/待确认" };
  }
  if (needGuide === null) return { error: "是否需要讲解不合法，请填写是/否" };
  if (needVehicle === null) return { error: "是否需要车辆接送不合法，请填写需要/不需要/待确认" };
  if (needAccommodation === null) return { error: "是否需要住宿安排不合法，请填写需要/不需要/待确认" };
  if (needDining === null) return { error: "是否需要宴请安排不合法，请填写需要/不需要/待确认" };
  if (giftPreparation === null) return { error: "是否需要准备礼品不合法，请填写需要/不需要/待确认" };
  if (visitStartTimeText && !visitStartTime) return { error: "到访开始时间格式不正确" };
  if (visitEndTimeText && !visitEndTime) return { error: "到访结束时间格式不正确" };

  return {
    data: {
      showroomName,
      visitDate,
      visitTimeSlot,
      visitorCount,
      contactName,
      contactPhone,
      companyName,
      position: optionalText(getValue(labels.position)),
      province,
      internalContactInfo: optionalText(getValue(labels.internalContactInfo)),
      customerLevel: optionalText(getValue(labels.customerLevel)),
      mainVisitorInfo: optionalText(getValue(labels.mainVisitorInfo)),
      customerType,
      interestAreas: interestAreas?.value || null,
      needSolutionConsulting,
      needGuide,
      visitPurpose: optionalText(getValue(labels.visitPurpose)),
      customerRemark: optionalText(getValue(labels.customerRemark)),
      receptionist: optionalText(getValue(labels.receptionist)),
      receptionNote: optionalText(getValue(labels.receptionNote)),
      actualReceptionLocation: optionalText(getValue(labels.actualReceptionLocation)),
      visitStartTime,
      visitEndTime,
      needVehicle,
      vehicleRequirement: optionalText(getValue(labels.vehicleRequirement)),
      needAccommodation,
      accommodationRequirement: optionalText(getValue(labels.accommodationRequirement)),
      needDining,
      diningRequirement: optionalText(getValue(labels.diningRequirement)),
      giftPreparation,
      giftRequirement: optionalText(getValue(labels.giftRequirement)),
      receptionScheduleNote: optionalText(getValue(labels.receptionScheduleNote)),
      receptionPreparationNote: optionalText(getValue(labels.receptionPreparationNote)),
      followUpNote: optionalText(getValue(labels.followUpNote)),
    },
  };
}

export async function generateCompletedAppointmentNo(tx: Prisma.TransactionClient) {
  const today = new Date();
  const prefix = `YY${formatDateForAppointmentNo(today)}`;
  const latestAppointment = await tx.appointment.findFirst({
    where: {
      appointmentNo: {
        startsWith: prefix,
      },
    },
    orderBy: {
      appointmentNo: "desc",
    },
  });
  const latestSequence = latestAppointment
    ? Number(latestAppointment.appointmentNo.slice(prefix.length))
    : 0;

  return `${prefix}${String(latestSequence + 1).padStart(4, "0")}`;
}
