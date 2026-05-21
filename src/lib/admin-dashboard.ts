import type { AppointmentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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
  third_party_operator: "第三方运维商",
  industrial_company: "工业企业",
  partner: "集成商/合作伙伴",
  school: "高校",
  other: "其他",
};

const interestAreaLabels: Record<string, string> = {
  automatic_pollution_monitoring: "污染源自动监控",
  atmosphere_noise_environment: "大气与声环境",
  environmental_monitoring_digital: "环境监测数智化",
  offsite_smart_supervision: "非现场智慧监管执法",
  enterprise_environmental_risk: "企业环境风险管控",
  hazardous_solid_waste: "危固废",
  third_party_operation: "第三方运维",
  other: "其他",
};

const solutionConsultingLabels: Record<string, string> = {
  yes: "需要",
  no: "不需要",
  pending: "待沟通",
};

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

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

export async function getDashboardSummary() {
  const today = startOfToday();
  const tomorrow = addDays(today, 1);
  const monthStart = startOfMonth();
  const trendStart = addDays(today, -6);

  const [
    totalAppointments,
    todayAppointments,
    pendingAppointments,
    totalLeads,
    completedAppointments,
    monthAppointments,
    trendAppointments,
    statusGroups,
    showrooms,
    profileAppointments,
    receptionAppointments,
    recentAppointments,
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
      where: {
        createdAt: {
          gte: trendStart,
        },
      },
      select: {
        createdAt: true,
      },
    }),
    prisma.appointment.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    }),
    prisma.showroom.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            appointments: true,
          },
        },
      },
    }),
    prisma.appointment.findMany({
      select: {
        customerType: true,
        interestAreas: true,
        needSolutionConsulting: true,
      },
    }),
    prisma.appointment.findMany({
      select: {
        status: true,
        receptionNote: true,
        receptionist: true,
        followUpNote: true,
        applicantName: true,
        internalContactInfo: true,
        visitStartTime: true,
        visitEndTime: true,
        actualReceptionLocation: true,
        receptionScheduleNote: true,
        receptionPreparationNote: true,
        mainVisitorInfo: true,
      },
    }),
    prisma.appointment.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        showroom: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const trendMap = new Map<string, number>();
  for (let index = 0; index < 7; index += 1) {
    trendMap.set(formatDateKey(addDays(trendStart, index)), 0);
  }
  for (const appointment of trendAppointments) {
    const key = formatDateKey(appointment.createdAt);
    if (trendMap.has(key)) increment(trendMap, key);
  }

  const statusMap = new Map<string, number>();
  for (const status of Object.keys(dashboardStatusLabels) as AppointmentStatus[]) {
    statusMap.set(status, 0);
  }
  for (const item of statusGroups) {
    statusMap.set(item.status, item._count._all);
  }

  const customerTypeMap = new Map<string, number>();
  const interestAreaMap = new Map<string, number>();
  const solutionConsultingMap = new Map<string, number>();
  for (const appointment of profileAppointments) {
    increment(customerTypeMap, labelValue(appointment.customerType, customerTypeLabels));
    for (const area of splitInterestAreas(appointment.interestAreas)) {
      increment(interestAreaMap, labelValue(area, interestAreaLabels));
    }
    increment(solutionConsultingMap, labelValue(appointment.needSolutionConsulting, solutionConsultingLabels));
  }

  let receptionNoteCount = 0;
  let internalArrangementCount = 0;
  let guideArrangementCount = 0;
  for (const appointment of receptionAppointments) {
    if (hasText(appointment.receptionNote) || hasText(appointment.followUpNote)) receptionNoteCount += 1;
    if (
      hasText(appointment.applicantName) ||
      hasText(appointment.internalContactInfo) ||
      appointment.visitStartTime ||
      appointment.visitEndTime ||
      hasText(appointment.actualReceptionLocation) ||
      hasText(appointment.receptionScheduleNote) ||
      hasText(appointment.receptionPreparationNote)
    ) {
      internalArrangementCount += 1;
    }
    if (hasText(appointment.receptionist) || hasText(appointment.mainVisitorInfo)) guideArrangementCount += 1;
  }

  return {
    overview: {
      totalAppointments,
      todayAppointments,
      pendingAppointments,
      totalLeads,
      completedAppointments,
      monthAppointments,
    },
    trend: Array.from(trendMap.entries()).map(([date, count]) => ({ date, count })),
    statusDistribution: Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      label: dashboardStatusLabels[status as AppointmentStatus],
      count,
    })),
    showroomRanking: showrooms.map((showroom) => ({
      id: showroom.id,
      name: showroom.name,
      count: showroom._count.appointments,
    })),
    customerProfile: {
      customerTypes: toDistribution(customerTypeMap),
      interestAreas: toDistribution(interestAreaMap),
      solutionConsulting: toDistribution(solutionConsultingMap),
    },
    receptionClosure: {
      receptionNoteCount,
      internalArrangementCount,
      guideArrangementCount,
      completedAppointments,
    },
    recentAppointments: recentAppointments.map((appointment) => ({
      id: appointment.id,
      appointmentNo: appointment.appointmentNo,
      companyName: appointment.companyName,
      contactName: appointment.contactName,
      showroomName: appointment.showroom.name,
      visitDate: appointment.visitDate,
      customerType: labelValue(appointment.customerType, customerTypeLabels),
      interestAreas: splitInterestAreas(appointment.interestAreas)
        .map((item) => labelValue(item, interestAreaLabels))
        .join("、"),
      status: appointment.status,
      statusLabel: dashboardStatusLabels[appointment.status],
    })),
  };
}

export type DashboardSummary = Awaited<ReturnType<typeof getDashboardSummary>>;
