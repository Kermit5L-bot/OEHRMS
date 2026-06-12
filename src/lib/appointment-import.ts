import type { Prisma, VisitTimeSlot } from "@prisma/client";
import {
  customerTypeOptions,
  formatDateForAppointmentNo,
  interestAreaOptions,
  phonePattern,
} from "@/lib/appointments";

export const appointmentImportHeaders = [
  "展厅",
  "参观日期",
  "参观时间段",
  "参观人数",
  "联系人姓名",
  "联系电话",
  "公司名称",
  "职务",
  "所属省份",
  "客户类型",
  "关注方向",
  "是否需要讲解",
  "参观目的",
  "客户备注",
  "接待人",
  "接待备注",
  "实际接待地点",
  "到访开始时间",
  "到访结束时间",
] as const;

export const appointmentImportExampleRow = [
  "北京公司展厅",
  "2026-06-18",
  "上午",
  "3",
  "张三",
  "13800000000",
  "示例环保科技有限公司",
  "销售经理",
  "北京市",
  "工业企业",
  "AI大数据、环境监测数智化",
  "是",
  "了解展厅方案和产品能力",
  "客户希望重点了解平台能力",
  "李四",
  "客户由销售陪同到访",
  "北京公司展厅一层",
  "2026-06-18 09:30",
  "2026-06-18 11:30",
];

const chinaProvinceNames = [
  "北京市",
  "天津市",
  "河北省",
  "山西省",
  "内蒙古自治区",
  "辽宁省",
  "吉林省",
  "黑龙江省",
  "上海市",
  "江苏省",
  "浙江省",
  "安徽省",
  "福建省",
  "江西省",
  "山东省",
  "河南省",
  "湖北省",
  "湖南省",
  "广东省",
  "广西壮族自治区",
  "海南省",
  "重庆市",
  "四川省",
  "贵州省",
  "云南省",
  "西藏自治区",
  "陕西省",
  "甘肃省",
  "青海省",
  "宁夏回族自治区",
  "新疆维吾尔自治区",
  "香港特别行政区",
  "澳门特别行政区",
  "台湾省",
];

const customerTypeAliases: Record<string, string> = {
  政府: "government",
  行业协会: "industry_association",
  事业单位: "public_institution",
  第三方运营商: "third_party_operator",
  工业企业: "industrial_company",
  "集成商/合作伙伴": "partner",
  集成商: "partner",
  合作伙伴: "partner",
  高校: "school",
  其他: "other",
};

const interestAreaAliases: Record<string, string> = {
  污染源自动监控: "automatic_pollution_monitoring",
  AI大数据: "ai_big_data",
  环境监测数智化: "environmental_monitoring_digital",
  大气与声环境: "atmosphere_noise_environment",
  餐饮油烟: "catering_oil_fume",
  危固废管理: "hazardous_solid_waste_management",
  企业环境软件平台: "enterprise_environment_software_platform",
  其他: "other",
};

const customerTypeValues = new Set<string>(customerTypeOptions.map((option) => option.value));
const interestAreaValues = new Set<string>(interestAreaOptions.map((option) => option.value));
const provinceNames = new Set(chinaProvinceNames);

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
  customerType: string;
  interestAreas: string | null;
  needGuide: boolean;
  visitPurpose: string | null;
  customerRemark: string | null;
  receptionist: string | null;
  receptionNote: string | null;
  actualReceptionLocation: string | null;
  visitStartTime: Date | null;
  visitEndTime: Date | null;
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

export function parseImportDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number") {
    const date = parseExcelSerialDate(value);
    return date ? date.toISOString().slice(0, 10) : null;
  }

  const text = normalizeImportText(value);
  const match = text.match(/^(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})日?$/);
  if (!match) return null;
  const [, year, month, day] = match;
  const normalized = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  const date = new Date(`${normalized}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : normalized;
}

export function parseImportDateTime(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number") return parseExcelSerialDate(value);

  const text = normalizeImportText(value);
  if (!text) return null;

  const normalized = text.replace(/\//g, "-").replace("T", " ");
  const match = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
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

export function parseCustomerType(value: unknown) {
  const text = normalizeImportText(value);
  if (!text) return null;
  if (customerTypeValues.has(text)) return text;
  return customerTypeAliases[text] || null;
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
      return interestAreaAliases[item] || null;
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
  const showroomName = normalizeImportText(getValue("展厅"));
  const visitDate = parseImportDate(getValue("参观日期"));
  const visitTimeSlot = parseVisitTimeSlot(getValue("参观时间段"));
  const visitorCount = Number(normalizeImportText(getValue("参观人数")));
  const contactName = normalizeImportText(getValue("联系人姓名"));
  const contactPhone = normalizeImportText(getValue("联系电话"));
  const companyName = normalizeImportText(getValue("公司名称"));
  const province = parseProvince(getValue("所属省份"));
  const customerType = parseCustomerType(getValue("客户类型"));
  const interestAreas = parseInterestAreas(getValue("关注方向"));
  const needGuide = parseNeedGuide(getValue("是否需要讲解"));
  const visitStartTimeText = normalizeImportText(getValue("到访开始时间"));
  const visitEndTimeText = normalizeImportText(getValue("到访结束时间"));
  const visitStartTime = parseImportDateTime(getValue("到访开始时间"));
  const visitEndTime = parseImportDateTime(getValue("到访结束时间"));

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
  if (needGuide === null) return { error: "是否需要讲解不合法，请填写是/否" };
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
      position: optionalText(getValue("职务")),
      province,
      customerType,
      interestAreas: interestAreas?.value || null,
      needGuide,
      visitPurpose: optionalText(getValue("参观目的")),
      customerRemark: optionalText(getValue("客户备注")),
      receptionist: optionalText(getValue("接待人")),
      receptionNote: optionalText(getValue("接待备注")),
      actualReceptionLocation: optionalText(getValue("实际接待地点")),
      visitStartTime,
      visitEndTime,
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
