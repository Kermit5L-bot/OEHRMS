"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock,
  Maximize2,
  Minimize2,
  Target,
  UsersRound,
} from "lucide-react";
import type { DashboardSummary } from "@/lib/admin-dashboard";
import { formatDate } from "@/lib/admin-appointments";

type DashboardBigScreenProps = {
  summary: DashboardSummary;
};

const metricMeta = [
  { key: "totalAppointments", label: "累计预约", icon: ClipboardList, tone: "from-blue-500 to-cyan-300" },
  { key: "todayAppointments", label: "今日新增", icon: CalendarClock, tone: "from-cyan-500 to-sky-300" },
  { key: "pendingAppointments", label: "待审批", icon: Clock, tone: "from-amber-400 to-cyan-300" },
  { key: "totalLeads", label: "累计留资", icon: UsersRound, tone: "from-blue-600 to-indigo-300" },
  { key: "completedAppointments", label: "已完成接待", icon: CheckCircle2, tone: "from-emerald-400 to-cyan-300" },
  { key: "monthAppointments", label: "本月预约", icon: Target, tone: "from-sky-500 to-blue-300" },
] as const;

const statusColors: Record<string, string> = {
  pending: "#f59e0b",
  approved: "#10b981",
  rejected: "#ef4444",
  completed: "#38bdf8",
  cancelled: "#94a3b8",
};

const chartColors = ["#38bdf8", "#22d3ee", "#2563eb", "#10b981", "#f59e0b", "#a78bfa", "#f472b6"];

function hasValue(items: Array<{ count?: number; value?: number }>) {
  return items.some((item) => (item.count ?? item.value ?? 0) > 0);
}

function chartPercent(value: number, max: number) {
  if (!max) return "0%";
  return `${Math.max(4, Math.round((value / max) * 100))}%`;
}

function EmptyState({ text = "暂无数据" }: { text?: string }) {
  return (
    <div className="flex min-h-36 items-center justify-center rounded-lg border border-dashed border-cyan-300/20 bg-slate-950/24 text-sm text-slate-400">
      {text}
    </div>
  );
}

function ScreenShell({
  summary,
  isFullscreen,
  onToggleFullscreen,
}: {
  summary: DashboardSummary;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  const [now, setNow] = useState(() => new Date());
  const totalStatus = summary.statusDistribution.reduce((total, item) => total + item.count, 0);
  const maxShowroom = Math.max(1, ...summary.showroomRanking.map((item) => item.count));
  const maxInterest = Math.max(1, ...summary.customerProfile.interestAreas.map((item) => item.value));

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const currentDateTime = useMemo(
    () =>
      now.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    [now],
  );

  return (
    <section className="relative min-h-full overflow-hidden bg-[#020617] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(56,189,248,0.22),transparent_28rem),radial-gradient(circle_at_86%_6%,rgba(37,99,235,0.2),transparent_24rem),linear-gradient(135deg,#020617_0%,#07111f_48%,#0b1220_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.08)_1px,transparent_1px)] bg-[size:32px_32px] opacity-70" />
      <div className={`relative z-10 mx-auto w-full ${isFullscreen ? "max-w-[1800px] p-5 2xl:p-8" : "max-w-7xl p-4 sm:p-6"}`}>
        <header className="flex flex-col gap-4 border-b border-cyan-300/20 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="bg-gradient-to-r from-white via-cyan-200 to-blue-400 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
              万维盈创智慧展厅预约数据看板
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
              客户预约、市场审批、留资沉淀、接待闭环一屏总览
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-md border border-cyan-300/25 bg-slate-950/40 px-4 py-2 text-sm font-semibold text-cyan-100">
              {currentDateTime}
            </div>
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="inline-flex min-h-10 items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 hover:bg-blue-500"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              {isFullscreen ? "还原" : "全屏"}
            </button>
          </div>
        </header>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {metricMeta.map((item) => {
            const Icon = item.icon;
            return (
              <Panel key={item.key} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-400">{item.label}</p>
                    <p className="mt-2 text-3xl font-bold text-white">{summary.overview[item.key]}</p>
                  </div>
                  <span className={`flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br ${item.tone} text-white shadow-lg shadow-blue-950/30`}>
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
              </Panel>
            );
          })}
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.2fr_0.9fr]">
          <Panel title="预约状态分布">
            {totalStatus > 0 ? (
              <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={summary.statusDistribution} dataKey="count" nameKey="label" innerRadius={58} outerRadius={88} paddingAngle={3}>
                        {summary.statusDistribution.map((item) => (
                          <Cell key={item.status} fill={statusColors[item.status] || "#38bdf8"} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {summary.statusDistribution.map((item) => (
                    <div key={item.status} className="flex items-center justify-between rounded-md border border-cyan-300/15 bg-white/[0.04] px-3 py-2">
                      <span className="inline-flex items-center gap-2 text-sm text-slate-300">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusColors[item.status] }} />
                        {item.label}
                      </span>
                      <span className="font-bold text-white">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState />
            )}
          </Panel>

          <Panel title="四地展厅预约概览" description="北京、西安、阜阳、新疆等展厅预约数据一屏掌握">
            {hasValue(summary.showroomRanking) ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {summary.showroomRanking.map((item, index) => (
                  <div key={item.id} className="rounded-lg border border-cyan-300/18 bg-white/[0.045] p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-cyan-200">NODE {String(index + 1).padStart(2, "0")}</span>
                      <span className="text-2xl font-bold text-white">{item.count}</span>
                    </div>
                    <p className="mt-2 truncate text-base font-semibold text-slate-100">{item.name}</p>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-300" style={{ width: chartPercent(item.count, maxShowroom) }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </Panel>

          <Panel title="客户类型分布">
            <RankingList items={summary.customerProfile.customerTypes} />
          </Panel>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-3">
          <Panel title="展厅预约排行">
            <HorizontalBar items={summary.showroomRanking.map((item) => ({ label: item.name, value: item.count }))} />
          </Panel>

          <Panel title="近 7 天预约趋势">
            {hasValue(summary.trend) ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={summary.trend} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(56,189,248,0.14)" vertical={false} />
                    <XAxis dataKey="date" tickFormatter={(value) => String(value).slice(5)} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="count" stroke="#38bdf8" strokeWidth={3} dot={{ fill: "#22d3ee", strokeWidth: 0, r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState />
            )}
          </Panel>

          <Panel title="关注方向排行">
            <div className="space-y-5">
              <div>
                <RankingList items={summary.customerProfile.interestAreas.slice(0, 5)} max={maxInterest} />
              </div>
              <div className="border-t border-cyan-300/15 pt-4">
                <p className="mb-3 text-sm font-semibold text-cyan-200">是否需要方案交流</p>
                <RankingList items={summary.customerProfile.solutionConsulting} />
              </div>
            </div>
          </Panel>
        </div>

        <Panel title="最近预约动态" description="展示最近提交的预约，辅助汇报业务流转和接待安排" className="mt-5">
          {summary.recentAppointments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-cyan-200">
                  <tr>
                    <th className="px-3 py-3">客户单位</th>
                    <th className="px-3 py-3">展厅</th>
                    <th className="px-3 py-3">参观日期</th>
                    <th className="px-3 py-3">客户类型</th>
                    <th className="px-3 py-3">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-300/10">
                  {summary.recentAppointments.map((appointment) => (
                    <tr key={appointment.id} className="text-slate-300">
                      <td className="min-w-44 px-3 py-3 font-semibold text-white">{appointment.companyName}</td>
                      <td className="whitespace-nowrap px-3 py-3">{appointment.showroomName}</td>
                      <td className="whitespace-nowrap px-3 py-3">{formatDate(appointment.visitDate)}</td>
                      <td className="whitespace-nowrap px-3 py-3">{appointment.customerType}</td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-xs font-semibold text-cyan-100">
                          {appointment.statusLabel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState />
          )}
        </Panel>

        <div className="mt-5 grid gap-3 text-xs text-slate-400 md:grid-cols-5">
          {[
            "统一预约入口，沉淀客户参观需求",
            "审批跟进可视化，提升市场部接待效率",
            "多展厅统一管理，数据一屏掌握",
            "客户类型与关注方向沉淀，辅助市场线索分析",
            "接待备注与讲解安排沉淀，形成客户接待闭环",
          ].map((item) => (
            <div key={item} className="rounded-md border border-cyan-300/12 bg-white/[0.035] px-3 py-2">
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Panel({
  title,
  description,
  className = "",
  children,
}: {
  title?: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-lg border border-cyan-300/25 bg-slate-900/70 shadow-[0_0_32px_rgba(8,47,73,0.28)] backdrop-blur ${className}`}>
      {title ? (
        <div className="border-b border-cyan-300/12 px-4 py-3">
          <h2 className="text-base font-bold text-white">{title}</h2>
          {description ? <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p> : null}
        </div>
      ) : null}
      <div className={title ? "p-4" : ""}>{children}</div>
    </section>
  );
}

function RankingList({ items, max }: { items: Array<{ label: string; value: number }>; max?: number }) {
  const localMax = max ?? Math.max(1, ...items.map((item) => item.value));
  if (!hasValue(items)) return <EmptyState />;

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item.label}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-semibold text-slate-200">
              <span className="mr-2 text-cyan-300">{String(index + 1).padStart(2, "0")}</span>
              {item.label}
            </span>
            <span className="font-bold text-white">{item.value}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-300" style={{ width: chartPercent(item.value, localMax) }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function HorizontalBar({ items }: { items: Array<{ label: string; value: number }> }) {
  if (!hasValue(items)) return <EmptyState />;

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={items} layout="vertical" margin={{ top: 8, right: 18, left: 8, bottom: 8 }}>
          <CartesianGrid stroke="rgba(56,189,248,0.12)" horizontal={false} />
          <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
          <YAxis dataKey="label" type="category" width={82} stroke="#cbd5e1" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="value" radius={[0, 8, 8, 0]}>
            {items.map((item, index) => (
              <Cell key={item.label} fill={chartColors[index % chartColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const tooltipStyle = {
  background: "rgba(15, 23, 42, 0.94)",
  border: "1px solid rgba(56, 189, 248, 0.28)",
  borderRadius: "8px",
  color: "#f8fafc",
};

export function DashboardBigScreen({ summary }: DashboardBigScreenProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isFullscreen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsFullscreen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  return (
    <>
      <ScreenShell summary={summary} isFullscreen={false} onToggleFullscreen={() => setIsFullscreen(true)} />
      {isFullscreen ? (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <ScreenShell summary={summary} isFullscreen onToggleFullscreen={() => setIsFullscreen(false)} />
        </div>
      ) : null}
    </>
  );
}
