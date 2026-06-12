import { AdminRegionManager } from "@/components/admin-region-manager";
import { getRegionManagementData } from "@/lib/regions";

export const dynamic = "force-dynamic";

export default async function AdminRegionsPage() {
  const data = await getRegionManagementData();

  return (
    <section>
      <div>
        <h1 className="text-3xl font-bold text-slate-950">区域管理</h1>
        <p className="mt-3 text-sm text-slate-600">
          配置中国 34 个省级行政区所属区域，为数据看板地图和区域统计提供统一口径。未绑定省份会自动归为未分区。
        </p>
      </div>

      <AdminRegionManager initialData={data} />
    </section>
  );
}
