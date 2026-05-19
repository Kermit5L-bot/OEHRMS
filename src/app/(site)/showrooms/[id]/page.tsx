import Link from "next/link";
import {
  getShowroomCoverStyle,
  getShowroomStatusLabel,
  getShowroomTypeLabel,
} from "@/lib/showrooms";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ShowroomDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ShowroomDetailPage({ params }: ShowroomDetailPageProps) {
  const { id } = await params;
  const showroomId = Number(id);

  if (!Number.isInteger(showroomId)) {
    return <ShowroomNotFound />;
  }

  const showroom = await prisma.showroom.findUnique({
    where: { id: showroomId },
  });

  if (!showroom) {
    return <ShowroomNotFound />;
  }

  const isOpen = showroom.status === "open";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/showrooms" className="text-sm font-semibold text-blue-700 hover:text-blue-900">
        返回展厅列表
      </Link>

      <section className="mt-6 overflow-hidden rounded-lg bg-white shadow-sm">
        <div
          className="flex min-h-72 items-end bg-cover bg-center p-6 text-white sm:p-8"
          style={getShowroomCoverStyle(showroom)}
        >
          <div>
            <p className="text-sm font-medium text-white/85">
              {showroom.city} · {getShowroomTypeLabel(showroom.type)}
            </p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{showroom.name}</h1>
          </div>
        </div>

        <div className="grid gap-8 p-6 lg:grid-cols-[1.5fr_0.9fr] lg:p-8">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {getShowroomTypeLabel(showroom.type)}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  isOpen ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {getShowroomStatusLabel(showroom.status)}
              </span>
            </div>

            <h2 className="mt-6 text-2xl font-bold text-slate-950">展厅介绍</h2>
            <p className="mt-4 leading-7 text-slate-600">{showroom.description || showroom.summary}</p>
          </div>

          <aside className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-lg font-semibold text-slate-950">参观信息</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-slate-500">地点</dt>
                <dd className="mt-1 font-medium text-slate-900">{showroom.city}</dd>
              </div>
              <div>
                <dt className="text-slate-500">开放时间</dt>
                <dd className="mt-1 font-medium text-slate-900">{showroom.openingHours || "待补充"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">建议参观时长</dt>
                <dd className="mt-1 font-medium text-slate-900">
                  {showroom.suggestedDuration || "待补充"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">地址说明</dt>
                <dd className="mt-1 font-medium text-slate-900">{showroom.address || "待补充"}</dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-col gap-3">
              {isOpen ? (
                <Link
                  href={`/appointment?showroomId=${showroom.id}`}
                  className="rounded-md bg-blue-700 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-blue-800"
                >
                  预约参观
                </Link>
              ) : (
                <span className="cursor-not-allowed rounded-md bg-slate-200 px-5 py-3 text-center text-sm font-semibold text-slate-500">
                  该展厅暂不开放预约
                </span>
              )}
              <Link
                href="/showrooms"
                className="rounded-md border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-white"
              >
                返回展厅列表
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

function ShowroomNotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">未找到展厅</h1>
        <p className="mt-3 text-slate-600">该展厅可能不存在，或数据库中暂无对应记录。</p>
        <div className="mt-6">
          <Link
            href="/showrooms"
            className="rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"
          >
            返回展厅列表
          </Link>
        </div>
      </div>
    </div>
  );
}
