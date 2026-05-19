import { NextResponse } from "next/server";
import type { AppointmentStatus, Prisma } from "@prisma/client";
import { getCurrentAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const appointmentStatuses = new Set(["pending", "approved", "rejected", "completed", "cancelled"]);

function isAppointmentStatus(value: string): value is AppointmentStatus {
  return appointmentStatuses.has(value);
}

function getDate(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return new Date(`${value}T00:00:00.000Z`);
}

export async function GET(request: Request) {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(Number(searchParams.get("page") || 1), 1);
  const pageSize = Math.min(Math.max(Number(searchParams.get("pageSize") || 10), 1), 50);
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

  const [total, list] = await Promise.all([
    prisma.appointment.count({ where }),
    prisma.appointment.findMany({
      where,
      include: {
        showroom: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    list,
    pagination: {
      page,
      pageSize,
      total,
      pageCount: Math.max(Math.ceil(total / pageSize), 1),
    },
  });
}
