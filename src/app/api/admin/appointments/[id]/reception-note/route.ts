import { NextResponse } from "next/server";
import { getCurrentAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function trimOptional(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getOptionalDateTime(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function POST(request: Request, { params }: RouteContext) {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id } = await params;
  const appointmentId = Number(id);
  if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
    return NextResponse.json({ error: "预约不存在" }, { status: 404 });
  }

  const payload = await request.json().catch(() => ({}));
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { status: true },
  });

  if (!appointment) {
    return NextResponse.json({ error: "预约不存在" }, { status: 404 });
  }
  if (appointment.status === "cancelled") {
    return NextResponse.json({ error: "已取消预约不可编辑备注" }, { status: 400 });
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      receptionist: trimOptional(payload.receptionist),
      receptionNote: trimOptional(payload.receptionNote),
      followUpNote: trimOptional(payload.followUpNote),
      applicantName: trimOptional(payload.applicantName),
      internalContactInfo: trimOptional(payload.internalContactInfo),
      customerLevel: trimOptional(payload.customerLevel),
      mainVisitorInfo: trimOptional(payload.mainVisitorInfo),
      visitStartTime: getOptionalDateTime(payload.visitStartTime),
      visitEndTime: getOptionalDateTime(payload.visitEndTime),
      actualReceptionLocation: trimOptional(payload.actualReceptionLocation),
      needVehicle: trimOptional(payload.needVehicle),
      vehicleRequirement: trimOptional(payload.vehicleRequirement),
      needAccommodation: trimOptional(payload.needAccommodation),
      accommodationRequirement: trimOptional(payload.accommodationRequirement),
      needDining: trimOptional(payload.needDining),
      diningRequirement: trimOptional(payload.diningRequirement),
      giftPreparation: trimOptional(payload.giftPreparation),
      giftRequirement: trimOptional(payload.giftRequirement),
      receptionScheduleNote: trimOptional(payload.receptionScheduleNote),
      receptionPreparationNote: trimOptional(payload.receptionPreparationNote),
    },
  });

  return NextResponse.json({ appointment: updated });
}
