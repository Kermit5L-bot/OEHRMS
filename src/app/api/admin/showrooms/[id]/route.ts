import { NextResponse } from "next/server";
import { Prisma, type ShowroomStatus, type ShowroomType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getCurrentAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ShowroomPayload = {
  name?: unknown;
  city?: unknown;
  type?: unknown;
  coverImage?: unknown;
  summary?: unknown;
  description?: unknown;
  openingHours?: unknown;
  suggestedDuration?: unknown;
  address?: unknown;
  status?: unknown;
  sortOrder?: unknown;
};

function trimRequired(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function trimOptional(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isShowroomType(value: unknown): value is ShowroomType {
  return value === "company" || value === "training_base";
}

function isShowroomStatus(value: unknown): value is ShowroomStatus {
  return value === "open" || value === "closed";
}

export async function PUT(request: Request, context: RouteContext) {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id } = await context.params;
  const showroomId = Number(id);
  if (!Number.isInteger(showroomId) || showroomId <= 0) {
    return NextResponse.json({ error: "展厅不存在" }, { status: 404 });
  }

  let payload: ShowroomPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "请求参数格式不正确" }, { status: 400 });
  }

  const name = trimRequired(payload.name);
  const city = trimRequired(payload.city);
  const type = payload.type;
  const coverImage = trimOptional(payload.coverImage);
  const summary = trimRequired(payload.summary);
  const description = trimOptional(payload.description);
  const openingHours = trimOptional(payload.openingHours);
  const suggestedDuration = trimOptional(payload.suggestedDuration);
  const address = trimOptional(payload.address);
  const status = payload.status;
  const sortOrder = payload.sortOrder === null || payload.sortOrder === "" ? 0 : Number(payload.sortOrder);

  if (!name) {
    return NextResponse.json({ error: "请填写展厅名称" }, { status: 400 });
  }
  if (!city) {
    return NextResponse.json({ error: "请填写展厅地点" }, { status: 400 });
  }
  if (!isShowroomType(type)) {
    return NextResponse.json({ error: "请选择正确的展厅类型" }, { status: 400 });
  }
  if (!summary) {
    return NextResponse.json({ error: "请填写展厅简介" }, { status: 400 });
  }
  if (!isShowroomStatus(status)) {
    return NextResponse.json({ error: "请选择正确的开放状态" }, { status: 400 });
  }
  if (!Number.isInteger(sortOrder)) {
    return NextResponse.json({ error: "排序值必须是整数" }, { status: 400 });
  }

  try {
    const showroom = await prisma.showroom.update({
      where: { id: showroomId },
      data: {
        name,
        city,
        type,
        coverImage,
        summary,
        description,
        openingHours,
        suggestedDuration,
        address,
        status,
        sortOrder,
      },
    });

    revalidatePath("/");
    revalidatePath("/showrooms");
    revalidatePath(`/showrooms/${showroom.id}`);
    revalidatePath("/admin/showrooms");

    return NextResponse.json({ showroom });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json({ error: "展厅不存在" }, { status: 404 });
      }
      if (error.code === "P2002") {
        return NextResponse.json({ error: "展厅名称已存在" }, { status: 400 });
      }
    }

    return NextResponse.json({ error: "展厅保存失败，请稍后重试" }, { status: 500 });
  }
}
