import type { Prisma } from "@prisma/client";
import { formatDateTime } from "@/lib/admin-appointments";
import { getCustomerTypeLabel, getInterestAreaLabels, getProvinceLabel, getSolutionConsultingLabel } from "@/lib/appointments";
import { getCurrentAdminUser } from "@/lib/auth";
import { createExcelResponse } from "@/lib/excel-export";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    return Response.json({ error: "未授权" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const keyword = (searchParams.get("keyword") || "").trim();
  const where: Prisma.LeadWhereInput = {};

  if (keyword) {
    where.OR = [
      { contactName: { contains: keyword } },
      { contactPhone: { contains: keyword } },
      { companyName: { contains: keyword } },
    ];
  }

  const leads = await prisma.lead.findMany({
    where,
    include: {
      latestShowroom: { select: { name: true } },
      latestAppointment: { select: { createdAt: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return createExcelResponse(
    {
      name: "留资管理",
      columns: [
        "客户姓名",
        "手机号",
        "公司名称",
        "职务",
        "所属省份",
        "客户类型",
        "关注方向",
        "是否需要方案交流",
        "最近预约展厅",
        "最近预约时间",
        "预约次数",
        "跟进备注",
        "创建时间",
        "更新时间",
      ],
      rows: leads.map((lead) => [
        lead.contactName,
        lead.contactPhone,
        lead.companyName,
        lead.position,
        getProvinceLabel(lead.province),
        getCustomerTypeLabel(lead.customerType),
        getInterestAreaLabels(lead.interestAreas),
        getSolutionConsultingLabel(lead.needSolutionConsulting),
        lead.latestShowroom?.name,
        formatDateTime(lead.latestAppointment?.createdAt),
        lead.appointmentCount,
        lead.followUpNote,
        formatDateTime(lead.createdAt),
        formatDateTime(lead.updatedAt),
      ]),
    },
    `留资管理导出-${new Date().toISOString().slice(0, 10)}.xls`,
  );
}
