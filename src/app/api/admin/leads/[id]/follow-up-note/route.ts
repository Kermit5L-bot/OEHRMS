import { NextResponse } from "next/server";
import { getCurrentAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id } = await params;
  const leadId = Number(id);
  if (!Number.isInteger(leadId) || leadId <= 0) {
    return NextResponse.json({ error: "留资不存在" }, { status: 404 });
  }

  const payload = await request.json().catch(() => ({}));
  const followUpNote = typeof payload.followUpNote === "string" ? payload.followUpNote.trim() : null;

  const existingLead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { id: true },
  });
  if (!existingLead) {
    return NextResponse.json({ error: "留资不存在" }, { status: 404 });
  }

  const lead = await prisma.lead.update({
    where: { id: leadId },
    data: {
      followUpNote,
    },
  });

  return NextResponse.json({ lead });
}
