import { AppointmentForm } from "@/components/appointment-form";
import { prisma } from "@/lib/prisma";
import { Building2, CheckCircle2, Clock, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

type AppointmentPageProps = {
  searchParams: Promise<{
    showroomId?: string;
  }>;
};

export default async function AppointmentPage({ searchParams }: AppointmentPageProps) {
  const { showroomId } = await searchParams;
  const requestedShowroomId = showroomId ? Number(showroomId) : undefined;
  const showrooms = await prisma.showroom.findMany({
    where: {
      status: {
        in: ["open", "closed"],
      },
    },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      status: true,
    },
  });
  const initialShowroomId =
    Number.isInteger(requestedShowroomId) && showrooms.some((showroom) => showroom.id === requestedShowroomId)
      ? requestedShowroomId
      : undefined;

  return (
    <div className="tech-grid min-h-[calc(100vh-73px)]">
      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:py-10">
        <p className="text-sm font-semibold text-cyan-200">在线预约</p>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">提交展厅参观预约</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
          填写参观信息、联系人信息和需求备注。预约提交后，市场部工作人员将尽快审核并与您确认接待安排。
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "选择展厅", icon: Building2 },
            { label: "填写预约信息", icon: FileText },
            { label: "等待确认", icon: Clock },
            { label: "到访参观", icon: CheckCircle2 },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
            <div key={item.label} className="rounded-md border border-cyan-300/20 bg-slate-950/42 p-3">
              <p className="inline-flex items-center gap-2 text-[16px] font-semibold text-cyan-200">
                <Icon className="h-5 w-5" />
                0{index + 1}
              </p>
              <p className="mt-1 text-sm font-semibold text-white">{item.label}</p>
            </div>
            );
          })}
        </div>

        <div className="mt-8">
          <AppointmentForm
            showrooms={showrooms}
            initialShowroomId={initialShowroomId}
          />
        </div>
      </div>
    </div>
  );
}
