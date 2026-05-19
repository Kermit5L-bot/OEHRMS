import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import {
  formatDateForAppointmentNo,
  getTodayDateString,
  isValidVisitTimeSlot,
  maskPhone,
  phonePattern,
} from "@/lib/appointments";
import { prisma } from "@/lib/prisma";

type AppointmentPayload = {
  showroomId?: unknown;
  visitDate?: unknown;
  visitTimeSlot?: unknown;
  visitorCount?: unknown;
  contactName?: unknown;
  contactPhone?: unknown;
  companyName?: unknown;
  position?: unknown;
  industry?: unknown;
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

export async function POST(request: Request) {
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
  const industry = trimOptional(payload.industry);
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

      if (!showroom) {
        throw new Error("SHOWROOM_NOT_FOUND");
      }
      if (showroom.status === "closed") {
        throw new Error("SHOWROOM_CLOSED");
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
          industry,
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

      return {
        appointmentNo: appointment.appointmentNo,
        showroomName: showroom.name,
        visitDate,
        visitTimeSlot,
        contactName,
        maskedPhone: maskPhone(contactPhone),
        status: appointment.status,
      };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "SHOWROOM_NOT_FOUND") {
      return NextResponse.json({ error: "预约展厅不存在" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "SHOWROOM_CLOSED") {
      return NextResponse.json({ error: "该展厅暂不开放预约" }, { status: 400 });
    }

    return NextResponse.json({ error: "预约提交失败，请稍后重试" }, { status: 500 });
  }
}
