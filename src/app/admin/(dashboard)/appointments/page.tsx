import Link from "next/link";
import type { AppointmentStatus, Prisma } from "@prisma/client";
import { AppointmentStatusBadge } from "@/components/appointment-status-badge";
import { formatDate, formatDateTime, appointmentStatusLabels } from "@/lib/admin-appointments";
import { getVisitTimeSlotLabel } from "@/lib/appointments";
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

function getPageHref(page: number, params: Awaited<AdminAppointmentsPageProps["searchParams"]>) {
  const query = new URLSearchParams();
  if (page > 1) query.set("page", String(page));
  if (params.status) query.set("status", params.status);
  if (params.showroomId) query.set("showroomId", params.showroomId);
  if (params.startDate) query.set("startDate", params.startDate);
  if (params.endDate) query.set("endDate", params.endDate);
  if (params.keyword) query.set("keyword", params.keyword);
  const text = query.toString();
  return `/admin/appointments${text ? `?${text}` : ""}`;
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

  const [showrooms, total, appointments] = await Promise.all([
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
  ]);
  const pageCount = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <section>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-blue-700">后台管理</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">预约管理</h1>
          <p className="mt-3 text-slate-600">查看、筛选并进入预约详情处理审批和接待备注。</p>
        </div>
        <div className="rounded-md bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          共 <span className="font-semibold text-slate-950">{total}</span> 条预约
        </div>
      </div>

      <form className="mt-6 grid gap-3 rounded-lg bg-white p-4 shadow-sm lg:grid-cols-6">
        <select name="status" defaultValue={params.status || ""} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          name="showroomId"
          defaultValue={params.showroomId || ""}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">全部展厅</option>
          {showrooms.map((showroom) => (
            <option key={showroom.id} value={showroom.id}>
              {showroom.name}
            </option>
          ))}
        </select>
        <input
          name="startDate"
          type="date"
          defaultValue={params.startDate || ""}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="endDate"
          type="date"
          defaultValue={params.endDate || ""}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="keyword"
          defaultValue={params.keyword || ""}
          placeholder="姓名 / 手机号 / 公司"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
          筛选
        </button>
      </form>

      <div className="mt-6 overflow-hidden rounded-lg bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">预约编号</th>
                <th className="px-4 py-3">展厅</th>
                <th className="px-4 py-3">参观日期</th>
                <th className="px-4 py-3">时间段</th>
                <th className="px-4 py-3">客户</th>
                <th className="px-4 py-3">手机号</th>
                <th className="px-4 py-3">公司</th>
                <th className="px-4 py-3">人数</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">提交时间</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.map((appointment) => (
                <tr key={appointment.id} className={appointment.status === "pending" ? "bg-amber-50/60" : ""}>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-950">{appointment.appointmentNo}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{appointment.showroom.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(appointment.visitDate)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {getVisitTimeSlotLabel(appointment.visitTimeSlot)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{appointment.contactName}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{appointment.contactPhone}</td>
                  <td className="min-w-40 px-4 py-3 text-slate-600">{appointment.companyName}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{appointment.visitorCount}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <AppointmentStatusBadge status={appointment.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDateTime(appointment.createdAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link href={`/admin/appointments/${appointment.id}`} className="font-semibold text-blue-700 hover:text-blue-900">
                      查看详情
                    </Link>
                  </td>
                </tr>
              ))}
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-10 text-center text-slate-500">
                    暂无预约数据
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between text-sm text-slate-600">
        <span>
          第 {page} / {pageCount} 页
        </span>
        <div className="flex gap-2">
          <Link
            href={getPageHref(Math.max(page - 1, 1), params)}
            className={`rounded-md border px-3 py-2 ${page <= 1 ? "pointer-events-none text-slate-300" : "text-slate-700 hover:bg-white"}`}
          >
            上一页
          </Link>
          <Link
            href={getPageHref(Math.min(page + 1, pageCount), params)}
            className={`rounded-md border px-3 py-2 ${page >= pageCount ? "pointer-events-none text-slate-300" : "text-slate-700 hover:bg-white"}`}
          >
            下一页
          </Link>
        </div>
      </div>
    </section>
  );
}
