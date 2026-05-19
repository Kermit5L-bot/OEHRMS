import Link from "next/link";
import { getVisitTimeSlotLabel } from "@/lib/appointments";

type AppointmentSuccessPageProps = {
  searchParams: Promise<{
    appointmentNo?: string;
    showroomName?: string;
    visitDate?: string;
    visitTimeSlot?: string;
    contactName?: string;
    contactPhone?: string;
  }>;
};

export default async function AppointmentSuccessPage({ searchParams }: AppointmentSuccessPageProps) {
  const summary = await searchParams;
  const hasSummary = Boolean(summary.appointmentNo);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="rounded-lg bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl font-bold text-emerald-700">
            ✓
          </div>
          <h1 className="mt-5 text-3xl font-bold text-slate-950">预约提交成功</h1>
          <p className="mt-4 text-slate-600">
            您的展厅参观预约已提交，市场部工作人员将尽快审核并与您联系。
          </p>
        </div>

        {hasSummary ? (
          <dl className="mt-8 grid gap-4 rounded-lg bg-slate-50 p-5 text-sm sm:grid-cols-2">
            <SummaryItem label="预约编号" value={summary.appointmentNo} />
            <SummaryItem label="展厅名称" value={summary.showroomName} />
            <SummaryItem label="参观日期" value={summary.visitDate} />
            <SummaryItem
              label="参观时间段"
              value={summary.visitTimeSlot ? getVisitTimeSlotLabel(summary.visitTimeSlot) : undefined}
            />
            <SummaryItem label="联系人" value={summary.contactName} />
            <SummaryItem label="手机号码" value={summary.contactPhone} />
          </dl>
        ) : (
          <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-600">
            当前没有可展示的预约摘要。若您刚提交预约，请返回展厅继续查看。
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800">
            返回首页
          </Link>
          <Link
            href="/showrooms"
            className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            继续查看展厅
          </Link>
        </div>
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="mt-1 font-semibold text-slate-950">{value || "未提供"}</dd>
    </div>
  );
}
