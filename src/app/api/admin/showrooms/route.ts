import { NextResponse } from "next/server";
import { getCurrentAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const showrooms = await prisma.showroom.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ list: showrooms });
}
