import Link from "next/link";
import type { AppointmentStatus, Prisma } from "@prisma/client";
import { CheckCircle2, ClipboardList, Clock, UsersRound } from "lucide-react";
import { AdminAppointmentDeleteButton } from "@/components/admin-appointment-delete-button";
import { AdminAppointmentFilterForm } from "@/components/admin-appointment-filter-form";
import { AdminBulkDeleteTable } from "@/components/admin-bulk-delete-table";
import { AdminPagination } from "@/components/admin-pagination";
import { AppointmentStatusBadge } from "@/components/appointment-status-badge";
import { formatDate, formatDateTime, appointmentStatusLabels } from "@/lib/admin-appointments";
import {
  getCustomerTypeLabel,
  getInterestAreaLabels,
  getProvinceLabel,
  getSolutionConsultingLabel,
  getVisitTimeSlotLabel,
} from "@/lib/appointments";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type AdminAppointmentsPageProps = {
  searchParams: Promise<{
    page?: string;
    status?: string;
    showroomId?: string;
    startDate?: string;
    endDate?: string;
    keyword?: string;
  }>;
};

const statusOptions: Array<{ value: "" | AppointmentStatus; label: string }> = [
  { value: "", label: "全部状态" },
  { value: "pending", label: "待审批" },
  { value: "approved", label: "已通过" },
  { value: "rejected", label: "已拒绝" },
  { value: "completed", label: "已完成" },
  { value: "cancelled", label: "已取消" },
];

function isAppointmentStatus(value?: string): value is AppointmentStatus {
  return Boolean(value && value in appointmentStatusLabels);
}

function getDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return new Date(`${value}T00:00:00.000Z`);
}

function getExportHref(params: Awaited<AdminAppointmentsPageProps["searchParams"]>) {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.showroomId) query.set("showroomId", params.showroomId);
  if (params.startDate) query.set("startDate", params.startDate);
  if (params.endDate) query.set("endDate", params.endDate);
  if (params.keyword) query.set("keyword", params.keyword);
  const text = query.toString();
  return `/api/admin/appointments/export${text ? `?${text}` : ""}`;
}

export default async function AdminAppointmentsPage({ searchParams }: AdminAppointmentsPageProps) {
  const params = await searchParams;
  const page = Math.max(Number(params.page || 1), 1);
  const pageSize = 10;
  const showroomId = Number(params.showroomId || "");
  const startDate = getDate(params.startDate);
  const endDate = getDate(params.endDate);
  const keyword = (params.keyword || "").trim();
  const where: Prisma.AppointmentWhereInput = {};

  if (isAppointmentStatus(params.status)) where.status = params.status;
  if (Number.isInteger(showroomId) && showroomId > 0) where.showroomId = showroomId;
  if (startDate || endDate) {
    where.visitDate = {
      ...(startDate ? { gte: startDate } : {}),
      ...(endDate ? { lte: endDate } : {}),
    };
  }
  if (keyword) {
    where.OR = [
      { contactName: { contains: keyword } },
      { contactPhone: { contains: keyword } },
      { companyName: { contains: keyword } },
    ];
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(todayStart.getDate() + 1);

  const [showrooms, total, appointments, todayNew, pendingCount, approvedCount, leadCount] = await Promise.all([
    prisma.showroom.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    prisma.appointment.count({ where }),
    prisma.appointment.findMany({
      where,
      include: {
        showroom: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.appointment.count({ where: { createdAt: { gte: todayStart, lt: tomorrowStart } } }),
    prisma.appointment.count({ where: { status: "pending" } }),
    prisma.appointment.count({ where: { status: "approved" } }),
    prisma.lead.count(),
  ]);
  const pageCount = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <section>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">预约管理</h1>
          <p className="mt-3 text-slate-600">查看、筛选并进入预约详情处理审批和接待备注。</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="rounded-md bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
            共 <span className="font-semibold text-slate-950">{total}</span> 条预约
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="今日新增预约" value={todayNew} accent="bg-sky-500" icon={ClipboardList} />
        <StatCard label="待审批" value={pendingCount} accent="bg-amber-500" icon={Clock} />
        <StatCard label="已通过" value={approvedCount} accent="bg-emerald-500" icon={CheckCircle2} />
        <StatCard label="累计留资" value={leadCount} accent="bg-blue-600" icon={UsersRound} />
      </div>

      <AdminAppointmentFilterForm
        status={params.status || ""}
        showroomId={params.showroomId || ""}
        startDate={params.startDate || ""}
        endDate={params.endDate || ""}
        keyword={params.keyword || ""}
        statusOptions={statusOptions}
        showroomOptions={[
          { value: "", label: "全部展厅" },
          ...showrooms.map((showroom) => ({
            value: String(showroom.id),
            label: showroom.name,
          })),
        ]}
      />

      <AdminBulkDeleteTable
        endpoint="/api/admin/appointments/bulk-delete"
        itemName="预约"
        toolbarVariant="appointments"
        exportHref={getExportHref(params)}
      >
      <div className="admin-panel mt-6 overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input type="checkbox" data-bulk-delete-all aria-label="全选预约" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                </th>
                <th className="px-4 py-3">预约编号</th>
                <th className="px-4 py-3">展厅</th>
                <th className="px-4 py-3">参观日期</th>
                <th className="px-4 py-3">时间段</th>
                <th className="px-4 py-3">客户</th>
                <th className="px-4 py-3">手机号</th>
                <th className="px-4 py-3">公司</th>
                <th className="px-4 py-3">客户画像</th>
                <th className="px-4 py-3">人数</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">提交时间</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.map((appointment) => (
                <tr key={appointment.id} className={appointment.status === "pending" ? "bg-amber-50/60" : "hover:bg-slate-50"}>
                  <td className="whitespace-nowrap px-4 py-3">
                    <input type="checkbox" value={appointment.id} data-bulk-delete-row aria-label={`选择预约 ${appointment.appointmentNo}`} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-950">{appointment.appointmentNo}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{appointment.showroom.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(appointment.visitDate)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{getVisitTimeSlotLabel(appointment.visitTimeSlot)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{appointment.contactName}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{appointment.contactPhone}</td>
                  <td className="min-w-40 px-4 py-3 text-slate-600">{appointment.companyName}</td>
                  <td className="min-w-64 px-4 py-3 text-slate-600">
                    <div className="space-y-1">
                      <p>类型：{getCustomerTypeLabel(appointment.customerType)}</p>
                      <p>省份：{getProvinceLabel(appointment.province)}</p>
                      <p>关注：{getInterestAreaLabels(appointment.interestAreas)}</p>
                      <p>方案：{getSolutionConsultingLabel(appointment.needSolutionConsulting)} · 级别：{appointment.customerLevel || "-"}</p>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{appointment.visitorCount}</td>
                  <td className="whitespace-nowrap px-4 py-3"><AppointmentStatusBadge status={appointment.status} /></td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDateTime(appointment.createdAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/admin/appointments/${appointment.id}`} className="font-semibold text-blue-700 hover:text-blue-900">
                        查看详情
                      </Link>
                      <AdminAppointmentDeleteButton appointmentId={appointment.id} appointmentNo={appointment.appointmentNo} />
                    </div>
                  </td>
                </tr>
              ))}
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-4 py-10 text-center text-slate-500">暂无预约数据</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
      </AdminBulkDeleteTable>

      <AdminPagination page={page} pageCount={pageCount} />
    </section>
  );
}

function StatCard({
  label,
  value,
  accent,
  icon: Icon,
}: {
  label: string;
  value: number;
  accent: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="admin-panel rounded-lg p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent} text-white shadow-lg shadow-blue-100`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}
