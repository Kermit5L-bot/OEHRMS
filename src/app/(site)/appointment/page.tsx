import { AppointmentForm } from "@/components/appointment-form";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type AppointmentPageProps = {
  searchParams: Promise<{
    showroomId?: string;
  }>;
};

export default async function AppointmentPage({ searchParams }: AppointmentPageProps) {
  const { showroomId } = await searchParams;
  const initialShowroomId = showroomId ? Number(showroomId) : undefined;
  const showrooms = await prisma.showroom.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      status: true,
    },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-sm font-semibold text-blue-700">在线预约</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-950">提交展厅参观预约</h1>
      <p className="mt-3 max-w-3xl text-slate-600">
        请填写参观时间、联系人和公司信息。预约提交后，市场部工作人员将尽快审核并与您联系。
      </p>

      <div className="mt-8">
        <AppointmentForm
          showrooms={showrooms}
          initialShowroomId={Number.isInteger(initialShowroomId) ? initialShowroomId : undefined}
        />
      </div>
    </div>
  );
}
