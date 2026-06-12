import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const allowedStatuses = new Set(["pending", "approved", "rejected", "completed", "cancelled"]);
const allowedTimeSlots = new Set(["morning", "afternoon"]);
const defaultShowroomAliases = new Map([
  ["北京总部展厅", "北京公司展厅"],
  ["北京公司展厅", "北京总部展厅"],
]);
const obviousTestPhones = new Set([
  "11111111111",
  "13333333333",
  "13888888888",
]);

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function getArg(name) {
  const prefix = `--${name}=`;
  const value = process.argv.find((arg) => arg.startsWith(prefix));
  return value ? value.slice(prefix.length) : null;
}

function printUsage() {
  console.log(`Usage:
  # Preview only, no database writes:
  node scripts/import-prod-appointments.mjs --file=/path/to/oehrms-appointments.json

  # Actually write to the database:
  node scripts/import-prod-appointments.mjs --file=/path/to/oehrms-appointments.json --apply

Options:
  --file             JSON file exported by scripts/export-local-appointments.mjs.
  --apply            Required to write data. Without it this script only previews.
  --allow-test-data  Allow obvious local test data. Not recommended for production.
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

function parseNullableDate(value, fieldName) {
  if (value == null || value === "") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date in ${fieldName}: ${value}`);
  }
  return date;
}

function parseVisitDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Invalid visitDate: ${value}`);
  }
  return new Date(`${value}T00:00:00.000Z`);
}

function validateAppointment(appointment, index, allowTestData) {
  const label = `appointments[${index}]`;
  const requiredStringFields = [
    "appointmentNo",
    "showroomName",
    "visitDate",
    "visitTimeSlot",
    "contactName",
    "contactPhone",
    "companyName",
    "status",
  ];

  for (const field of requiredStringFields) {
    if (typeof appointment[field] !== "string" || appointment[field].trim() === "") {
      throw new Error(`${label}.${field} is required.`);
    }
  }

  if (!/^1[3-9]\d{9}$/.test(appointment.contactPhone)) {
    throw new Error(`${label}.contactPhone is not a valid mainland China mobile number.`);
  }
  if (!allowTestData && obviousTestPhones.has(appointment.contactPhone)) {
    throw new Error(`${label} looks like test data: ${appointment.contactPhone}`);
  }
  if (!allowedStatuses.has(appointment.status)) {
    throw new Error(`${label}.status is invalid: ${appointment.status}`);
  }
  if (!allowedTimeSlots.has(appointment.visitTimeSlot)) {
    throw new Error(`${label}.visitTimeSlot is invalid: ${appointment.visitTimeSlot}`);
  }
  if (!Number.isInteger(appointment.visitorCount) || appointment.visitorCount < 1) {
    throw new Error(`${label}.visitorCount must be a positive integer.`);
  }
}

function appointmentData(source, showroomId) {
  return {
    showroomId,
    visitDate: parseVisitDate(source.visitDate),
    visitTimeSlot: source.visitTimeSlot,
    visitorCount: source.visitorCount,
    contactName: source.contactName.trim(),
    contactPhone: source.contactPhone.trim(),
    companyName: source.companyName.trim(),
    position: source.position ?? null,
    industry: source.industry ?? null,
    customerType: source.customerType ?? null,
    interestAreas: source.interestAreas ?? null,
    needSolutionConsulting: source.needSolutionConsulting ?? null,
    visitPurpose: source.visitPurpose ?? null,
    needGuide: Boolean(source.needGuide),
    customerRemark: source.customerRemark ?? null,
    status: source.status,
    approvalOpinion: source.approvalOpinion ?? null,
    rejectReason: source.rejectReason ?? null,
    approvedAt: parseNullableDate(source.approvedAt, "approvedAt"),
    receptionist: source.receptionist ?? null,
    receptionNote: source.receptionNote ?? null,
    followUpNote: source.followUpNote ?? null,
    internalContactInfo: source.internalContactInfo ?? null,
    customerLevel: source.customerLevel ?? null,
    mainVisitorInfo: source.mainVisitorInfo ?? null,
    visitStartTime: parseNullableDate(source.visitStartTime, "visitStartTime"),
    visitEndTime: parseNullableDate(source.visitEndTime, "visitEndTime"),
    actualReceptionLocation: source.actualReceptionLocation ?? null,
    needVehicle: source.needVehicle ?? null,
    vehicleRequirement: source.vehicleRequirement ?? null,
    needAccommodation: source.needAccommodation ?? null,
    accommodationRequirement: source.accommodationRequirement ?? null,
    needDining: source.needDining ?? null,
    diningRequirement: source.diningRequirement ?? null,
    giftPreparation: source.giftPreparation ?? null,
    giftRequirement: source.giftRequirement ?? null,
    receptionScheduleNote: source.receptionScheduleNote ?? null,
    receptionPreparationNote: source.receptionPreparationNote ?? null,
  };
}

async function findShowroom(tx, sourceName) {
  const candidateNames = Array.from(
    new Set([sourceName, defaultShowroomAliases.get(sourceName)].filter(Boolean)),
  );

  for (const name of candidateNames) {
    const showroom = await tx.showroom.findUnique({ where: { name } });
    if (showroom) return showroom;
  }

  throw new Error(`Showroom not found. Tried: ${candidateNames.join(", ")}`);
}

async function findExistingAppointment(tx, source, showroomId) {
  const byNo = await tx.appointment.findUnique({
    where: { appointmentNo: source.appointmentNo },
  });
  if (byNo) return byNo;

  return tx.appointment.findFirst({
    where: {
      contactPhone: source.contactPhone,
      visitDate: parseVisitDate(source.visitDate),
      showroomId,
    },
  });
}

async function syncLead(tx, appointment, source) {
  const appointmentCount = await tx.appointment.count({
    where: { contactPhone: source.contactPhone },
  });
  const data = {
    contactName: source.contactName,
    companyName: source.companyName,
    position: source.position ?? null,
    industry: source.industry ?? null,
    customerType: source.customerType ?? null,
    interestAreas: source.interestAreas ?? null,
    needSolutionConsulting: source.needSolutionConsulting ?? null,
    latestShowroomId: appointment.showroomId,
    latestAppointmentId: appointment.id,
    appointmentCount,
    followUpNote: source.followUpNote ?? null,
  };

  const existingLead = await tx.lead.findUnique({
    where: { contactPhone: source.contactPhone },
  });

  const lead = existingLead
    ? await tx.lead.update({
        where: { id: existingLead.id },
        data,
      })
    : await tx.lead.create({
        data: {
          ...data,
          contactPhone: source.contactPhone,
        },
      });

  if (appointment.leadId !== lead.id) {
    await tx.appointment.update({
      where: { id: appointment.id },
      data: { leadId: lead.id },
    });
  }

  return lead;
}

const filePath = resolve(requireArg("file"));
const apply = hasFlag("apply");
const allowTestData = hasFlag("allow-test-data");
const payload = JSON.parse(await readFile(filePath, "utf8"));

if (!Array.isArray(payload.appointments)) {
  throw new Error("Import file must contain an appointments array.");
}

payload.appointments.forEach((appointment, index) => {
  validateAppointment(appointment, index, allowTestData);
});

try {
  var preview = [];

  await prisma.$transaction(async (tx) => {
    for (const source of payload.appointments) {
      const showroom = await findShowroom(tx, source.showroomName);
      const existing = await findExistingAppointment(tx, source, showroom.id);
      const action = existing ? "update" : "create";

      preview.push({
        action,
        appointmentNo: source.appointmentNo,
        visitDate: source.visitDate,
        contactName: source.contactName,
        contactPhone: source.contactPhone,
        companyName: source.companyName,
        showroomName: showroom.name,
        status: source.status,
      });

      if (!apply) continue;

      const data = appointmentData(source, showroom.id);
      const appointment = existing
        ? await tx.appointment.update({
            where: { id: existing.id },
            data,
          })
        : await tx.appointment.create({
            data: {
              ...data,
              appointmentNo: source.appointmentNo,
            },
          });

      await syncLead(tx, appointment, source);
    }

    if (!apply) {
      throw new Error("DRY_RUN_ROLLBACK");
    }
  });

  console.log(JSON.stringify({ mode: "apply", records: preview }, null, 2));
} catch (error) {
  if (error instanceof Error && error.message === "DRY_RUN_ROLLBACK") {
    console.log(JSON.stringify({ mode: "dry-run", records: preview }, null, 2));
  } else {
    throw error;
  }
} finally {
  await prisma.$disconnect();
}
