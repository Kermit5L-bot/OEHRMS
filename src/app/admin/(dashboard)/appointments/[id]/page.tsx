import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardCheck, FileText, MessageSquareText, Settings2, UserRound } from "lucide-react";
import { AdminAppointmentActions } from "@/components/admin-appointment-actions";
import { AppointmentStatusBadge } from "@/components/appointment-status-badge";
import { formatDate, formatDateTime } from "@/lib/admin-appointments";
import {
  getCustomerTypeLabel,
  getInterestAreaLabels,
  getSolutionConsultingLabel,
  getVisitTimeSlotLabel,
} from "@/lib/appointments";
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

function getSimpleOptionLabel(value?: string | null) {
  if (value === "yes") return "是";
  if (value === "no") return "否";
  if (value === "pending") return "待沟通";
  return value || "-";
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
          <InfoSection title="预约信息" icon={FileText}>
            <InfoItem label="预约编号" value={appointment.appointmentNo} />
            <InfoItem label="预约展厅" value={appointment.showroom.name} />
            <InfoItem label="参观日期" value={formatDate(appointment.visitDate)} />
            <InfoItem label="参观时间段" value={getVisitTimeSlotLabel(appointment.visitTimeSlot)} />
            <InfoItem label="参观人数" value={`${appointment.visitorCount} 人`} />
            <InfoItem label="是否需要接待讲解" value={appointment.needGuide ? "是" : "否"} />
            <InfoItem label="客户备注" value={appointment.customerRemark} wide />
          </InfoSection>

          <InfoSection title="客户信息" icon={UserRound}>
            <InfoItem label="客户姓名" value={appointment.contactName} />
            <InfoItem label="手机号码" value={appointment.contactPhone} />
            <InfoItem label="公司名称" value={appointment.companyName} />
            <InfoItem label="职务" value={appointment.position} />
            <InfoItem label="所属行业" value={appointment.industry} />
            <InfoItem label="客户类型" value={getCustomerTypeLabel(appointment.customerType)} />
            <InfoItem label="关注方向" value={getInterestAreaLabels(appointment.interestAreas)} wide />
            <InfoItem label="是否需要方案交流" value={getSolutionConsultingLabel(appointment.needSolutionConsulting)} />
            <InfoItem label="参观目的" value={appointment.visitPurpose} wide />
          </InfoSection>

          <InfoSection title="审批信息" icon={ClipboardCheck}>
            <InfoItem label="当前状态" value={<AppointmentStatusBadge status={appointment.status} />} />
            <InfoItem label="审批人" value={appointment.approvedBy?.realName || appointment.approvedBy?.username} />
            <InfoItem label="审批时间" value={formatDateTime(appointment.approvedAt)} />
            <InfoItem label="审批意见" value={appointment.approvalOpinion} wide />
            <InfoItem label="拒绝原因" value={appointment.rejectReason} wide />
          </InfoSection>

          <InfoSection title="内部接待安排" icon={Settings2}>
            <InfoItem label="申请人" value={appointment.applicantName} />
            <InfoItem label="内部对接人及电话" value={appointment.internalContactInfo} />
            <InfoItem label="来访客户级别" value={appointment.customerLevel} />
            <InfoItem label="主要来访人员信息" value={appointment.mainVisitorInfo} wide />
            <InfoItem label="来访开始时间" value={formatDateTime(appointment.visitStartTime)} />
            <InfoItem label="离开时间" value={formatDateTime(appointment.visitEndTime)} />
            <InfoItem label="实际接待地点" value={appointment.actualReceptionLocation} />
            <InfoItem label="车辆接送安排" value={getSimpleOptionLabel(appointment.needVehicle)} />
            <InfoItem label="车辆接送具体要求" value={appointment.vehicleRequirement} wide />
            <InfoItem label="住宿安排" value={getSimpleOptionLabel(appointment.needAccommodation)} />
            <InfoItem label="住宿具体要求" value={appointment.accommodationRequirement} wide />
            <InfoItem label="宴请安排" value={getSimpleOptionLabel(appointment.needDining)} />
            <InfoItem label="宴请具体要求" value={appointment.diningRequirement} wide />
            <InfoItem label="礼品准备" value={appointment.giftPreparation} />
            <InfoItem label="指定伴手礼说明" value={appointment.giftRequirement} wide />
            <InfoItem label="接待准备事项" value={appointment.receptionPreparationNote} wide />
            <InfoItem label="接待讲解安排" value={appointment.receptionScheduleNote} wide />
          </InfoSection>

          <InfoSection title="接待备注与跟进" icon={MessageSquareText}>
            <InfoItem label="接待负责人" value={appointment.receptionist} />
            <InfoItem label="接待备注" value={appointment.receptionNote} wide />
            <InfoItem label="跟进记录" value={appointment.followUpNote} wide />
          </InfoSection>
        </div>

        <AdminAppointmentActions
          appointmentId={appointment.id}
          status={appointment.status}
          initialReception={{
            receptionist: appointment.receptionist || "",
            receptionNote: appointment.receptionNote || "",
            followUpNote: appointment.followUpNote || "",
            applicantName: appointment.applicantName || "",
            internalContactInfo: appointment.internalContactInfo || "",
            customerLevel: appointment.customerLevel || "",
            mainVisitorInfo: appointment.mainVisitorInfo || "",
            visitStartTime: formatDateTimeLocal(appointment.visitStartTime),
            visitEndTime: formatDateTimeLocal(appointment.visitEndTime),
            actualReceptionLocation: appointment.actualReceptionLocation || "",
            needVehicle: appointment.needVehicle || "",
            vehicleRequirement: appointment.vehicleRequirement || "",
            needAccommodation: appointment.needAccommodation || "",
            accommodationRequirement: appointment.accommodationRequirement || "",
            needDining: appointment.needDining || "",
            diningRequirement: appointment.diningRequirement || "",
            giftPreparation: appointment.giftPreparation || "",
            giftRequirement: appointment.giftRequirement || "",
            receptionScheduleNote: appointment.receptionScheduleNote || "",
            receptionPreparationNote: appointment.receptionPreparationNote || "",
          }}
        />
      </div>
    </section>
  );
}

function InfoSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="admin-panel rounded-lg p-6">
      <h2 className="inline-flex w-full items-center gap-2 border-b border-slate-100 pb-4 text-lg font-bold text-slate-950">
        <Icon className="h-5 w-5 text-blue-600" />
        {title}
      </h2>
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
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold text-slate-950">{value || "-"}</dd>
    </div>
  );
}
