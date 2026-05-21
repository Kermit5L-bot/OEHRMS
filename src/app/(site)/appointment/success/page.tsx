import Link from "next/link";
import { CheckCircle2, PhoneCall, RefreshCw } from "lucide-react";
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
    <div className="tech-grid min-h-[calc(100vh-73px)] px-4 py-10 sm:py-16">
      <div className="glass-panel mx-auto max-w-3xl rounded-lg p-6 sm:p-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-300/15 text-3xl font-bold text-cyan-100 ring-1 ring-cyan-300/30">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h1 className="mt-5 text-3xl font-bold text-white">预约提交成功</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            您的预约申请已成功提交。请耐心等待审核，我们将尽快与您联系，确认具体接待安排。
          </p>
        </div>

        {hasSummary ? (
          <dl className="mt-8 grid gap-4 rounded-lg border border-cyan-300/18 bg-slate-950/42 p-5 text-sm sm:grid-cols-2">
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
          <div className="mt-8 rounded-lg border border-dashed border-cyan-300/25 bg-slate-950/42 p-5 text-center text-sm text-slate-300">
            当前没有可展示的预约摘要。若您刚提交预约，请返回展厅继续查看。
          </div>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-cyan-300/18 bg-slate-950/35 p-4 text-sm text-slate-300">
            <p className="inline-flex items-center gap-2 font-semibold text-white">
              <PhoneCall className="h-4 w-4 text-cyan-200" />
              请保持电话畅通
            </p>
            <p className="mt-2 leading-6">工作人员将尽快与您联系，确认具体接待安排。</p>
          </div>
          <div className="rounded-md border border-cyan-300/18 bg-slate-950/35 p-4 text-sm text-slate-300">
            <p className="inline-flex items-center gap-2 font-semibold text-white">
              <RefreshCw className="h-4 w-4 text-cyan-200" />
              如需调整预约信息
            </p>
            <p className="mt-2 leading-6">请等待工作人员联系确认后协同调整。</p>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link href="/" className="min-h-12 rounded-md bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-blue-500">
            返回首页
          </Link>
          <Link
            href="/showrooms"
            className="min-h-12 rounded-md border border-cyan-300/30 px-5 py-3 text-center text-sm font-semibold text-cyan-100 hover:bg-cyan-300/10"
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
      <dt className="text-slate-400">{label}</dt>
      <dd className="mt-1 break-words font-semibold text-slate-100">{value || "未提供"}</dd>
    </div>
  );
}
