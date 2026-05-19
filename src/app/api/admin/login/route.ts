import { NextResponse } from "next/server";
import {
  adminSessionCookieName,
  createAdminSessionValue,
  getAdminSessionMaxAge,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type LoginPayload = {
  username?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  let payload: LoginPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "用户名或密码错误" }, { status: 400 });
  }

  const username = typeof payload.username === "string" ? payload.username.trim() : "";
  const password = typeof payload.password === "string" ? payload.password : "";

  if (!username || !password) {
    return NextResponse.json({ error: "用户名或密码错误" }, { status: 400 });
  }

  const user = await prisma.adminUser.findUnique({
    where: { username },
  });

  if (!user || user.status !== "active" || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
  }

  const response = NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      realName: user.realName,
    },
  });
  response.cookies.set({
    name: adminSessionCookieName,
    value: createAdminSessionValue({
      userId: user.id,
      username: user.username,
      realName: user.realName,
    }),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: getAdminSessionMaxAge(),
  });

  return response;
}
