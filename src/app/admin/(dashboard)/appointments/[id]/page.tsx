import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminAppointmentActions } from "@/components/admin-appointment-actions";
import { AppointmentStatusBadge } from "@/components/appointment-status-badge";
import { formatDate, formatDateTime } from "@/lib/admin-appointments";
import { getVisitTimeSlotLabel } from "@/lib/appointments";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type AdminAppointmentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

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
    <section>
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

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <InfoSection title="预约信息">
            <InfoItem label="预约编号" value={appointment.appointmentNo} />
            <InfoItem label="预约展厅" value={appointment.showroom.name} />
            <InfoItem label="参观日期" value={formatDate(appointment.visitDate)} />
            <InfoItem label="参观时间段" value={getVisitTimeSlotLabel(appointment.visitTimeSlot)} />
            <InfoItem label="参观人数" value={`${appointment.visitorCount} 人`} />
            <InfoItem label="是否需要接待讲解" value={appointment.needGuide ? "是" : "否"} />
            <InfoItem label="参观目的" value={appointment.visitPurpose} wide />
            <InfoItem label="客户备注" value={appointment.customerRemark} wide />
          </InfoSection>

          <InfoSection title="客户信息">
            <InfoItem label="客户姓名" value={appointment.contactName} />
            <InfoItem label="手机号码" value={appointment.contactPhone} />
            <InfoItem label="公司名称" value={appointment.companyName} />
            <InfoItem label="职务" value={appointment.position} />
            <InfoItem label="所属行业" value={appointment.industry} />
          </InfoSection>

          <InfoSection title="审批信息">
            <InfoItem label="当前状态" value={<AppointmentStatusBadge status={appointment.status} />} />
            <InfoItem label="审批人" value={appointment.approvedBy?.realName || appointment.approvedBy?.username} />
            <InfoItem label="审批时间" value={formatDateTime(appointment.approvedAt)} />
            <InfoItem label="审批意见" value={appointment.approvalOpinion} wide />
            <InfoItem label="拒绝原因" value={appointment.rejectReason} wide />
          </InfoSection>

          <InfoSection title="接待备注">
            <InfoItem label="接待负责人" value={appointment.receptionist} />
            <InfoItem label="接待备注" value={appointment.receptionNote} wide />
            <InfoItem label="跟进记录" value={appointment.followUpNote} wide />
          </InfoSection>
        </div>

        <AdminAppointmentActions
          appointmentId={appointment.id}
          status={appointment.status}
          initialReceptionist={appointment.receptionist}
          initialReceptionNote={appointment.receptionNote}
          initialFollowUpNote={appointment.followUpNote}
        />
      </div>
    </section>
  );
}

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <dl className="mt-5 grid gap-4 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function InfoItem({
  label,
  value,
  wide,
}: {
  label: string;
  value?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm font-medium text-slate-950">{value || "-"}</dd>
    </div>
  );
}
