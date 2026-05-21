import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { CircleCheck, Clock3, EyeOff, PauseCircle, Tag, Trash2 } from "lucide-react";
import { AdminShowroomEditForm } from "@/components/admin-showroom-edit-form";
import { AdminShowroomStatusActions } from "@/components/admin-showroom-status-actions";
import {
  getShowroomStatusClass,
  getShowroomStatusLabel,
  getShowroomTypeLabel,
  isShowroomStatus,
  type ShowroomStatusValue,
} from "@/lib/showrooms";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type AdminShowroomsPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

const statusFilters: Array<{ label: string; value: "" | ShowroomStatusValue }> = [
  { label: "全部", value: "" },
  { label: "开放预约", value: "open" },
  { label: "暂停预约", value: "closed" },
  { label: "已隐藏", value: "hidden" },
  { label: "已删除", value: "deleted" },
];

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function StatusIcon({ status }: { status: ShowroomStatusValue }) {
  if (status === "open") return <CircleCheck className="mr-1.5 h-3.5 w-3.5" />;
  if (status === "closed") return <PauseCircle className="mr-1.5 h-3.5 w-3.5" />;
  if (status === "hidden") return <EyeOff className="mr-1.5 h-3.5 w-3.5" />;
  return <Trash2 className="mr-1.5 h-3.5 w-3.5" />;
}

function getFilterHref(status: "" | ShowroomStatusValue) {
  return status ? `/admin/showrooms?status=${status}` : "/admin/showrooms";
}

export default async function AdminShowroomsPage({ searchParams }: AdminShowroomsPageProps) {
  const params = await searchParams;
  const status = isShowroomStatus(params.status) ? params.status : "";
  const where: Prisma.ShowroomWhereInput = status
    ? { status }
    : {
        status: {
          not: "deleted",
        },
      };
  const showrooms = await prisma.showroom.findMany({
    where,
    orderBy: { sortOrder: "asc" },
  });

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">展厅管理</h1>
          <p className="mt-3 text-sm text-slate-600">
            维护展厅基础信息、展示状态、预约开放状态和排序。删除采用软删除，历史预约记录会继续保留。
          </p>
        </div>
        <AdminShowroomEditForm />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {statusFilters.map((item) => (
          <Link
            key={item.value || "all"}
            href={getFilterHref(item.value)}
            className={`rounded-md border px-3 py-2 text-sm font-semibold ${
              status === item.value
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="admin-panel mt-6 overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">展厅名称</th>
                <th className="px-4 py-3">展厅地点</th>
                <th className="px-4 py-3">展厅类型</th>
                <th className="px-4 py-3">展厅状态</th>
                <th className="px-4 py-3">排序</th>
                <th className="px-4 py-3">更新时间</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {showrooms.map((showroom) => {
                const showroomWithStatus = showroom as typeof showroom & { status: ShowroomStatusValue };
                return (
                  <tr key={showroom.id} className="align-top hover:bg-slate-50">
                    <td className="min-w-48 px-4 py-4">
                      <p className="font-semibold text-slate-950">{showroom.name}</p>
                      <p className="mt-1 line-clamp-2 max-w-md text-xs leading-5 text-slate-500">{showroom.summary}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">{showroom.city}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                      <span className="inline-flex items-center gap-1.5">
                        <Tag className="h-4 w-4 text-blue-600" />
                        {getShowroomTypeLabel(showroom.type)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getShowroomStatusClass(showroomWithStatus.status)}`}>
                        <StatusIcon status={showroomWithStatus.status} />
                        {getShowroomStatusLabel(showroomWithStatus.status)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">{showroom.sortOrder}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="h-4 w-4 text-slate-400" />
                        {formatDateTime(showroom.updatedAt)}
                      </span>
                    </td>
                    <td className="min-w-72 px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <AdminShowroomEditForm showroom={showroomWithStatus} />
                      </div>
                      <AdminShowroomStatusActions showroomId={showroom.id} status={showroomWithStatus.status} />
                    </td>
                  </tr>
                );
              })}

              {showrooms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <h2 className="text-base font-semibold text-slate-950">暂无展厅数据</h2>
                    <p className="mt-2 text-sm text-slate-600">当前筛选条件下暂无展厅，请调整状态筛选或新增展厅。</p>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
