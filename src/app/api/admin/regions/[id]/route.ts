import { NextResponse } from "next/server";
import { getCurrentAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getRegionManagementData,
  getValidUniqueProvinces,
  isValidRegionColor,
  parseRegionSortOrder,
} from "@/lib/regions";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type RegionPayload = {
  name?: unknown;
  color?: unknown;
  sortOrder?: unknown;
  provinces?: unknown;
};

function trimRequired(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function getRegionId(params: RouteContext["params"]) {
  const { id } = await params;
  const regionId = Number(id);
  return Number.isInteger(regionId) && regionId > 0 ? regionId : null;
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

export async function PUT(request: Request, { params }: RouteContext) {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const regionId = await getRegionId(params);
  if (!regionId) {
    return NextResponse.json({ error: "区域不存在" }, { status: 404 });
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
    const result = await prisma.$executeRaw`
      UPDATE regions
      SET name = ${name}, color = ${color}, sort_order = ${sortOrder}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${regionId}
    `;
    if (Number(result) === 0) {
      return NextResponse.json({ error: "区域不存在" }, { status: 404 });
    }
    await saveProvinceBindings(regionId, provinces);

    return NextResponse.json(await getRegionManagementData());
  } catch {
    return NextResponse.json({ error: "区域保存失败，请确认名称没有重复" }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const regionId = await getRegionId(params);
  if (!regionId) {
    return NextResponse.json({ error: "区域不存在" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`DELETE FROM province_regions WHERE region_id = ${regionId}`;
    await tx.$executeRaw`DELETE FROM regions WHERE id = ${regionId}`;
  });

  return NextResponse.json(await getRegionManagementData());
}
