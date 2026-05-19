import Link from "next/link";
import { ShowroomCard } from "@/components/showroom-card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const steps = ["选择展厅", "填写预约信息", "市场部审批确认", "到访参观接待"];

export default async function HomePage() {
  const showrooms = await prisma.showroom.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div>
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-blue-700">统一入口 · 在线预约 · 接待协同</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-slate-950 sm:text-5xl">
              在线展厅预约
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              了解公司展厅与实训基地，在线选择展厅并提交参观预约。市场部后续可统一审核、备注和安排接待。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/appointment"
                className="rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"
              >
                立即预约
              </Link>
              <Link
                href="/showrooms"
                className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                查看展厅
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
            <p className="text-sm text-blue-200">预约流程</p>
            <div className="mt-5 grid gap-3">
              {steps.map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-md bg-white/10 p-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-bold">
                    {index + 1}
                  </span>
                  <span className="font-medium">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-blue-700">展厅概览</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950">选择适合的参观展厅</h2>
          </div>
          <Link href="/showrooms" className="text-sm font-semibold text-blue-700 hover:text-blue-900">
            查看全部展厅
          </Link>
        </div>

        {showrooms.length > 0 ? (
          <div className="mt-7 grid gap-5 md:grid-cols-2">
            {showrooms.map((showroom) => (
              <ShowroomCard key={showroom.id} showroom={showroom} />
            ))}
          </div>
        ) : (
          <div className="mt-7 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
            暂无展厅数据，请先运行数据库 seed。
          </div>
        )}
      </section>
    </div>
  );
}
