import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getCurrentAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type BulkDeletePayload = {
  ids?: unknown;
};

function parseIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  );
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
      await tx.appointment.updateMany({
        where: { leadId: lead.id },
        data: { leadId: null },
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

export async function POST(request: Request) {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  let payload: BulkDeletePayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "请求参数格式不正确" }, { status: 400 });
  }

  const ids = parseIds(payload.ids);
  if (ids.length === 0) {
    return NextResponse.json({ error: "请选择要删除的预约" }, { status: 400 });
  }
  if (ids.length > 200) {
    return NextResponse.json({ error: "单次最多删除 200 条预约" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const appointments = await tx.appointment.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          contactPhone: true,
        },
      });
      const appointmentIds = appointments.map((appointment) => appointment.id);
      const contactPhones = Array.from(new Set(appointments.map((appointment) => appointment.contactPhone)));

      if (appointmentIds.length === 0) {
        return { deletedCount: 0 };
      }

      await tx.lead.updateMany({
        where: { latestAppointmentId: { in: appointmentIds } },
        data: {
          latestAppointmentId: null,
          latestShowroomId: null,
        },
      });

      const deleteResult = await tx.appointment.deleteMany({
        where: { id: { in: appointmentIds } },
      });

      for (const contactPhone of contactPhones) {
        await syncLeadForPhone(tx, contactPhone);
      }

      return { deletedCount: deleteResult.count };
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "批量删除预约失败，请稍后重试" }, { status: 500 });
  }
}
