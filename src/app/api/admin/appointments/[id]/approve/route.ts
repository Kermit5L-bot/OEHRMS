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
  if (appointment.status !== "pending") {
    return NextResponse.json({ error: "只有待审批预约可以审批通过" }, { status: 400 });
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: "approved",
      approvedById: currentUser.id,
      approvedAt: new Date(),
      approvalOpinion: trimOptional(payload.approvalOpinion),
      receptionist: trimOptional(payload.receptionist),
      receptionNote: trimOptional(payload.receptionNote),
    },
  });

  return NextResponse.json({ appointment: updated });
}
