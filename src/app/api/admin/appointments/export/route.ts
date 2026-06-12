import type { AppointmentStatus, Prisma } from "@prisma/client";
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

function getSimpleOptionLabel(value?: string | null) {
  if (value === "yes") return "是";
  if (value === "no") return "否";
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

  return createExcelResponse(
    {
      name: "预约管理",
      columns: [
        "预约编号",
        "展厅",
        "参观日期",
        "时间段",
        "客户姓名",
        "手机号",
        "公司名称",
        "职务",
        "所属省份",
        "内部对接人",
        "来访客户级别",
        "主要来访人员信息",
        "客户类型",
        "关注方向",
        "是否需要方案交流",
        "是否需要车辆接送",
        "车辆接送具体要求",
        "是否需要住宿安排",
        "住宿具体要求",
        "是否需要宴请安排",
        "宴请具体要求",
        "是否需要准备礼品",
        "礼品具体要求",
        "参观人数",
        "是否需要接待讲解",
        "参观目的",
        "客户备注",
        "状态",
        "审批人",
        "审批时间",
        "审批意见",
        "拒绝原因",
        "接待负责人",
        "接待备注",
        "跟进记录",
        "提交时间",
      ],
      rows: appointments.map((appointment) => [
        appointment.appointmentNo,
        appointment.showroom.name,
        formatDate(appointment.visitDate),
        getVisitTimeSlotLabel(appointment.visitTimeSlot),
        appointment.contactName,
        appointment.contactPhone,
        appointment.companyName,
        appointment.position,
        getProvinceLabel(appointment.province),
        appointment.internalContactInfo,
        appointment.customerLevel,
        appointment.mainVisitorInfo,
        getCustomerTypeLabel(appointment.customerType),
        getInterestAreaLabels(appointment.interestAreas),
        getSolutionConsultingLabel(appointment.needSolutionConsulting),
        getSimpleOptionLabel(appointment.needVehicle),
        appointment.vehicleRequirement,
        getSimpleOptionLabel(appointment.needAccommodation),
        appointment.accommodationRequirement,
        getSimpleOptionLabel(appointment.needDining),
        appointment.diningRequirement,
        getSimpleOptionLabel(appointment.giftPreparation),
        appointment.giftRequirement,
        appointment.visitorCount,
        getSimpleOptionLabel(appointment.needGuide ? "yes" : "no"),
        appointment.visitPurpose,
        appointment.customerRemark,
        appointmentStatusLabels[appointment.status],
        appointment.approvedBy?.realName || appointment.approvedBy?.username,
        formatDateTime(appointment.approvedAt),
        appointment.approvalOpinion,
        appointment.rejectReason,
        appointment.receptionist,
        appointment.receptionNote,
        appointment.followUpNote,
        formatDateTime(appointment.createdAt),
      ]),
    },
    `预约管理导出-${new Date().toISOString().slice(0, 10)}.xls`,
  );
}
