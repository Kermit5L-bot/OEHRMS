import { NextResponse } from "next/server";
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
    return NextResponse.json({ error: "请选择要删除的留资" }, { status: 400 });
  }
  if (ids.length > 200) {
    return NextResponse.json({ error: "单次最多删除 200 条留资" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const leads = await tx.lead.findMany({
        where: { id: { in: ids } },
        select: { id: true },
      });
      const leadIds = leads.map((lead) => lead.id);

      if (leadIds.length === 0) {
        return { deletedCount: 0 };
      }

      await tx.appointment.updateMany({
        where: { leadId: { in: leadIds } },
        data: { leadId: null },
      });

      const deleteResult = await tx.lead.deleteMany({
        where: { id: { in: leadIds } },
      });

      return { deletedCount: deleteResult.count };
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "批量删除留资失败，请稍后重试" }, { status: 500 });
  }
}
