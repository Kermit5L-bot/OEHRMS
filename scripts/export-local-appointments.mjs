import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function getArg(name) {
  const prefix = `--${name}=`;
  const value = process.argv.find((arg) => arg.startsWith(prefix));
  return value ? value.slice(prefix.length) : null;
}

function printUsage() {
  console.log(`Usage:
  node scripts/export-local-appointments.mjs --appointment-nos=YY202606030001,YY202606110001 --out=C:\\temp\\oehrms-appointments.json

Options:
  --appointment-nos  Comma-separated appointment numbers to export.
  --out              JSON output path. The file will contain customer data.
`);
}

function requireArg(name) {
  const value = getArg(name);
  if (!value) {
    printUsage();
    throw new Error(`Missing required option: --${name}`);
  }
  return value;
}

const appointmentNos = requireArg("appointment-nos")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const outPath = resolve(requireArg("out"));

if (appointmentNos.length === 0) {
  throw new Error("At least one appointment number is required.");
}

try {
  const appointments = await prisma.appointment.findMany({
    where: {
      appointmentNo: {
        in: appointmentNos,
      },
    },
    include: {
      showroom: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      visitDate: "asc",
    },
  });

  const foundNos = new Set(appointments.map((appointment) => appointment.appointmentNo));
  const missingNos = appointmentNos.filter((appointmentNo) => !foundNos.has(appointmentNo));
  if (missingNos.length > 0) {
    throw new Error(`Appointment number(s) not found locally: ${missingNos.join(", ")}`);
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    source: "OEHRMS local Prisma export",
    warning: "This file contains real customer data. Do not commit it to git.",
    appointments: appointments.map((appointment) => ({
      appointmentNo: appointment.appointmentNo,
      showroomName: appointment.showroom.name,
      visitDate: appointment.visitDate.toISOString().slice(0, 10),
      visitTimeSlot: appointment.visitTimeSlot,
      visitorCount: appointment.visitorCount,
      contactName: appointment.contactName,
      contactPhone: appointment.contactPhone,
      companyName: appointment.companyName,
      position: appointment.position,
      industry: appointment.industry,
      customerType: appointment.customerType,
      interestAreas: appointment.interestAreas,
      needSolutionConsulting: appointment.needSolutionConsulting,
      visitPurpose: appointment.visitPurpose,
      needGuide: appointment.needGuide,
      customerRemark: appointment.customerRemark,
      status: appointment.status,
      approvalOpinion: appointment.approvalOpinion,
      rejectReason: appointment.rejectReason,
      approvedAt: appointment.approvedAt?.toISOString() ?? null,
      receptionist: appointment.receptionist,
      receptionNote: appointment.receptionNote,
      followUpNote: appointment.followUpNote,
      internalContactInfo: appointment.internalContactInfo,
      customerLevel: appointment.customerLevel,
      mainVisitorInfo: appointment.mainVisitorInfo,
      visitStartTime: appointment.visitStartTime?.toISOString() ?? null,
      visitEndTime: appointment.visitEndTime?.toISOString() ?? null,
      actualReceptionLocation: appointment.actualReceptionLocation,
      needVehicle: appointment.needVehicle,
      vehicleRequirement: appointment.vehicleRequirement,
      needAccommodation: appointment.needAccommodation,
      accommodationRequirement: appointment.accommodationRequirement,
      needDining: appointment.needDining,
      diningRequirement: appointment.diningRequirement,
      giftPreparation: appointment.giftPreparation,
      giftRequirement: appointment.giftRequirement,
      receptionScheduleNote: appointment.receptionScheduleNote,
      receptionPreparationNote: appointment.receptionPreparationNote,
    })),
  };

  await writeFile(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Exported ${payload.appointments.length} appointment(s) to ${outPath}`);
} finally {
  await prisma.$disconnect();
}
