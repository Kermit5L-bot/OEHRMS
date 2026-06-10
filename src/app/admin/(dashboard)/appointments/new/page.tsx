import Link from "next/link";
import { AdminAppointmentCreateForm } from "@/components/admin-appointment-create-form";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminAppointmentNewPage() {
  const showrooms = await prisma.showroom.findMany({
    where: {
      status: {
        not: "deleted",
      },
    },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
    },
  });

  return (
    <section>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Link href="/admin/appointments" className="text-sm font-semibold text-blue-700 hover:text-blue-900">
            返回预约列表
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-slate-950">新增预约</h1>
          <p className="mt-2 text-slate-600">用于后台手动补充销售提交的客户预约申请，创建后状态默认为待审批。</p>
        </div>
      </div>

      <div className="mt-6">
        <AdminAppointmentCreateForm showrooms={showrooms} />
      </div>
    </section>
  );
}
