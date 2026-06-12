import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Download, MessageSquareText, Search, UserRound } from "lucide-react";
import { AdminBulkDeleteTable } from "@/components/admin-bulk-delete-table";
import { AdminLeadNoteForm } from "@/components/admin-lead-note-form";
import { AdminPagination } from "@/components/admin-pagination";
import { AppointmentStatusBadge } from "@/components/appointment-status-badge";
import { formatDate, formatDateTime } from "@/lib/admin-appointments";
import {
  getCustomerTypeLabel,
  getInterestAreaLabels,
  getProvinceLabel,
  getSolutionConsultingLabel,
  getVisitTimeSlotLabel,
} from "@/lib/appointments";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type AdminLeadsPageProps = {
  searchParams: Promise<{
    page?: string;
    keyword?: string;
    phone?: string;
  }>;
};

function getExportHref(keyword?: string) {
  const query = new URLSearchParams();
  if (keyword) query.set("keyword", keyword);
  const text = query.toString();
  return `/api/admin/leads/export${text ? `?${text}` : ""}`;
}

function getRelatedAppointmentsHref(phone: string, keyword?: string) {
  const query = new URLSearchParams({ phone });
  if (keyword) query.set("keyword", keyword);

  return `/admin/leads?${query.toString()}#appointment-records`;
}

export default async function AdminLeadsPage({ searchParams }: AdminLeadsPageProps) {
  const params = await searchParams;
  const page = Math.max(Number(params.page || 1), 1);
  const pageSize = 10;
  const keyword = (params.keyword || "").trim();
  const selectedPhone = (params.phone || "").trim();
  const where: Prisma.LeadWhereInput = {};

  if (keyword) {
    where.OR = [
      { contactName: { contains: keyword } },
      { contactPhone: { contains: keyword } },
      { companyName: { contains: keyword } },
    ];
  }

  const [total, leads, relatedAppointments] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      include: {
        latestShowroom: { select: { name: true } },
        latestAppointment: { select: { createdAt: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    selectedPhone
      ? prisma.appointment.findMany({
          where: { contactPhone: selectedPhone },
          include: { showroom: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);
  const pageCount = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <section>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">留资管理</h1>
          <p className="mt-3 text-slate-600">沉淀预约客户线索，维护后续跟进备注。</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="rounded-md bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
            共 <span className="font-semibold text-slate-950">{total}</span> 条留资
          </div>
          <Link href={getExportHref(keyword)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-50">
            <Download className="h-4 w-4" />
            按当前筛选导出 Excel
          </Link>
        </div>
      </div>

      <form className="admin-panel mt-6 flex flex-col gap-3 rounded-lg p-4 sm:flex-row">
        <input name="keyword" defaultValue={keyword} placeholder="搜索姓名 / 手机号 / 公司名称" className="form-control min-w-0 flex-1" />
        <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          <Search className="h-4 w-4" />
          搜索
        </button>
        {keyword ? (
          <Link href="/admin/leads" className="rounded-md border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">
            清空
          </Link>
        ) : null}
      </form>

      <AdminBulkDeleteTable endpoint="/api/admin/leads/bulk-delete" itemName="留资">
      <div className="admin-panel mt-6 overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input type="checkbox" data-bulk-delete-all aria-label="全选留资" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                </th>
                <th className="px-4 py-3">客户姓名</th>
                <th className="px-4 py-3">手机号</th>
                <th className="px-4 py-3">公司名称</th>
                <th className="px-4 py-3">职务</th>
                <th className="px-4 py-3">所属省份</th>
                <th className="px-4 py-3">线索画像</th>
                <th className="px-4 py-3">最近预约展厅</th>
                <th className="px-4 py-3">最近预约时间</th>
                <th className="px-4 py-3">预约次数</th>
                <th className="px-4 py-3">跟进备注</th>
                <th className="px-4 py-3">更新时间</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3">
                    <input type="checkbox" value={lead.id} data-bulk-delete-row aria-label={`选择留资 ${lead.contactName}`} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-950">
                    <span className="inline-flex items-center gap-2">
                      <UserRound className="h-4 w-4 text-blue-600" />
                      {lead.contactName}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{lead.contactPhone}</td>
                  <td className="min-w-40 px-4 py-3 text-slate-600">{lead.companyName}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{lead.position || "-"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{getProvinceLabel(lead.province)}</td>
                  <td className="min-w-64 px-4 py-3 text-slate-600">
                    <div className="space-y-1">
                      <p>类型：{getCustomerTypeLabel(lead.customerType)}</p>
                      <p>关注：{getInterestAreaLabels(lead.interestAreas)}</p>
                      <p>方案交流：{getSolutionConsultingLabel(lead.needSolutionConsulting)}</p>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{lead.latestShowroom?.name || "-"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDateTime(lead.latestAppointment?.createdAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{lead.appointmentCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                      <AdminLeadNoteForm leadId={lead.id} initialFollowUpNote={lead.followUpNote} />
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDateTime(lead.updatedAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link href={getRelatedAppointmentsHref(lead.contactPhone, keyword)} className="font-semibold text-blue-700 hover:text-blue-900">
                      查看预约记录
                    </Link>
                  </td>
                </tr>
              ))}
              {leads.length === 0 ? (
                <tr><td colSpan={12} className="px-4 py-10 text-center text-slate-500">暂无留资数据</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
      </AdminBulkDeleteTable>

      <AdminPagination page={page} pageCount={pageCount} />

      {selectedPhone ? (
        <section id="appointment-records" className="admin-panel mt-8 scroll-mt-6 rounded-lg p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-950">客户预约记录</h2>
              <p className="mt-1 text-sm text-slate-600">手机号：{selectedPhone}</p>
            </div>
            <Link href="/admin/leads" className="text-sm font-semibold text-blue-700 hover:text-blue-900">关闭</Link>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">预约编号</th>
                  <th className="px-4 py-3">展厅</th>
                  <th className="px-4 py-3">参观日期</th>
                  <th className="px-4 py-3">时间段</th>
                  <th className="px-4 py-3">状态</th>
                  <th className="px-4 py-3">提交时间</th>
                  <th className="px-4 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {relatedAppointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-950">{appointment.appointmentNo}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{appointment.showroom.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(appointment.visitDate)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{getVisitTimeSlotLabel(appointment.visitTimeSlot)}</td>
                    <td className="whitespace-nowrap px-4 py-3"><AppointmentStatusBadge status={appointment.status} /></td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDateTime(appointment.createdAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3"><Link href={`/admin/appointments/${appointment.id}`} className="font-semibold text-blue-700 hover:text-blue-900">查看详情</Link></td>
                  </tr>
                ))}
                {relatedAppointments.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">暂无关联预约记录</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </section>
  );
}
