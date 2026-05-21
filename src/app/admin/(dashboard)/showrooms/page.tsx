import { AdminShowroomEditForm } from "@/components/admin-showroom-edit-form";
import { getShowroomStatusLabel, getShowroomTypeLabel } from "@/lib/showrooms";
import { prisma } from "@/lib/prisma";
import { CircleCheck, Clock3, PauseCircle, Tag } from "lucide-react";

export const dynamic = "force-dynamic";

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export default async function AdminShowroomsPage() {
  const showrooms = await prisma.showroom.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <section>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">展厅管理</h1>
          <p className="mt-3 text-sm text-slate-600">
            维护四个固定展厅的基础信息、展示内容、开放状态和排序。本阶段不支持新增或删除展厅。
          </p>
        </div>
      </div>

      <div className="admin-panel mt-8 overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">展厅名称</th>
                <th className="px-4 py-3">展厅地点</th>
                <th className="px-4 py-3">展厅类型</th>
                <th className="px-4 py-3">开放状态</th>
                <th className="px-4 py-3">排序</th>
                <th className="px-4 py-3">更新时间</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {showrooms.map((showroom) => (
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
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${showroom.status === "open" ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : "bg-slate-100 text-slate-600 ring-slate-200"}`}>
                      {showroom.status === "open" ? <CircleCheck className="mr-1.5 h-3.5 w-3.5" /> : <PauseCircle className="mr-1.5 h-3.5 w-3.5" />}
                      {getShowroomStatusLabel(showroom.status)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600">{showroom.sortOrder}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-4 w-4 text-slate-400" />
                      {formatDateTime(showroom.updatedAt)}
                    </span>
                  </td>
                  <td className="px-4 py-4"><AdminShowroomEditForm showroom={showroom} /></td>
                </tr>
              ))}

              {showrooms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <h2 className="text-base font-semibold text-slate-950">暂无展厅数据</h2>
                    <p className="mt-2 text-sm text-slate-600">请先运行数据库 seed 初始化四个展厅，再刷新当前页面。</p>
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
