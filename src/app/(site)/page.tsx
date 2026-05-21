import Link from "next/link";
import {
  BadgeCheck,
  Building2,
  CalendarCheck,
  ClipboardPenLine,
  Flag,
  Handshake,
  MapPin,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ShowroomCard } from "@/components/showroom-card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const steps = [
  { label: "选择展厅", icon: Building2 },
  { label: "填写预约信息", icon: ClipboardPenLine },
  { label: "等待确认", icon: BadgeCheck },
  { label: "到访参观", icon: Flag },
];
const cityNodes = [
  { name: "北京", image: "/beijing.jpg" },
  { name: "陕西西安", image: "/xian.jpg" },
  { name: "安徽阜阳", image: "/fuyang.jpg" },
  { name: "新疆伊犁州", image: "/yili.jpg" },
];
const productSignals = [
  { label: "便捷预约参观", icon: CalendarCheck },
  { label: "高效审核确认", icon: ShieldCheck },
  { label: "专属接待服务", icon: Handshake },
];

export default async function HomePage() {
  const showrooms = await prisma.showroom.findMany({
    where: {
      status: {
        in: ["open", "closed"],
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="tech-grid">
      <section className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:py-16 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
        <div className="relative z-10">
          <p className="inline-flex items-center gap-2.5 rounded-full border border-cyan-300/25 bg-cyan-300/12 px-5 py-2.5 text-base font-semibold tracking-wide text-cyan-100 shadow-lg shadow-cyan-950/20">
            <Sparkles className="h-5 w-5" />
            智慧预约&nbsp;&nbsp;·&nbsp;&nbsp;智享展厅
          </p>
          <h1 className="mt-5 max-w-3xl bg-gradient-to-r from-white via-cyan-200 to-blue-400 bg-clip-text text-4xl font-bold leading-tight text-transparent sm:text-5xl">
            万维盈创智慧展厅预约
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            面向客户接待、展厅参观、实训基地交流的一站式数字化平台
          </p>
          <div className="mt-6 grid max-w-[470px] gap-3 sm:grid-cols-2">
            <Link
              href="/appointment"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-8 py-3 text-center text-sm font-semibold text-white shadow-xl shadow-blue-950/40 hover:bg-blue-500"
            >
              <Send className="h-4.5 w-4.5" />
              预约参观
            </Link>
            <Link
              href="/showrooms"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-cyan-300/35 px-8 py-3 text-center text-sm font-semibold text-cyan-100 hover:bg-cyan-300/10"
            >
              <Search className="h-4.5 w-4.5" />
              查看展厅
            </Link>
          </div>
          <div className="mt-6 flex max-w-[470px] flex-wrap items-center gap-x-6 gap-y-3">
            {productSignals.map((item) => {
              const SignalIcon = item.icon;
              return (
              <div key={item.label} className="inline-flex items-center gap-2 border-r border-cyan-300/25 pr-6 text-sm font-semibold text-slate-100 last:border-r-0 last:pr-0">
                <SignalIcon className="h-4 w-4 text-cyan-200" />
                {item.label}
              </div>
              );
            })}
          </div>
        </div>

        <div className="glass-panel relative z-10 overflow-hidden rounded-lg p-4 sm:p-5">
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-cyan-200">智慧预约流程</p>
              <h2 className="mt-2 text-xl font-bold text-white">从线上申请到现场接待</h2>
            </div>
          </div>
          <div className="relative z-10 mt-4 grid gap-2.5">
            {steps.map((step, index) => {
              const StepIcon = step.icon;

              return (
              <div
                key={step.label}
                className="relative flex min-h-16 items-center gap-3 overflow-hidden rounded-md border border-cyan-300/22 bg-white/[0.045] p-3 pr-24 shadow-lg shadow-cyan-950/10 backdrop-blur-md before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/20"
              >
                <StepIcon className="pointer-events-none absolute -bottom-3 -right-2 h-14 w-14 stroke-[1.25] text-cyan-100/5 sm:h-16 sm:w-16" />
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cyan-200/20 bg-cyan-200/12 text-base font-bold text-cyan-100 shadow-inner shadow-cyan-200/10">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>
                  <span className="block text-[11px] font-semibold text-cyan-200">STEP {index + 1}</span>
                  <span className="text-sm font-semibold text-slate-100 sm:text-base">{step.label}</span>
                </span>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 pb-12">
        <div className="glass-panel rounded-lg p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-cyan-200">展厅分布区域</p>
              <h2 className="mt-2 text-2xl font-bold text-white">多地展厅统一预约入口</h2>
            </div>
            <Link href="/showrooms" className="text-sm font-semibold text-cyan-200 hover:text-cyan-100">
              查看全部展厅
            </Link>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {cityNodes.map((city, index) => (
              <div
                key={city.name}
                className="group relative min-h-28 overflow-hidden rounded-md border border-blue-900/70 bg-slate-950/36 p-4 shadow-lg shadow-blue-950/20"
                style={{ backgroundImage: `url(${city.image})`, backgroundPosition: "center", backgroundSize: "cover" }}
              >
                <div className="absolute inset-0 bg-slate-950/58 transition-colors group-hover:bg-slate-950/46" />
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/18 via-slate-950/18 to-blue-950/48" />
                <div className="relative z-10">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-100 drop-shadow">
                    <MapPin className="h-3.5 w-3.5" />
                    NODE 0{index + 1}
                  </span>
                  <p className="mt-8 text-xl font-bold text-white drop-shadow">{city.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-4 pb-16">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-cyan-200">展厅概览</p>
            <h2 className="mt-2 text-3xl font-bold text-white">选择适合的参观展厅</h2>
          </div>
          <Link href="/showrooms" className="text-sm font-semibold text-cyan-200 hover:text-cyan-100">
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
          <div className="glass-panel mt-7 rounded-lg p-8 text-center text-slate-300">
            暂无展厅数据，请先运行数据库 seed。
          </div>
        )}
      </section>
    </div>
  );
}
