import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getCurrentAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isShowroomStatus } from "@/lib/showrooms";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function revalidateShowroomPaths(showroomId?: number) {
  revalidatePath("/");
  revalidatePath("/showrooms");
  if (showroomId) revalidatePath(`/showrooms/${showroomId}`);
  revalidatePath("/admin/showrooms");
  revalidatePath("/admin/dashboard");
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id } = await params;
  const showroomId = Number(id);
  if (!Number.isInteger(showroomId) || showroomId <= 0) {
    return NextResponse.json({ error: "展厅不存在" }, { status: 404 });
  }

  const payload = await request.json().catch(() => ({}));
  if (!isShowroomStatus(payload.status)) {
    return NextResponse.json({ error: "请选择正确的展厅状态" }, { status: 400 });
  }

  try {
    const showroom = await prisma.showroom.update({
      where: { id: showroomId },
      data: {
        status: payload.status,
      } as Prisma.ShowroomUpdateInput,
    });

    revalidateShowroomPaths(showroom.id);
    return NextResponse.json({ showroom });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "展厅不存在" }, { status: 404 });
    }

    return NextResponse.json({ error: "状态更新失败，请稍后重试" }, { status: 500 });
  }
}
