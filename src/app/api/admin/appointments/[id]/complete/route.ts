import { NextResponse } from "next/server";
import { getCurrentAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
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
    select: { status: true },
  });

  if (!appointment) {
    return NextResponse.json({ error: "预约不存在" }, { status: 404 });
  }
  if (appointment.status !== "approved") {
    return NextResponse.json({ error: "只有已通过预约可以标记完成" }, { status: 400 });
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: "completed",
    },
  });

  return NextResponse.json({ appointment: updated });
}
