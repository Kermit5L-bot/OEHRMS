import { NextResponse } from "next/server";
import { getDashboardSummary, type DashboardFilters } from "@/lib/admin-dashboard";
import { getCurrentAdminUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function getDashboardParams(request: Request): DashboardFilters {
  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year"));
  const quarter = Number(searchParams.get("quarter"));
  const month = Number(searchParams.get("month"));
  const period = searchParams.get("period") || undefined;

  return {
    period: period === "year" || period === "quarter" || period === "month" ? period : undefined,
    year: Number.isInteger(year) ? year : undefined,
    quarter: quarter === 1 || quarter === 2 || quarter === 3 || quarter === 4 ? (quarter as 1 | 2 | 3 | 4) : undefined,
    month: Number.isInteger(month) && month >= 1 && month <= 12 ? month : undefined,
  };
}

export async function GET(request: Request) {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const summary = await getDashboardSummary(getDashboardParams(request));
  return NextResponse.json(summary);
}
