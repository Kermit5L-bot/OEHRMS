import { NextResponse } from "next/server";
import { getCurrentAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getRegionManagementData,
  getValidUniqueProvinces,
  isValidRegionColor,
  parseRegionSortOrder,
} from "@/lib/regions";

type RegionPayload = {
  name?: unknown;
  color?: unknown;
  sortOrder?: unknown;
  provinces?: unknown;
};

function trimRequired(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function saveProvinceBindings(regionId: number, provinces: string[]) {
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
}

export async function GET() {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  return NextResponse.json(await getRegionManagementData());
}

export async function POST(request: Request) {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  let payload: RegionPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "请求参数格式不正确" }, { status: 400 });
  }

  const name = trimRequired(payload.name);
  const color = isValidRegionColor(payload.color) ? payload.color : "#2563eb";
  const sortOrder = parseRegionSortOrder(payload.sortOrder);
  const provinces = getValidUniqueProvinces(payload.provinces);

  if (!name) {
    return NextResponse.json({ error: "请填写区域名称" }, { status: 400 });
  }
  if (sortOrder === null) {
    return NextResponse.json({ error: "排序值必须是整数" }, { status: 400 });
  }

  try {
    const rows = await prisma.$queryRaw<{ id: number }[]>`
      INSERT INTO regions (name, color, sort_order, created_at, updated_at)
      VALUES (${name}, ${color}, ${sortOrder}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id
    `;
    const regionId = rows[0]?.id;
    if (regionId) {
      await saveProvinceBindings(regionId, provinces);
    }

    return NextResponse.json(await getRegionManagementData(), { status: 201 });
  } catch {
    return NextResponse.json({ error: "区域创建失败，请确认名称没有重复" }, { status: 400 });
  }
}
