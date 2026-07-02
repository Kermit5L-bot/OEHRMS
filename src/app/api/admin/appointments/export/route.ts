import type { AppointmentStatus, Prisma } from "@prisma/client";
import { appointmentExcelFieldLabels, appointmentExcelHeaders } from "@/lib/appointment-excel-fields";
import { appointmentStatusLabels, formatDate, formatDateTime } from "@/lib/admin-appointments";
import {
  getCustomerTypeLabel,
  getInterestAreaLabels,
  getProvinceLabel,
  getSolutionConsultingLabel,
  getVisitTimeSlotLabel,
} from "@/lib/appointments";
import { getCurrentAdminUser } from "@/lib/auth";
import { createExcelResponse } from "@/lib/excel-export";
import { prisma } from "@/lib/prisma";

const appointmentStatuses = new Set(["pending", "approved", "rejected", "completed", "cancelled"]);

function isAppointmentStatus(value: string): value is AppointmentStatus {
  return appointmentStatuses.has(value);
}

function getDate(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return new Date(`${value}T00:00:00.000Z`);
}

function getRequestOptionLabel(value?: string | boolean | null) {
  if (value === true || value === "yes") return "需要";
  if (value === false || value === "no") return "不需要";
  if (value === "pending") return "待确认";
  return value || "-";
}

export async function GET(request: Request) {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    return Response.json({ error: "未授权" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
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

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      showroom: { select: { name: true } },
      approvedBy: { select: { realName: true, username: true } },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  const labels = appointmentExcelFieldLabels;

  return createExcelResponse(
    {
      name: "预约管理",
      columns: [...appointmentExcelHeaders],
      rows: appointments.map((appointment) => {
        const row: Record<string, string | number | null | undefined> = {
          [labels.appointmentNo]: appointment.appointmentNo,
          [labels.showroom]: appointment.showroom.name,
          [labels.visitDate]: formatDate(appointment.visitDate),
          [labels.visitTimeSlot]: getVisitTimeSlotLabel(appointment.visitTimeSlot),
          [labels.visitorCount]: appointment.visitorCount,
          [labels.contactName]: appointment.contactName,
          [labels.contactPhone]: appointment.contactPhone,
          [labels.companyName]: appointment.companyName,
          [labels.position]: appointment.position,
          [labels.province]: getProvinceLabel(appointment.province),
          [labels.internalContactInfo]: appointment.internalContactInfo,
          [labels.customerLevel]: appointment.customerLevel,
          [labels.mainVisitorInfo]: appointment.mainVisitorInfo,
          [labels.customerType]: getCustomerTypeLabel(appointment.customerType),
          [labels.interestAreas]: getInterestAreaLabels(appointment.interestAreas),
          [labels.needSolutionConsulting]: getSolutionConsultingLabel(appointment.needSolutionConsulting),
          [labels.needGuide]: getRequestOptionLabel(appointment.needGuide),
          [labels.visitPurpose]: appointment.visitPurpose,
          [labels.customerRemark]: appointment.customerRemark,
          [labels.receptionist]: appointment.receptionist,
          [labels.receptionNote]: appointment.receptionNote,
          [labels.actualReceptionLocation]: appointment.actualReceptionLocation,
          [labels.visitStartTime]: formatDateTime(appointment.visitStartTime),
          [labels.visitEndTime]: formatDateTime(appointment.visitEndTime),
          [labels.needVehicle]: getRequestOptionLabel(appointment.needVehicle),
          [labels.vehicleRequirement]: appointment.vehicleRequirement,
          [labels.needAccommodation]: getRequestOptionLabel(appointment.needAccommodation),
          [labels.accommodationRequirement]: appointment.accommodationRequirement,
          [labels.needDining]: getRequestOptionLabel(appointment.needDining),
          [labels.diningRequirement]: appointment.diningRequirement,
          [labels.giftPreparation]: getRequestOptionLabel(appointment.giftPreparation),
          [labels.giftRequirement]: appointment.giftRequirement,
          [labels.receptionScheduleNote]: appointment.receptionScheduleNote,
          [labels.receptionPreparationNote]: appointment.receptionPreparationNote,
          [labels.followUpNote]: appointment.followUpNote,
          [labels.status]: appointmentStatusLabels[appointment.status],
          [labels.approvedBy]: appointment.approvedBy?.realName || appointment.approvedBy?.username,
          [labels.approvedAt]: formatDateTime(appointment.approvedAt),
          [labels.approvalOpinion]: appointment.approvalOpinion,
          [labels.rejectReason]: appointment.rejectReason,
          [labels.createdAt]: formatDateTime(appointment.createdAt),
        };

        return appointmentExcelHeaders.map((header) => row[header] ?? "");
      }),
    },
    `预约管理导出-${new Date().toISOString().slice(0, 10)}.xls`,
  );
}
