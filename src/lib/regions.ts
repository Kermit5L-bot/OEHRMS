import { prisma } from "@/lib/prisma";
import { provinceOptions } from "@/lib/appointments";

export type RegionRecord = {
  id: number;
  name: string;
  color: string;
  sortOrder: number;
  provinces: string[];
  createdAt: string;
  updatedAt: string;
};

type RegionRow = {
  id: number;
  name: string;
  color: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type ProvinceRegionRow = {
  regionId: number;
  province: string;
};

const provinceSet = new Set<string>(provinceOptions);
const colorPattern = /^#[0-9a-fA-F]{6}$/;

export function isValidProvinceName(value: unknown): value is string {
  return typeof value === "string" && provinceSet.has(value);
}

export function getValidUniqueProvinces(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter(isValidProvinceName)));
}

export function isValidRegionColor(value: unknown): value is string {
  return typeof value === "string" && colorPattern.test(value);
}

export function parseRegionSortOrder(value: unknown) {
  if (value === null || value === undefined || value === "") return 0;
  const sortOrder = Number(value);
  return Number.isInteger(sortOrder) ? sortOrder : null;
}

export async function getRegionManagementData() {
  const [regionRows, provinceRows] = await Promise.all([
    prisma.$queryRaw<RegionRow[]>`
      SELECT
        id,
        name,
        color,
        sort_order AS sortOrder,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM regions
      ORDER BY sort_order ASC, id ASC
    `,
    prisma.$queryRaw<ProvinceRegionRow[]>`
      SELECT
        region_id AS regionId,
        province
      FROM province_regions
      ORDER BY id ASC
    `,
  ]);

  const provinceMap = new Map<number, string[]>();
  const assignedProvinces = new Set<string>();
  for (const row of provinceRows) {
    assignedProvinces.add(row.province);
    provinceMap.set(row.regionId, [...(provinceMap.get(row.regionId) || []), row.province]);
  }

  const regions: RegionRecord[] = regionRows.map((region) => ({
    ...region,
    provinces: provinceMap.get(region.id) || [],
  }));
  const unassignedProvinces = provinceOptions.filter((province) => !assignedProvinces.has(province));

  return {
    regions,
    provinces: [...provinceOptions],
    unassignedProvinces,
  };
}
