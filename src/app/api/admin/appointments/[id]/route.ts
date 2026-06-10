import { NextResponse } from "next/server";
import { getCurrentAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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
              industry: latestAppointment.industry,
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
