import { ShowroomCard } from "@/components/showroom-card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ShowroomsPage() {
  const showrooms = await prisma.showroom.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="tech-grid min-h-[calc(100vh-73px)]">
      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:py-12">
        <p className="text-sm font-semibold text-cyan-200">展厅资源</p>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">展厅列表</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
          集中展示各地展厅，可查看详情并进入在线预约流程。
        </p>

        {showrooms.length > 0 ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {showrooms.map((showroom) => (
              <ShowroomCard key={showroom.id} showroom={showroom} />
            ))}
          </div>
        ) : (
          <div className="glass-panel mt-8 rounded-lg p-8 text-center">
            <h2 className="text-lg font-semibold text-white">暂无展厅数据</h2>
            <p className="mt-2 text-sm text-slate-300">请先确认展厅基础数据已初始化，再刷新页面查看展厅列表。</p>
          </div>
        )}
      </div>
    </div>
  );
}
