import type { Prisma } from "@prisma/client";
import { getCurrentAdminUser } from "@/lib/auth";
import {
  appointmentImportHeaders,
  generateCompletedAppointmentNo,
  normalizeImportText,
  parseAppointmentImportRow,
  type ParsedImportRow,
} from "@/lib/appointment-import";
import { prisma } from "@/lib/prisma";
import { readFirstXlsxSheetRows } from "@/lib/simple-xlsx";

export const runtime = "nodejs";

type ImportFailure = {
  row: number;
  reason: string;
};

function getHeaderMap(headerRow: unknown[]) {
  const map = new Map<string, number>();
  headerRow.forEach((cell, index) => {
    const header = normalizeImportText(cell);
    if (header) map.set(header, index);
  });
  return map;
}

function validateHeaders(headerMap: Map<string, number>) {
  const missing = appointmentImportHeaders.filter((header) => !headerMap.has(header));
  return missing.length > 0 ? `模板字段缺失：${missing.join("、")}` : null;
}

async function createCompletedAppointment(tx: Prisma.TransactionClient, data: ParsedImportRow) {
  const showroom = await tx.showroom.findFirst({
    where: {
      name: data.showroomName,
      status: {
        not: "deleted",
      },
    },
  });

  if (!showroom) {
    throw new Error("展厅不存在");
  }

  const existingLead = await tx.lead.findUnique({
    where: { contactPhone: data.contactPhone },
  });
  const appointmentNo = await generateCompletedAppointmentNo(tx);
  const appointment = await tx.appointment.create({
    data: {
      appointmentNo,
      showroomId: showroom.id,
      leadId: existingLead?.id,
      visitDate: new Date(`${data.visitDate}T00:00:00.000Z`),
      visitTimeSlot: data.visitTimeSlot,
      visitorCount: data.visitorCount,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      companyName: data.companyName,
      position: data.position,
      province: data.province,
      customerType: data.customerType,
      interestAreas: data.interestAreas,
      visitPurpose: data.visitPurpose,
      needGuide: data.needGuide,
      customerRemark: data.customerRemark,
      receptionist: data.receptionist,
      receptionNote: data.receptionNote,
      actualReceptionLocation: data.actualReceptionLocation,
      visitStartTime: data.visitStartTime,
      visitEndTime: data.visitEndTime,
      status: "completed",
    },
  });

  if (existingLead) {
    await tx.lead.update({
      where: { id: existingLead.id },
      data: {
        contactName: data.contactName,
        companyName: data.companyName,
        position: data.position,
        province: data.province,
        customerType: data.customerType,
        interestAreas: data.interestAreas,
        latestShowroomId: showroom.id,
        latestAppointmentId: appointment.id,
        appointmentCount: {
          increment: 1,
        },
      },
    });
  } else {
    const lead = await tx.lead.create({
      data: {
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        companyName: data.companyName,
        position: data.position,
        province: data.province,
        customerType: data.customerType,
        interestAreas: data.interestAreas,
        latestShowroomId: showroom.id,
        latestAppointmentId: appointment.id,
        appointmentCount: 1,
      },
    });

    await tx.appointment.update({
      where: { id: appointment.id },
      data: {
        leadId: lead.id,
      },
    });
  }
}

export async function POST(request: Request) {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    return Response.json({ error: "未授权" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "请上传导入文件" }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return Response.json({ error: "仅支持 .xlsx 文件导入" }, { status: 400 });
  }

  let rows: unknown[][];
  try {
    const buffer = await file.arrayBuffer();
    rows = readFirstXlsxSheetRows(buffer);
  } catch {
    return Response.json({ error: "导入文件解析失败，请确认文件格式为 .xlsx" }, { status: 400 });
  }

  if (rows.length <= 1) {
    return Response.json({ successCount: 0, failureCount: 0, failures: [] });
  }

  const headerMap = getHeaderMap(rows[0]);
  const headerError = validateHeaders(headerMap);
  if (headerError) {
    return Response.json({ error: headerError }, { status: 400 });
  }

  let successCount = 0;
  const failures: ImportFailure[] = [];

  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index];
    const rowNumber = index + 1;
    const isEmptyRow = row.every((cell) => !normalizeImportText(cell));
    if (isEmptyRow) continue;

    const parsed = parseAppointmentImportRow((header) => row[headerMap.get(header) ?? -1]);
    if (parsed.error || !parsed.data) {
      failures.push({ row: rowNumber, reason: parsed.error || "行数据不合法" });
      continue;
    }

    try {
      await prisma.$transaction((tx) => createCompletedAppointment(tx, parsed.data!));
      successCount += 1;
    } catch (error) {
      failures.push({
        row: rowNumber,
        reason: error instanceof Error ? error.message : "导入失败",
      });
    }
  }

  return Response.json({
    successCount,
    failureCount: failures.length,
    failures,
  });
}
