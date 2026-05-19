import type { AppointmentStatus } from "@prisma/client";
import { appointmentStatusLabels, getAppointmentStatusClass } from "@/lib/admin-appointments";

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getAppointmentStatusClass(status)}`}
    >
      {appointmentStatusLabels[status]}
    </span>
  );
}
