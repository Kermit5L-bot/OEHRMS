import { cookies } from "next/headers";
import { createHmac, timingSafeEqual, pbkdf2Sync } from "node:crypto";
import { prisma } from "@/lib/prisma";

export const adminSessionCookieName = "oehrms_admin_session";

const sessionMaxAgeSeconds = 60 * 60 * 8;

type SessionPayload = {
  userId: number;
  username: string;
  realName: string;
  exp: number;
};

export type CurrentAdminUser = {
  id: number;
  username: string;
  realName: string;
  role: string;
  status: string;
};

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || "dev-only-change-this-admin-session-secret";
}

function toBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

export function verifyPassword(password: string, passwordHash: string) {
  const [scheme, digest, iterationsText, salt, hash] = passwordHash.split(":");
  const iterations = Number(iterationsText);

  if (scheme !== "pbkdf2" || !digest || !Number.isInteger(iterations) || !salt || !hash) {
    return false;
  }

  const candidate = pbkdf2Sync(password, salt, iterations, Buffer.from(hash, "hex").length, digest).toString("hex");
  const candidateBuffer = Buffer.from(candidate, "hex");
  const hashBuffer = Buffer.from(hash, "hex");

  return candidateBuffer.length === hashBuffer.length && timingSafeEqual(candidateBuffer, hashBuffer);
}

export function createAdminSessionValue(payload: Omit<SessionPayload, "exp">) {
  const session: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + sessionMaxAgeSeconds,
  };
  const body = toBase64Url(JSON.stringify(session));
  const signature = sign(body);

  return `${body}.${signature}`;
}

export function parseAdminSessionValue(value?: string) {
  if (!value) return null;

  const [body, signature] = value.split(".");
  if (!body || !signature || sign(body) !== signature) return null;

  try {
    const payload = JSON.parse(fromBase64Url(body)) as SessionPayload;
    if (!payload.userId || !payload.username || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function getCurrentAdminUser(): Promise<CurrentAdminUser | null> {
  const cookieStore = await cookies();
  const session = parseAdminSessionValue(cookieStore.get(adminSessionCookieName)?.value);
  if (!session) return null;

  const user = await prisma.adminUser.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      username: true,
      realName: true,
      role: true,
      status: true,
    },
  });

  if (!user || user.status !== "active") {
    return null;
  }

  return user;
}

export function getAdminSessionMaxAge() {
  return sessionMaxAgeSeconds;
}
