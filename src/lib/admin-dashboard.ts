import type { AppointmentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { provinceOptions } from "@/lib/appointments";
import { getRegionManagementData } from "@/lib/regions";

export type DashboardPeriod = "year" | "quarter" | "month";
export type DashboardTrendGranularity = "day" | "week" | "month" | "quarter" | "year";

export type DashboardFilters = {
  period?: DashboardPeriod;
  year?: number;
  quarter?: 1 | 2 | 3 | 4;
  month?: number;
};

export const dashboardStatusLabels: Record<AppointmentStatus, string> = {
  pending: "待审批",
  approved: "已通过",
  rejected: "已拒绝",
  completed: "已完成",
  cancelled: "已取消",
};

const customerTypeLabels: Record<string, string> = {
  government: "政府",
  industry_association: "行业协会",
  public_institution: "事业单位",
  third_party_operator: "第三方运营商",
  industrial_company: "工业企业",
  partner: "集成商/合作伙伴",
  school: "高校",
  other: "其他",
};

const interestAreaLabels: Record<string, string> = {
  automatic_pollution_monitoring: "污染源自动监控",
  ai_big_data: "AI 大数据",
  environmental_monitoring_digital: "环境监测数智化",
  atmosphere_noise_environment: "大气与声环境",
  catering_oil_fume: "餐饮油烟",
  hazardous_solid_waste_management: "危固废管理",
  enterprise_environment_software_platform: "企业环境软件平台",
  other: "其他",
};

const allQuarters = [1, 2, 3, 4] as const;

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfMonth() {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function startOfYear(year: number) {
  return new Date(year, 0, 1);
}

function endOfYear(year: number) {
  return new Date(year + 1, 0, 1);
}

function startOfSelectedMonth(year: number, month: number) {
  return new Date(year, month - 1, 1);
}

function endOfSelectedMonth(year: number, month: number) {
  return addMonths(startOfSelectedMonth(year, month), 1);
}

function startOfQuarter(year: number, quarter: 1 | 2 | 3 | 4) {
  return new Date(year, (quarter - 1) * 3, 1);
}

function endOfQuarter(year: number, quarter: 1 | 2 | 3 | 4) {
  return addMonths(startOfQuarter(year, quarter), 3);
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getQuarter(date: Date) {
  return Math.floor(date.getMonth() / 3) + 1;
}

function labelValue(value?: string | null, labels?: Record<string, string>) {
  if (!value) return "未填写";
  return labels?.[value] || value;
}

function splitInterestAreas(value?: string | null) {
  if (!value) return ["未填写"];
  const trimmed = value.trim();
  if (!trimmed) return ["未填写"];

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) {
      const values = parsed.map((item) => String(item).trim()).filter(Boolean);
      return values.length > 0 ? values : ["未填写"];
    }
  } catch {
    // Existing records store this field as a comma-separated string.
  }

  const values = trimmed
    .split(/[,，、]/)
    .map((item) => item.trim())
    .filter(Boolean);

  return values.length > 0 ? values : ["未填写"];
}

function increment(map: Map<string, number>, key: string, count = 1) {
  map.set(key, (map.get(key) || 0) + count);
}

function toDistribution(map: Map<string, number>) {
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function hasText(value?: string | null) {
  return Boolean(value && value.trim().length > 0);
}

function normalizeFilters(filters: DashboardFilters = {}) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const year = Number.isInteger(filters.year) && filters.year! >= 2000 ? filters.year! : currentYear;
  const quarter = allQuarters.includes(filters.quarter as 1 | 2 | 3 | 4) ? filters.quarter! : getQuarter(new Date()) as 1 | 2 | 3 | 4;
  const month = Number.isInteger(filters.month) && filters.month! >= 1 && filters.month! <= 12 ? filters.month! : currentMonth;
  const period: DashboardPeriod = filters.period === "year" || filters.period === "month" ? filters.period : "quarter";

  if (period === "year") {
    return { period, year, quarter, month, granularity: "month" as DashboardTrendGranularity, periodStart: startOfYear(year), periodEnd: endOfYear(year) };
  }

  if (period === "month") {
    return {
      period,
      year,
      quarter,
      month,
      granularity: "day" as DashboardTrendGranularity,
      periodStart: startOfSelectedMonth(year, month),
      periodEnd: endOfSelectedMonth(year, month),
    };
  }

  return { period, year, quarter, month, granularity: "week" as DashboardTrendGranularity, periodStart: startOfQuarter(year, quarter), periodEnd: endOfQuarter(year, quarter) };
}

function createTrendBuckets(
  granularity: DashboardTrendGranularity,
  periodStart: Date,
  periodEnd: Date,
  year: number,
) {
  const buckets = new Map<string, number>();
  if (granularity === "day") {
    for (let date = new Date(periodStart); date < periodEnd; date = addDays(date, 1)) {
      buckets.set(formatDateKey(date).slice(5), 0);
    }
    return buckets;
  }
  if (granularity === "week") {
    for (let date = new Date(periodStart); date < periodEnd; date = addDays(date, 7)) {
      const weekEnd = addDays(date, 6);
      buckets.set(`${formatDateKey(date).slice(5)}~${formatDateKey(weekEnd).slice(5)}`, 0);
    }
    return buckets;
  }
  if (granularity === "month") {
    for (let date = new Date(periodStart); date < periodEnd; date = addMonths(date, 1)) {
      buckets.set(formatMonthKey(date), 0);
    }
    return buckets;
  }
  if (granularity === "quarter") {
    for (const quarter of allQuarters) {
      buckets.set(`${year} Q${quarter}`, 0);
    }
    return buckets;
  }
  buckets.set(String(year), 0);
  return buckets;
}

function getTrendKey(date: Date, granularity: DashboardTrendGranularity, periodStart: Date, year: number) {
  if (granularity === "day") return formatDateKey(date).slice(5);
  if (granularity === "week") {
    const days = Math.floor((date.getTime() - periodStart.getTime()) / 86_400_000);
    const bucketStart = addDays(periodStart, Math.floor(days / 7) * 7);
    const bucketEnd = addDays(bucketStart, 6);
    return `${formatDateKey(bucketStart).slice(5)}~${formatDateKey(bucketEnd).slice(5)}`;
  }
  if (granularity === "month") return formatMonthKey(date);
  if (granularity === "quarter") return `${year} Q${getQuarter(date)}`;
  return String(year);
}

async function getAvailableYears() {
  const rows = await prisma.$queryRaw<{ year: number }[]>`
    SELECT DISTINCT CAST(strftime('%Y', visit_date) AS INTEGER) AS year
    FROM appointments
    ORDER BY year DESC
  `;
  const currentYear = new Date().getFullYear();
  const years = rows.map((row) => Number(row.year)).filter(Boolean);
  return years.includes(currentYear) ? years : [currentYear, ...years];
}

export async function getDashboardSummary(filters: DashboardFilters = {}) {
  const normalized = normalizeFilters(filters);
  const { period, year, quarter, month, granularity, periodStart, periodEnd } = normalized;
  const today = startOfToday();
  const tomorrow = addDays(today, 1);
  const monthStart = startOfMonth();
  const filteredWhere = {
    visitDate: {
      gte: periodStart,
      lt: periodEnd,
    },
  };

  const [
    totalAppointments,
    todayAppointments,
    pendingAppointments,
    totalLeads,
    completedAppointments,
    monthAppointments,
    filteredAppointments,
    statusGroups,
    receptionAppointments,
    recentAppointments,
    availableYears,
    regionData,
  ] = await Promise.all([
    prisma.appointment.count(),
    prisma.appointment.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    }),
    prisma.appointment.count({ where: { status: "pending" } }),
    prisma.lead.count(),
    prisma.appointment.count({ where: { status: "completed" } }),
    prisma.appointment.count({
      where: {
        createdAt: {
          gte: monthStart,
        },
      },
    }),
    prisma.appointment.findMany({
      where: filteredWhere,
      select: {
        id: true,
        appointmentNo: true,
        companyName: true,
        contactName: true,
        contactPhone: true,
        visitorCount: true,
        createdAt: true,
        visitDate: true,
        province: true,
        customerType: true,
        interestAreas: true,
        status: true,
        showroom: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { visitDate: "asc" },
    }),
    prisma.appointment.groupBy({
      by: ["status"],
      where: filteredWhere,
      _count: {
        _all: true,
      },
    }),
    prisma.appointment.findMany({
      where: filteredWhere,
      select: {
        status: true,
        receptionNote: true,
        receptionist: true,
        followUpNote: true,
        visitStartTime: true,
        visitEndTime: true,
        actualReceptionLocation: true,
        receptionScheduleNote: true,
        receptionPreparationNote: true,
      },
    }),
    prisma.appointment.findMany({
      where: filteredWhere,
      orderBy: { visitDate: "asc" },
      take: 8,
      include: {
        showroom: {
          select: {
            name: true,
          },
        },
      },
    }),
    getAvailableYears(),
    getRegionManagementData(),
  ]);

  const trendMap = createTrendBuckets(granularity, periodStart, periodEnd, year);
  for (const appointment of filteredAppointments) {
    const key = getTrendKey(appointment.visitDate, granularity, periodStart, year);
    if (trendMap.has(key)) increment(trendMap, key);
  }

  const statusMap = new Map<string, number>();
  for (const status of Object.keys(dashboardStatusLabels) as AppointmentStatus[]) {
    statusMap.set(status, 0);
  }
  for (const item of statusGroups) {
    statusMap.set(item.status, item._count._all);
  }

  const provinceToRegion = new Map<string, { id: number; name: string; color: string }>();
  for (const region of regionData.regions) {
    for (const province of region.provinces) {
      provinceToRegion.set(province, { id: region.id, name: region.name, color: region.color });
    }
  }

  const totalFilteredAppointments = filteredAppointments.length;
  const regionStatsMap = new Map<string, {
    id: number | null;
    name: string;
    color: string;
    count: number;
    completedCount: number;
    pendingCount: number;
    provinces: string[];
  }>();
  for (const region of regionData.regions) {
    regionStatsMap.set(region.name, {
      id: region.id,
      name: region.name,
      color: region.color,
      count: 0,
      completedCount: 0,
      pendingCount: 0,
      provinces: region.provinces,
    });
  }
  regionStatsMap.set("未分区", {
    id: null,
    name: "未分区",
    color: "#94a3b8",
    count: 0,
    completedCount: 0,
    pendingCount: 0,
    provinces: regionData.unassignedProvinces,
  });

  const provinceRegionMap = provinceOptions.map((province) => {
    const region = provinceToRegion.get(province);
    return {
      province,
      regionName: region?.name || "未分区",
      color: region?.color || "#94a3b8",
    };
  });

  const customerTypeMap = new Map<string, number>();
  const interestAreaMap = new Map<string, number>();
  for (const appointment of filteredAppointments) {
    const region = appointment.province ? provinceToRegion.get(appointment.province) : null;
    const regionName = region?.name || "未分区";
    const stat = regionStatsMap.get(regionName) || regionStatsMap.get("未分区")!;
    stat.count += 1;
    if (appointment.status === "completed") stat.completedCount += 1;
    if (appointment.status === "pending") stat.pendingCount += 1;

    increment(customerTypeMap, labelValue(appointment.customerType, customerTypeLabels));
    for (const area of splitInterestAreas(appointment.interestAreas)) {
      increment(interestAreaMap, labelValue(area, interestAreaLabels));
    }
  }

  const regionOverview = Array.from(regionStatsMap.values())
    .map((item) => ({
      ...item,
      percent: totalFilteredAppointments > 0 ? Math.round((item.count / totalFilteredAppointments) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN"));

  const periodAppointments = filteredAppointments.length;
  const periodLeadCount = new Set(filteredAppointments.map((appointment) => appointment.contactPhone)).size;
  const periodCompletedAppointments = filteredAppointments.filter((appointment) => appointment.status === "completed").length;
  const periodPendingAppointments = filteredAppointments.filter((appointment) => appointment.status === "pending").length;
  const periodVisitorCount = filteredAppointments.reduce((sum, appointment) => sum + appointment.visitorCount, 0);

  let receptionNoteCount = 0;
  let internalArrangementCount = 0;
  let guideArrangementCount = 0;
  for (const appointment of receptionAppointments) {
    if (hasText(appointment.receptionNote) || hasText(appointment.followUpNote)) receptionNoteCount += 1;
    if (
      appointment.visitStartTime ||
      appointment.visitEndTime ||
      hasText(appointment.actualReceptionLocation) ||
      hasText(appointment.receptionScheduleNote) ||
      hasText(appointment.receptionPreparationNote)
    ) {
      internalArrangementCount += 1;
    }
    if (hasText(appointment.receptionist)) guideArrangementCount += 1;
  }

  return {
    filters: {
      period,
      year,
      quarter,
      month,
      granularity,
      availableYears,
      periodStart,
      periodEnd,
    },
    overview: {
      totalAppointments,
      todayAppointments,
      pendingAppointments,
      totalLeads,
      completedAppointments,
      monthAppointments,
      periodAppointments,
      periodLeadCount,
      periodCompletedAppointments,
      periodPendingAppointments,
      periodVisitorCount,
    },
    trend: Array.from(trendMap.entries()).map(([date, count]) => ({ date, count })),
    statusDistribution: Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      label: dashboardStatusLabels[status as AppointmentStatus],
      count,
    })),
    regionOverview,
    provinceRegionMap,
    customerProfile: {
      customerTypes: toDistribution(customerTypeMap),
      interestAreas: toDistribution(interestAreaMap),
    },
    receptionClosure: {
      receptionNoteCount,
      internalArrangementCount,
      guideArrangementCount,
      completedAppointments: receptionAppointments.filter((appointment) => appointment.status === "completed").length,
    },
    recentAppointments: recentAppointments.map((appointment) => {
      const region = appointment.province ? provinceToRegion.get(appointment.province) : null;
      return {
        id: appointment.id,
        appointmentNo: appointment.appointmentNo,
        companyName: appointment.companyName,
        contactName: appointment.contactName,
        showroomName: appointment.showroom.name,
        visitDate: appointment.visitDate,
        province: labelValue(appointment.province),
        regionName: region?.name || "未分区",
        customerType: labelValue(appointment.customerType, customerTypeLabels),
        interestAreas: splitInterestAreas(appointment.interestAreas)
          .map((item) => labelValue(item, interestAreaLabels))
          .join("、"),
        status: appointment.status,
        statusLabel: dashboardStatusLabels[appointment.status],
      };
    }),
  };
}

export type DashboardSummary = Awaited<ReturnType<typeof getDashboardSummary>>;
