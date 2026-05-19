import { ShowroomCard } from "@/components/showroom-card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ShowroomsPage() {
  const showrooms = await prisma.showroom.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-sm font-semibold text-blue-700">展厅资源</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-950">展厅列表</h1>
      <p className="mt-3 max-w-3xl text-slate-600">
        集中展示北京、西安、阜阳、新疆四个展厅，客户可以查看详情或进入预约流程。
      </p>

      {showrooms.length > 0 ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {showrooms.map((showroom) => (
            <ShowroomCard key={showroom.id} showroom={showroom} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-950">暂无展厅数据</h2>
          <p className="mt-2 text-sm text-slate-600">请先运行数据库迁移和 seed，再刷新页面查看展厅列表。</p>
        </div>
      )}
    </div>
  );
}
