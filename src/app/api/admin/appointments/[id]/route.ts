import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getCurrentAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isValidCustomerType,
  isValidInterestArea,
  isValidProvince,
  isValidSolutionConsulting,
  isValidVisitTimeSlot,
  normalizeInterestAreas,
  phonePattern,
} from "@/lib/appointments";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type AppointmentUpdatePayload = {
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
  province?: unknown;
  customerType?: unknown;
  interestAreas?: unknown;
  needSolutionConsulting?: unknown;
  visitPurpose?: unknown;
  needGuide?: unknown;
  customerRemark?: unknown;
  receptionist?: unknown;
  receptionNote?: unknown;
  followUpNote?: unknown;
  actualReceptionLocation?: unknown;
  visitStartTime?: unknown;
  visitEndTime?: unknown;
  receptionScheduleNote?: unknown;
  receptionPreparationNote?: unknown;
  needVehicle?: unknown;
  vehicleRequirement?: unknown;
  needAccommodation?: unknown;
  accommodationRequirement?: unknown;
  needDining?: unknown;
  diningRequirement?: unknown;
  giftPreparation?: unknown;
  giftRequirement?: unknown;
};

function trimRequired(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function trimOptional(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseRequestStatus(value: unknown) {
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (value === "yes" || value === "no" || value === "pending") return value;
  return "pending";
}

function parseVisitDate(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseDateTime(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function validateInterestAreas(value: unknown) {
  if (!Array.isArray(value)) return true;
  return value.every(isValidInterestArea);
}

async function syncLeadForPhone(tx: Prisma.TransactionClient, contactPhone: string) {
  const lead = await tx.lead.findUnique({
    where: { contactPhone },
    select: { id: true },
  });
  const [appointmentCount, latestAppointment] = await Promise.all([
    tx.appointment.count({ where: { contactPhone } }),
    tx.appointment.findFirst({
      where: { contactPhone },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!latestAppointment || appointmentCount === 0) {
    if (lead) {
      await tx.lead.update({
        where: { id: lead.id },
        data: {
          latestAppointmentId: null,
          latestShowroomId: null,
        },
      });
      await tx.lead.delete({ where: { id: lead.id } });
    }
    return;
  }

  const leadData = {
    contactName: latestAppointment.contactName,
    companyName: latestAppointment.companyName,
    position: latestAppointment.position,
    province: latestAppointment.province,
    customerType: latestAppointment.customerType,
    interestAreas: latestAppointment.interestAreas,
    needSolutionConsulting: latestAppointment.needSolutionConsulting,
    latestShowroomId: latestAppointment.showroomId,
    latestAppointmentId: latestAppointment.id,
    appointmentCount,
  };

  if (lead) {
    await tx.lead.update({
      where: { id: lead.id },
      data: leadData,
    });
    await tx.appointment.updateMany({
      where: { contactPhone, leadId: null },
      data: { leadId: lead.id },
    });
    return;
  }

  const createdLead = await tx.lead.create({
    data: {
      contactPhone,
      ...leadData,
    },
  });
  await tx.appointment.updateMany({
    where: { contactPhone },
    data: { leadId: createdLead.id },
  });
}

export async function GET(_request: Request, { params }: RouteContext) {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id } = await params;
  const appointmentId = Number(id);
  if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
    return NextResponse.json({ error: "预约不存在" }, { status: 404 });
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      showroom: true,
      approvedBy: {
        select: {
          id: true,
          username: true,
          realName: true,
        },
      },
    },
  });

  if (!appointment) {
    return NextResponse.json({ error: "预约不存在" }, { status: 404 });
  }

  return NextResponse.json({ appointment });
}

export async function PUT(request: Request, { params }: RouteContext) {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id } = await params;
  const appointmentId = Number(id);
  if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
    return NextResponse.json({ error: "预约不存在" }, { status: 404 });
  }

  let payload: AppointmentUpdatePayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "请求参数格式不正确" }, { status: 400 });
  }

  const visitDate = parseVisitDate(payload.visitDate);
  const visitTimeSlot = payload.visitTimeSlot;
  const visitorCount = Number(payload.visitorCount);
  const contactName = trimRequired(payload.contactName);
  const contactPhone = trimRequired(payload.contactPhone);
  const companyName = trimRequired(payload.companyName);
  const position = trimOptional(payload.position);
  const internalContactInfo = trimOptional(payload.internalContactInfo);
  const customerLevel = trimOptional(payload.customerLevel);
  const mainVisitorInfo = trimOptional(payload.mainVisitorInfo);
  const province = isValidProvince(payload.province) ? payload.province : null;
  const customerType = isValidCustomerType(payload.customerType) ? payload.customerType : null;
  const interestAreas = normalizeInterestAreas(payload.interestAreas);
  const needSolutionConsulting = isValidSolutionConsulting(payload.needSolutionConsulting)
    ? payload.needSolutionConsulting
    : null;
  const needGuideStatus = parseRequestStatus(payload.needGuide);
  const needGuide = needGuideStatus === "no" ? false : true;
  const visitPurpose = trimOptional(payload.visitPurpose);
  const customerRemark = trimOptional(payload.customerRemark);
  const receptionist = trimOptional(payload.receptionist);
  const receptionNote = trimOptional(payload.receptionNote);
  const followUpNote = trimOptional(payload.followUpNote);
  const actualReceptionLocation = trimOptional(payload.actualReceptionLocation);
  const visitStartTime = parseDateTime(payload.visitStartTime);
  const visitEndTime = parseDateTime(payload.visitEndTime);
  const receptionScheduleNote = trimOptional(payload.receptionScheduleNote);
  const receptionPreparationNote = trimOptional(payload.receptionPreparationNote);
  const needVehicle = trimOptional(payload.needVehicle);
  const vehicleRequirement = trimOptional(payload.vehicleRequirement);
  const needAccommodation = trimOptional(payload.needAccommodation);
  const accommodationRequirement = trimOptional(payload.accommodationRequirement);
  const needDining = trimOptional(payload.needDining);
  const diningRequirement = trimOptional(payload.diningRequirement);
  const giftPreparation = trimOptional(payload.giftPreparation);
  const giftRequirement = trimOptional(payload.giftRequirement);

  if (!visitDate) {
    return NextResponse.json({ error: "请选择正确的参观日期" }, { status: 400 });
  }
  if (!isValidVisitTimeSlot(visitTimeSlot)) {
    return NextResponse.json({ error: "请选择参观时间段" }, { status: 400 });
  }
  if (!Number.isInteger(visitorCount) || visitorCount < 1) {
    return NextResponse.json({ error: "参观人数至少为 1 人" }, { status: 400 });
  }
  if (!contactName) {
    return NextResponse.json({ error: "请填写联系人姓名" }, { status: 400 });
  }
  if (!phonePattern.test(contactPhone)) {
    return NextResponse.json({ error: "请输入正确的手机号码" }, { status: 400 });
  }
  if (!companyName) {
    return NextResponse.json({ error: "请填写公司名称" }, { status: 400 });
  }
  if (!internalContactInfo) {
    return NextResponse.json({ error: "请填写内部对接人" }, { status: 400 });
  }
  if (!province) {
    return NextResponse.json({ error: "请选择正确的所属省份" }, { status: 400 });
  }
  if (!customerType) {
    return NextResponse.json({ error: "请选择客户类型" }, { status: 400 });
  }
  if (!interestAreas) {
    return NextResponse.json({ error: "请至少选择一个关注方向" }, { status: 400 });
  }
  if (!validateInterestAreas(payload.interestAreas)) {
    return NextResponse.json({ error: "关注方向包含无效选项" }, { status: 400 });
  }

  try {
    const appointment = await prisma.$transaction(async (tx) => {
      const existingAppointment = await tx.appointment.findUnique({
        where: { id: appointmentId },
        select: {
          id: true,
          status: true,
          contactPhone: true,
        },
      });

      if (!existingAppointment) {
        throw new Error("APPOINTMENT_NOT_FOUND");
      }
      if (
        existingAppointment.status !== "pending" &&
        existingAppointment.status !== "approved" &&
        existingAppointment.status !== "completed"
      ) {
        throw new Error("APPOINTMENT_NOT_EDITABLE");
      }

      const targetLead = await tx.lead.findUnique({
        where: { contactPhone },
        select: { id: true },
      });

      const updatedAppointment = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          leadId: targetLead?.id ?? null,
          visitDate,
          visitTimeSlot,
          visitorCount,
          contactName,
          contactPhone,
          companyName,
          position,
          internalContactInfo,
          customerLevel,
          mainVisitorInfo,
          province,
          customerType,
          interestAreas,
          needSolutionConsulting,
          visitPurpose,
          needGuide,
          customerRemark,
          receptionist,
          receptionNote,
          followUpNote,
          actualReceptionLocation,
          visitStartTime,
          visitEndTime,
          receptionScheduleNote,
          receptionPreparationNote,
          needVehicle,
          vehicleRequirement,
          needAccommodation,
          accommodationRequirement,
          needDining,
          diningRequirement,
          giftPreparation,
          giftRequirement,
        },
        include: {
          showroom: true,
          approvedBy: {
            select: {
              id: true,
              username: true,
              realName: true,
            },
          },
        },
      });

      if (existingAppointment.contactPhone !== contactPhone) {
        await syncLeadForPhone(tx, existingAppointment.contactPhone);
      }
      await syncLeadForPhone(tx, contactPhone);

      return updatedAppointment;
    });

    return NextResponse.json({ appointment });
  } catch (error) {
    if (error instanceof Error && error.message === "APPOINTMENT_NOT_FOUND") {
      return NextResponse.json({ error: "预约不存在" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "APPOINTMENT_NOT_EDITABLE") {
      return NextResponse.json({ error: "当前预约状态不允许编辑" }, { status: 400 });
    }

    return NextResponse.json({ error: "预约保存失败，请稍后重试" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id } = await params;
  const appointmentId = Number(id);
  if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
    return NextResponse.json({ error: "预约不存在" }, { status: 404 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findUnique({
        where: { id: appointmentId },
        select: {
          id: true,
          contactPhone: true,
        },
      });

      if (!appointment) {
        throw new Error("APPOINTMENT_NOT_FOUND");
      }

      const lead = await tx.lead.findUnique({
        where: { contactPhone: appointment.contactPhone },
        select: {
          id: true,
          latestAppointmentId: true,
        },
      });

      if (lead?.latestAppointmentId === appointment.id) {
        await tx.lead.update({
          where: { id: lead.id },
          data: {
            latestAppointmentId: null,
            latestShowroomId: null,
          },
        });
      }

      await tx.appointment.delete({
        where: { id: appointment.id },
      });

      if (lead) {
        const [remainingCount, latestAppointment] = await Promise.all([
          tx.appointment.count({
            where: {
              contactPhone: appointment.contactPhone,
            },
          }),
          tx.appointment.findFirst({
            where: {
              contactPhone: appointment.contactPhone,
            },
            orderBy: {
              createdAt: "desc",
            },
          }),
        ]);

        if (!latestAppointment || remainingCount === 0) {
          await tx.lead.delete({
            where: { id: lead.id },
          });
        } else {
          await tx.lead.update({
            where: { id: lead.id },
            data: {
              contactName: latestAppointment.contactName,
              companyName: latestAppointment.companyName,
              position: latestAppointment.position,
              province: latestAppointment.province,
              customerType: latestAppointment.customerType,
              interestAreas: latestAppointment.interestAreas,
              needSolutionConsulting: latestAppointment.needSolutionConsulting,
              latestShowroomId: latestAppointment.showroomId,
              latestAppointmentId: latestAppointment.id,
              appointmentCount: remainingCount,
            },
          });
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "APPOINTMENT_NOT_FOUND") {
      return NextResponse.json({ error: "预约不存在" }, { status: 404 });
    }

    return NextResponse.json({ error: "预约删除失败，请稍后重试" }, { status: 500 });
  }
}
