import { NextResponse } from "next/server";
import { getDashboardSummary } from "@/lib/admin-dashboard";
import { getCurrentAdminUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const summary = await getDashboardSummary();
  return NextResponse.json(summary);
}
