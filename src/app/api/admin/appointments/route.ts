import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import type { AppointmentStatus } from "@prisma/client";
import { getCurrentAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  formatDateForAppointmentNo,
  getTodayDateString,
  isValidCustomerType,
  isValidSolutionConsulting,
  isValidVisitTimeSlot,
  normalizeInterestAreas,
  phonePattern,
} from "@/lib/appointments";

const appointmentStatuses = new Set(["pending", "approved", "rejected", "completed", "cancelled"]);

function isAppointmentStatus(value: string): value is AppointmentStatus {
  return appointmentStatuses.has(value);
}

function getDate(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return new Date(`${value}T00:00:00.000Z`);
}

type AppointmentPayload = {
  showroomId?: unknown;
  visitDate?: unknown;
  visitTimeSlot?: unknown;
  visitorCount?: unknown;
  contactName?: unknown;
  contactPhone?: unknown;
  companyName?: unknown;
  position?: unknown;
  internalContactInfo?: unknown;
  customerLevel?: unknown;
  mainVisitorInfo?: unknown;
  industry?: unknown;
  customerType?: unknown;
  interestAreas?: unknown;
  needSolutionConsulting?: unknown;
  needVehicle?: unknown;
  vehicleRequirement?: unknown;
  needAccommodation?: unknown;
  accommodationRequirement?: unknown;
  needDining?: unknown;
  diningRequirement?: unknown;
  giftPreparation?: unknown;
  giftRequirement?: unknown;
  visitPurpose?: unknown;
  needGuide?: unknown;
  customerRemark?: unknown;
};

function trimOptional(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function trimRequired(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getVisitDate(value: unknown) {
  if (typeof value !== "string") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  return value;
}

async function generateAppointmentNo(tx: Prisma.TransactionClient) {
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

export async function GET(request: Request) {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(Number(searchParams.get("page") || 1), 1);
  const pageSize = Math.min(Math.max(Number(searchParams.get("pageSize") || 10), 1), 50);
  const status = searchParams.get("status");
  const showroomId = Number(searchParams.get("showroomId") || "");
  const startDate = getDate(searchParams.get("startDate"));
  const endDate = getDate(searchParams.get("endDate"));
  const keyword = (searchParams.get("keyword") || "").trim();

  const where: Prisma.AppointmentWhereInput = {};
  if (status && isAppointmentStatus(status)) where.status = status;
  if (Number.isInteger(showroomId) && showroomId > 0) where.showroomId = showroomId;
  if (startDate || endDate) {
    where.visitDate = {
      ...(startDate ? { gte: startDate } : {}),
      ...(endDate ? { lte: endDate } : {}),
    };
  }
  if (keyword) {
    where.OR = [
      { contactName: { contains: keyword } },
      { contactPhone: { contains: keyword } },
      { companyName: { contains: keyword } },
    ];
  }

  const [total, list] = await Promise.all([
    prisma.appointment.count({ where }),
    prisma.appointment.findMany({
      where,
      include: {
        showroom: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    list,
    pagination: {
      page,
      pageSize,
      total,
      pageCount: Math.max(Math.ceil(total / pageSize), 1),
    },
  });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  let payload: AppointmentPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "请求参数格式不正确" }, { status: 400 });
  }

  const showroomId = Number(payload.showroomId);
  const visitDate = getVisitDate(payload.visitDate);
  const visitTimeSlot = payload.visitTimeSlot;
  const visitorCount = Number(payload.visitorCount);
  const contactName = trimRequired(payload.contactName);
  const contactPhone = trimRequired(payload.contactPhone);
  const companyName = trimRequired(payload.companyName);
  const position = trimOptional(payload.position);
  const internalContactInfo = trimOptional(payload.internalContactInfo);
  const customerLevel = trimOptional(payload.customerLevel);
  const mainVisitorInfo = trimOptional(payload.mainVisitorInfo);
  const industry = trimOptional(payload.industry);
  const customerType = isValidCustomerType(payload.customerType) ? payload.customerType : null;
  const interestAreas = normalizeInterestAreas(payload.interestAreas);
  const needSolutionConsulting = isValidSolutionConsulting(payload.needSolutionConsulting)
    ? payload.needSolutionConsulting
    : null;
  const needVehicle = trimOptional(payload.needVehicle);
  const vehicleRequirement = trimOptional(payload.vehicleRequirement);
  const needAccommodation = trimOptional(payload.needAccommodation);
  const accommodationRequirement = trimOptional(payload.accommodationRequirement);
  const needDining = trimOptional(payload.needDining);
  const diningRequirement = trimOptional(payload.diningRequirement);
  const giftPreparation = trimOptional(payload.giftPreparation);
  const giftRequirement = trimOptional(payload.giftRequirement);
  const visitPurpose = trimOptional(payload.visitPurpose);
  const customerRemark = trimOptional(payload.customerRemark);
  const needGuide = typeof payload.needGuide === "boolean" ? payload.needGuide : true;

  if (!Number.isInteger(showroomId) || showroomId <= 0) {
    return NextResponse.json({ error: "请选择预约展厅" }, { status: 400 });
  }
  if (!visitDate) {
    return NextResponse.json({ error: "请选择正确的参观日期" }, { status: 400 });
  }
  if (visitDate < getTodayDateString()) {
    return NextResponse.json({ error: "参观日期不能早于今天" }, { status: 400 });
  }
  if (!isValidVisitTimeSlot(visitTimeSlot)) {
    return NextResponse.json({ error: "请选择参观时间段" }, { status: 400 });
  }
  if (!Number.isInteger(visitorCount) || visitorCount < 1) {
    return NextResponse.json({ error: "参观人数至少为 1 人" }, { status: 400 });
  }
  if (!contactName) {
    return NextResponse.json({ error: "请填写客户姓名" }, { status: 400 });
  }
  if (!phonePattern.test(contactPhone)) {
    return NextResponse.json({ error: "请输入正确的手机号码" }, { status: 400 });
  }
  if (!companyName) {
    return NextResponse.json({ error: "请填写公司名称" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const showroom = await tx.showroom.findUnique({
        where: { id: showroomId },
      });

      if (!showroom || showroom.status === "deleted") {
        throw new Error("SHOWROOM_NOT_FOUND");
      }

      const existingLead = await tx.lead.findUnique({
        where: { contactPhone },
      });
      const appointmentNo = await generateAppointmentNo(tx);
      const appointment = await tx.appointment.create({
        data: {
          appointmentNo,
          showroomId,
          leadId: existingLead?.id,
          visitDate: new Date(`${visitDate}T00:00:00.000Z`),
          visitTimeSlot,
          visitorCount,
          contactName,
          contactPhone,
          companyName,
          position,
          internalContactInfo,
          customerLevel,
          mainVisitorInfo,
          industry,
          customerType,
          interestAreas,
          needSolutionConsulting,
          needVehicle,
          vehicleRequirement,
          needAccommodation,
          accommodationRequirement,
          needDining,
          diningRequirement,
          giftPreparation,
          giftRequirement,
          visitPurpose,
          needGuide,
          customerRemark,
          status: "pending",
        },
      });

      if (existingLead) {
        await tx.lead.update({
          where: { id: existingLead.id },
          data: {
            contactName,
            companyName,
            position,
            industry,
            customerType,
            interestAreas,
            needSolutionConsulting,
            latestShowroomId: showroomId,
            latestAppointmentId: appointment.id,
            appointmentCount: {
              increment: 1,
            },
          },
        });
      } else {
        const lead = await tx.lead.create({
          data: {
            contactName,
            contactPhone,
            companyName,
            position,
            industry,
            customerType,
            interestAreas,
            needSolutionConsulting,
            latestShowroomId: showroomId,
            latestAppointmentId: appointment.id,
            appointmentCount: 1,
          },
        });

        await tx.appointment.update({
          where: { id: appointment.id },
          data: {
            leadId: lead.id,
          },
        });
      }

      return appointment;
    });

    return NextResponse.json({ appointment: result }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "SHOWROOM_NOT_FOUND") {
      return NextResponse.json({ error: "预约展厅不存在" }, { status: 404 });
    }

    return NextResponse.json({ error: "预约创建失败，请稍后重试" }, { status: 500 });
  }
}
