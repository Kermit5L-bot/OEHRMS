import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminAppointmentActions } from "@/components/admin-appointment-actions";
import { AdminAppointmentEditForm } from "@/components/admin-appointment-edit-form";
import { AppointmentStatusBadge } from "@/components/appointment-status-badge";
import { formatDateTime } from "@/lib/admin-appointments";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type AdminAppointmentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDateTimeLocal(value?: Date | null) {
  if (!value) return "";
  const offset = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}

function formatDateInput(value?: Date | null) {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}

function splitInterestAreas(value?: string | null) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getNeedGuideValue(appointment: { needGuide: boolean; needGuideStatus?: string | null }) {
  return appointment.needGuideStatus || (appointment.needGuide ? "yes" : "no");
}

export default async function AdminAppointmentDetailPage({ params }: AdminAppointmentDetailPageProps) {
  const { id } = await params;
  const appointmentId = Number(id);
  if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
    notFound();
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      showroom: true,
      approvedBy: {
        select: {
          username: true,
          realName: true,
        },
      },
    },
  });

  if (!appointment) {
    notFound();
  }

  return (
    <section className="pb-28">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Link href="/admin/appointments" className="text-sm font-semibold text-blue-700 hover:text-blue-900">
            返回列表
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-slate-950">预约详情</h1>
          <p className="mt-2 text-slate-600">{appointment.appointmentNo}</p>
        </div>
        <AppointmentStatusBadge status={appointment.status} />
      </div>

      <div className="mt-8">
        <AdminAppointmentEditForm
          appointmentId={appointment.id}
          status={appointment.status}
          displayInfo={{
            appointmentNo: appointment.appointmentNo,
            showroomName: appointment.showroom.name,
            approvedByName: appointment.approvedBy?.realName || appointment.approvedBy?.username || "",
            approvedAt: formatDateTime(appointment.approvedAt),
            approvalOpinion: appointment.approvalOpinion || "",
            rejectReason: appointment.rejectReason || "",
          }}
          initialValues={{
            visitDate: formatDateInput(appointment.visitDate),
            visitTimeSlot: appointment.visitTimeSlot,
            visitorCount: String(appointment.visitorCount),
            contactName: appointment.contactName || "",
            contactPhone: appointment.contactPhone || "",
            companyName: appointment.companyName || "",
            position: appointment.position || "",
            internalContactInfo: appointment.internalContactInfo || "",
            customerLevel: appointment.customerLevel || "",
            mainVisitorInfo: appointment.mainVisitorInfo || "",
            province: appointment.province || "",
            customerType: appointment.customerType || "",
            interestAreas: splitInterestAreas(appointment.interestAreas),
            needSolutionConsulting: appointment.needSolutionConsulting || "pending",
            needGuide: getNeedGuideValue(appointment),
            visitPurpose: appointment.visitPurpose || "",
            customerRemark: appointment.customerRemark || "",
            receptionist: appointment.receptionist || "",
            receptionNote: appointment.receptionNote || "",
            followUpNote: appointment.followUpNote || "",
            actualReceptionLocation: appointment.actualReceptionLocation || "",
            visitStartTime: formatDateTimeLocal(appointment.visitStartTime),
            visitEndTime: formatDateTimeLocal(appointment.visitEndTime),
            receptionScheduleNote: appointment.receptionScheduleNote || "",
            receptionPreparationNote: appointment.receptionPreparationNote || "",
            needVehicle: appointment.needVehicle || "pending",
            vehicleRequirement: appointment.vehicleRequirement || "",
            needAccommodation: appointment.needAccommodation || "pending",
            accommodationRequirement: appointment.accommodationRequirement || "",
            needDining: appointment.needDining || "pending",
            diningRequirement: appointment.diningRequirement || "",
            giftPreparation: appointment.giftPreparation || "pending",
            giftRequirement: appointment.giftRequirement || "",
          }}
        />
      </div>

      <AdminAppointmentActions appointmentId={appointment.id} status={appointment.status} />
    </section>
  );
}
