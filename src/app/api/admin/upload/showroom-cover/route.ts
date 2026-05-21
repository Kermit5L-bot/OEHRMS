import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCurrentAdminUser } from "@/lib/auth";

export const runtime = "nodejs";

const maxFileSize = 5 * 1024 * 1024;
const uploadDir = path.join(process.cwd(), "public", "uploads", "showrooms");
const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

function isValidImageBuffer(buffer: Buffer, mimeType: string) {
  if (mimeType === "image/jpeg") {
    return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (mimeType === "image/png") {
    return (
      buffer.length > 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  if (mimeType === "image/webp") {
    return (
      buffer.length > 12 &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }

  return false;
}

export async function POST(request: Request) {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "请上传图片文件" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "请选择要上传的图片" }, { status: 400 });
  }

  const extension = allowedTypes.get(file.type);
  if (!extension) {
    return NextResponse.json({ error: "仅支持 JPG、PNG、WebP 格式图片" }, { status: 400 });
  }

  if (file.size <= 0) {
    return NextResponse.json({ error: "上传文件不能为空" }, { status: 400 });
  }

  if (file.size > maxFileSize) {
    return NextResponse.json({ error: "图片大小不能超过 5MB" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!isValidImageBuffer(buffer, file.type)) {
    return NextResponse.json({ error: "图片文件格式不正确" }, { status: 400 });
  }

  await mkdir(uploadDir, { recursive: true });

  const filename = `${Date.now()}-${randomUUID()}.${extension}`;
  const targetPath = path.join(uploadDir, filename);
  await writeFile(targetPath, buffer);

  return NextResponse.json({
    url: `/uploads/showrooms/${filename}`,
  });
}
