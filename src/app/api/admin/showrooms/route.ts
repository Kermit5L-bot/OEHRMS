import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getCurrentAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isShowroomStatus, type ShowroomStatusValue } from "@/lib/showrooms";

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

function isShowroomType(value: unknown): value is "company" | "training_base" {
  return value === "company" || value === "training_base";
}

function parseSortOrder(value: unknown) {
  if (value === null || value === undefined || value === "") return 0;
  const sortOrder = Number(value);
  return Number.isInteger(sortOrder) ? sortOrder : null;
}

function parseShowroomPayload(payload: ShowroomPayload, defaultStatus: ShowroomStatusValue) {
  const name = trimRequired(payload.name);
  const city = trimRequired(payload.city);
  const type = payload.type;
  const summary = trimRequired(payload.summary);
  const status = isShowroomStatus(payload.status) ? payload.status : defaultStatus;
  const sortOrder = parseSortOrder(payload.sortOrder);

  if (!name) return { error: "请填写展厅名称" };
  if (!city) return { error: "请填写展厅地点" };
  if (!isShowroomType(type)) return { error: "请选择正确的展厅类型" };
  if (!summary) return { error: "请填写展厅简介" };
  if (sortOrder === null) return { error: "排序值必须是整数" };

  return {
    data: {
      name,
      city,
      type,
      coverImage: trimOptional(payload.coverImage),
      summary,
      description: trimOptional(payload.description),
      openingHours: trimOptional(payload.openingHours),
      suggestedDuration: trimOptional(payload.suggestedDuration),
      address: trimOptional(payload.address),
      status,
      sortOrder,
    },
  };
}

function revalidateShowroomPaths(showroomId?: number) {
  revalidatePath("/");
  revalidatePath("/showrooms");
  if (showroomId) revalidatePath(`/showrooms/${showroomId}`);
  revalidatePath("/admin/showrooms");
  revalidatePath("/admin/dashboard");
}

export async function GET(request: Request) {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const where = isShowroomStatus(status)
    ? { status }
    : {
        status: {
          not: "deleted",
        },
      };

  const showrooms = await prisma.showroom.findMany({
    where: where as Prisma.ShowroomWhereInput,
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ list: showrooms });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  let payload: ShowroomPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "请求参数格式不正确" }, { status: 400 });
  }

  const parsed = parseShowroomPayload(payload, "hidden");
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const showroom = await prisma.showroom.create({
      data: parsed.data as Prisma.ShowroomCreateInput,
    });

    revalidateShowroomPaths(showroom.id);
    return NextResponse.json({ showroom }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "展厅名称已存在" }, { status: 400 });
    }

    return NextResponse.json({ error: "展厅创建失败，请稍后重试" }, { status: 500 });
  }
}
