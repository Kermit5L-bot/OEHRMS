import { NextResponse } from "next/server";
import { getCurrentAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRegionManagementData, getValidUniqueProvinces } from "@/lib/regions";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(request: Request, { params }: RouteContext) {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id } = await params;
  const regionId = Number(id);
  if (!Number.isInteger(regionId) || regionId <= 0) {
    return NextResponse.json({ error: "区域不存在" }, { status: 404 });
  }

  let payload: { provinces?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "请求参数格式不正确" }, { status: 400 });
  }

  const provinces = getValidUniqueProvinces(payload.provinces);
  const exists = await prisma.$queryRaw<{ id: number }[]>`
    SELECT id FROM regions WHERE id = ${regionId} LIMIT 1
  `;
  if (!exists[0]) {
    return NextResponse.json({ error: "区域不存在" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`DELETE FROM province_regions WHERE region_id = ${regionId}`;
    for (const province of provinces) {
      await tx.$executeRaw`
        INSERT INTO province_regions (province, region_id, created_at, updated_at)
        VALUES (${province}, ${regionId}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(province) DO UPDATE SET
          region_id = excluded.region_id,
          updated_at = CURRENT_TIMESTAMP
      `;
    }
  });

  return NextResponse.json(await getRegionManagementData());
}
