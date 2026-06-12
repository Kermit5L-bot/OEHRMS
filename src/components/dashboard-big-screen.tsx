"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CartesianGrid,
  Line,
  LineChart,
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
} from "lucide-react";
import type { DashboardSummary } from "@/lib/admin-dashboard";
import { formatDate } from "@/lib/admin-appointments";

type DashboardBigScreenProps = {
  summary: DashboardSummary;
};

type GeoGeometry = {
  type: "Polygon" | "MultiPolygon";
  coordinates: number[][][] | number[][][][];
};

type GeoFeature = {
  type: "Feature";
  properties?: {
    name?: string;
  };
  geometry: GeoGeometry;
};

type GeoFeatureCollection = {
  type: "FeatureCollection";
  features: GeoFeature[];
};

type ProjectedFeature = {
  name: string;
  path: string;
  regionName: string;
  color: string;
  count: number;
  label: string;
  labelX: number;
  labelY: number;
};

type ProjectedMapData = {
  main: ProjectedFeature[];
  inset: ProjectedFeature[];
};

const CHINA_GEOJSON_URL = "/maps/china.json";

const metricMeta = [
  { id: "appointments", key: "periodAppointments", label: "\u9884\u7ea6", note: "\u6309\u53c2\u89c2\u65e5\u671f\u7edf\u8ba1\u5f53\u524d\u7b5b\u9009\u6761\u4ef6", icon: ClipboardList, tone: "from-blue-500 to-cyan-300" },
  { id: "visits", key: "periodAppointments", label: "\u5230\u8bbf", note: "\u6309\u5f53\u524d\u7b5b\u9009\u6761\u4ef6\u7684\u53c2\u89c2\u65e5\u671f\u7edf\u8ba1", icon: CalendarClock, tone: "from-cyan-500 to-sky-300" },
  { id: "completed", key: "periodCompletedAppointments", label: "\u5df2\u5b8c\u6210", note: "\u5f53\u524d\u7b5b\u9009\u6761\u4ef6\u5185\u5df2\u5b8c\u6210\u63a5\u5f85", icon: CheckCircle2, tone: "from-emerald-400 to-cyan-300" },
  { id: "pending", key: "periodPendingAppointments", label: "\u5f85\u5ba1\u6279", note: "\u5f53\u524d\u7b5b\u9009\u6761\u4ef6\u5185\u5f85\u5904\u7406\u9884\u7ea6", icon: Clock, tone: "from-amber-400 to-cyan-300" },
  { id: "visitors", key: "periodVisitorCount", label: "\u53c2\u89c2\u4eba\u6570", note: "\u6309\u9884\u7ea6\u586b\u5199\u7684\u53c2\u89c2\u4eba\u6570\u6c47\u603b", icon: Target, tone: "from-sky-500 to-blue-300" },
] as const;

const periodOptions = [
  { value: "year", label: "\u5e74\u5ea6" },
  { value: "quarter", label: "\u5b63\u5ea6" },
  { value: "month", label: "\u6708\u5ea6" },
] as const;
const monthOptions = Array.from({ length: 12 }, (_, index) => index + 1);

const provinceLabelCoordinates: Record<string, [number, number]> = {
  "\u5317\u4eac": [116.4, 39.9],
  "\u5929\u6d25": [117.2, 39.1],
  "\u6cb3\u5317": [115.2, 38.3],
  "\u5c71\u897f": [112.3, 37.7],
  "\u5185\u8499\u53e4": [112.0, 43.3],
  "\u8fbd\u5b81": [123.4, 41.7],
  "\u5409\u6797": [126.2, 43.7],
  "\u9ed1\u9f99\u6c5f": [127.8, 47.5],
  "\u4e0a\u6d77": [121.5, 31.2],
  "\u6c5f\u82cf": [119.2, 32.9],
  "\u6d59\u6c5f": [120.1, 29.2],
  "\u5b89\u5fbd": [117.2, 31.8],
  "\u798f\u5efa": [118.1, 26.1],
  "\u6c5f\u897f": [115.8, 27.6],
  "\u5c71\u4e1c": [118.2, 36.4],
  "\u6cb3\u5357": [113.6, 33.9],
  "\u6e56\u5317": [112.3, 30.8],
  "\u6e56\u5357": [111.7, 27.6],
  "\u5e7f\u4e1c": [113.4, 23.4],
  "\u5e7f\u897f": [108.4, 23.8],
  "\u6d77\u5357": [109.9, 19.1],
  "\u91cd\u5e86": [107.9, 30.0],
  "\u56db\u5ddd": [102.7, 30.6],
  "\u8d35\u5dde": [106.6, 26.8],
  "\u4e91\u5357": [101.6, 24.8],
  "\u897f\u85cf": [88.8, 31.4],
  "\u9655\u897f": [108.8, 35.1],
  "\u7518\u8083": [103.2, 37.5],
  "\u9752\u6d77": [96.2, 35.6],
  "\u5b81\u590f": [106.1, 37.4],
  "\u65b0\u7586": [85.0, 41.8],
  "\u9999\u6e2f": [114.2, 22.3],
  "\u6fb3\u95e8": [113.55, 22.15],
  "\u53f0\u6e7e": [121.0, 23.7],
};

function hasValue(items: Array<{ count?: number; value?: number }>) {
  return items.some((item) => (item.count ?? item.value ?? 0) > 0);
}

function chartPercent(value: number, max: number) {
  if (!max) return "0%";
  return `${Math.max(4, Math.round((value / max) * 100))}%`;
}

function EmptyState({ text = "\u6682\u65e0\u6570\u636e" }: { text?: string }) {
  return (
    <div className="flex min-h-36 items-center justify-center rounded-lg border border-dashed border-cyan-300/20 bg-slate-950/24 text-sm text-slate-400">
      {text}
    </div>
  );
}

function getPeriodLabel(period: DashboardSummary["filters"]["period"]) {
  if (period === "year") return "\u5e74\u5ea6";
  if (period === "month") return "\u6708\u5ea6";
  return "\u5b63\u5ea6";
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
  const maxInterest = Math.max(1, ...summary.customerProfile.interestAreas.map((item) => item.value));
  const periodLabel = getPeriodLabel(summary.filters.period);

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
  const headerPaddingClassName = isFullscreen ? "px-5 py-5 2xl:px-8" : "px-4 py-5 sm:px-6";
  const contentPaddingClassName = isFullscreen ? "px-5 pb-5 2xl:px-8 2xl:pb-8" : "px-4 pb-4 sm:px-6 sm:pb-6";
  const headerPositionClassName = isFullscreen ? "sticky top-0" : "sticky top-[65px]";

  return (
    <section className="relative min-h-[calc(100dvh-65px)] overflow-x-clip bg-[#020617] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(56,189,248,0.22),transparent_28rem),radial-gradient(circle_at_86%_6%,rgba(37,99,235,0.2),transparent_24rem),linear-gradient(135deg,#020617_0%,#07111f_48%,#0b1220_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.08)_1px,transparent_1px)] bg-[size:32px_32px] opacity-70" />
      <div className="relative z-10 w-full">
        <header className={`${headerPositionClassName} z-40 flex flex-col gap-4 border-b border-cyan-300/20 bg-slate-950/90 shadow-lg shadow-slate-950/60 backdrop-blur-md lg:flex-row lg:items-center lg:justify-between ${headerPaddingClassName}`}>
          <div>
            <h1 className="bg-gradient-to-r from-white via-cyan-200 to-blue-400 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
              {"\u4e07\u7ef4\u76c8\u521b\u667a\u6167\u5c55\u5385\u9884\u7ea6\u6570\u636e\u770b\u677f"}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap lg:justify-end">
            <DashboardFilters summary={summary} />
            <div className="flex h-11 items-center rounded-md border border-cyan-300/25 bg-slate-950/40 px-4 text-sm font-semibold text-cyan-100">
              {currentDateTime}
            </div>
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="inline-flex h-11 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 hover:bg-blue-500"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              {isFullscreen ? "\u8fd8\u539f" : "\u5168\u5c4f"}
            </button>
          </div>
        </header>

        <div className={contentPaddingClassName}>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {metricMeta.map((item) => {
            const Icon = item.icon;
            return (
              <Panel key={item.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-400">{periodLabel}{item.label}</p>
                    <p className="mt-2 text-3xl font-bold text-white">{summary.overview[item.key]}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{item.note}</p>
                  </div>
                  <span className={`flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br ${item.tone} text-white shadow-lg shadow-blue-950/30`}>
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
              </Panel>
            );
          })}
        </div>

        <div className="mt-5">
          <Panel title={`${periodLabel}\u5168\u56fd\u533a\u57df\u5230\u8bbf\u4e00\u89c8`}>
            <ChinaRegionMap summary={summary} />
          </Panel>

        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-3">
          <Panel title={`${periodLabel}\u5230\u8bbf\u8d8b\u52bf`}>
            {hasValue(summary.trend) ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={summary.trend} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(56,189,248,0.14)" vertical={false} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<TrendTooltip />} cursor={{ stroke: "rgba(56,189,248,0.28)", strokeWidth: 1 }} />
                    <Line type="monotone" dataKey="count" stroke="#38bdf8" strokeWidth={3} dot={{ fill: "#22d3ee", strokeWidth: 0, r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState />
            )}
          </Panel>

          <Panel title={`${periodLabel}\u5ba2\u6237\u7c7b\u578b\u5206\u5e03`}>
            <RankingList items={summary.customerProfile.customerTypes} />
          </Panel>

          <Panel title={`${periodLabel}\u5173\u6ce8\u65b9\u5411\u6392\u884c`}>
            <RankingList items={summary.customerProfile.interestAreas.slice(0, 8)} max={maxInterest} />
          </Panel>
        </div>

        <Panel title={"\u8fd1\u671f\u5230\u8bbf"} className="mt-5">
          {summary.recentAppointments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-cyan-200">
                  <tr>
                    <th className="px-3 py-3">{"\u5ba2\u6237\u5355\u4f4d"}</th>
                    <th className="px-3 py-3">{"\u8054\u7cfb\u4eba"}</th>
                    <th className="px-3 py-3">{"\u5c55\u5385"}</th>
                    <th className="px-3 py-3">{"\u53c2\u89c2\u65e5\u671f"}</th>
                    <th className="px-3 py-3">{"\u533a\u57df"}</th>
                    <th className="px-3 py-3">{"\u5ba2\u6237\u7c7b\u578b"}</th>
                    <th className="px-3 py-3">{"\u72b6\u6001"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-300/10">
                  {summary.recentAppointments.map((appointment) => (
                    <tr key={appointment.id} className="text-slate-300">
                      <td className="min-w-44 px-3 py-3 font-semibold text-white">{appointment.companyName}</td>
                      <td className="whitespace-nowrap px-3 py-3">{appointment.contactName}</td>
                      <td className="whitespace-nowrap px-3 py-3">{appointment.showroomName}</td>
                      <td className="whitespace-nowrap px-3 py-3">{formatDate(appointment.visitDate)}</td>
                      <td className="whitespace-nowrap px-3 py-3">{appointment.regionName}</td>
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
    <section className={`rounded-lg border border-cyan-300/20 bg-slate-950/55 shadow-lg shadow-cyan-950/10 ${className}`}>
      {title ? (
        <div className="border-b border-cyan-300/15 px-4 py-3">
          <h2 className="text-base font-bold text-white">{title}</h2>
          {description ? <p className="mt-1 text-xs text-slate-400">{description}</p> : null}
        </div>
      ) : null}
      <div className={title ? "p-4" : ""}>{children}</div>
    </section>
  );
}

function RankingList({ items, max }: { items: Array<{ label: string; count?: number; value?: number }>; max?: number }) {
  if (!items.length) return <EmptyState />;
  const maxValue = max ?? Math.max(...items.map((item) => item.count ?? item.value ?? 0), 0);
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-semibold text-slate-100">
              <span className="mr-2 text-cyan-300">{String(index + 1).padStart(2, "0")}</span>
              {item.label}
            </span>
            <span className="font-bold text-white">{item.count ?? item.value ?? 0}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-700/70">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300" style={{ width: chartPercent(item.count ?? item.value ?? 0, maxValue) }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function TrendTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-cyan-300/25 bg-slate-950/95 px-3 py-2 text-xs text-slate-200 shadow-xl shadow-cyan-950/30">
      <p className="font-semibold text-cyan-100">{"\u7edf\u8ba1\u5468\u671f"}: {label}</p>
      <p className="mt-1">
        {"\u5230\u8bbf\u6570\u91cf"}: <span className="font-bold text-white">{payload[0]?.value ?? 0}</span>
      </p>
    </div>
  );
}

function DashboardFilters({ summary }: { summary: DashboardSummary }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const period = summary.filters.period || "quarter";

  function updateParams(values: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(values).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  }

  function updateParam(key: string, value: string) {
    updateParams({ [key]: value });
  }

  return (
    <div className="flex h-11 flex-wrap items-center gap-2 rounded-lg border border-cyan-300/20 bg-slate-950/45 px-2 lg:flex-nowrap">
      <select
        value={period}
        onChange={(event) => updateParams({ period: event.target.value })}
        className="h-8 rounded-md border border-cyan-300/20 bg-slate-950 px-3 text-sm font-semibold text-cyan-50 outline-none"
        aria-label={"\u9009\u62e9\u7edf\u8ba1\u5468\u671f"}
      >
        {periodOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <select
        value={summary.filters.year}
        onChange={(event) => updateParam("year", event.target.value)}
        className="h-8 rounded-md border border-cyan-300/20 bg-slate-950 px-3 text-sm font-semibold text-cyan-50 outline-none"
        aria-label={"\u9009\u62e9\u5e74\u4efd"}
      >
        {summary.filters.availableYears.map((year) => (
          <option key={year} value={year}>
            {year} {"\u5e74"}
          </option>
        ))}
      </select>

      {period === "quarter" ? (
        <select
          value={summary.filters.quarter}
          onChange={(event) => updateParam("quarter", event.target.value)}
          className="h-8 rounded-md border border-cyan-300/20 bg-slate-950 px-3 text-sm font-semibold text-cyan-50 outline-none"
          aria-label={"\u9009\u62e9\u5b63\u5ea6"}
        >
          {[1, 2, 3, 4].map((quarter) => (
            <option key={quarter} value={quarter}>
              Q{quarter}
            </option>
          ))}
        </select>
      ) : null}

      {period === "month" ? (
        <select
          value={summary.filters.month}
          onChange={(event) => updateParam("month", event.target.value)}
          className="h-8 rounded-md border border-cyan-300/20 bg-slate-950 px-3 text-sm font-semibold text-cyan-50 outline-none"
          aria-label={"\u9009\u62e9\u6708\u4efd"}
        >
          {monthOptions.map((month) => (
            <option key={month} value={month}>
              {month} {"\u6708"}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}
function ChinaRegionMap({ summary }: { summary: DashboardSummary }) {
  const [mapData, setMapData] = useState<ProjectedMapData>({ main: [], inset: [] });
  const [loadError, setLoadError] = useState(false);
  const [activeRegionName, setActiveRegionName] = useState<string | null>(null);
  const [pinnedRegionName, setPinnedRegionName] = useState<string | null>(null);
  const regionCount = useMemo(() => new Map(summary.regionOverview.map((item) => [item.name, item.count])), [summary.regionOverview]);
  const regionMeta = useMemo(() => new Map(summary.regionOverview.map((item) => [item.name, item])), [summary.regionOverview]);
  const provinceMeta = useMemo(() => {
    const meta = new Map<string, DashboardSummary["provinceRegionMap"][number]>();
    for (const item of summary.provinceRegionMap) {
      meta.set(item.province, item);
      meta.set(normalizeProvinceName(item.province), item);
    }
    return meta;
  }, [summary.provinceRegionMap]);

  useEffect(() => {
    let cancelled = false;
    async function loadMap() {
      setLoadError(false);
      try {
        const response = await fetch(CHINA_GEOJSON_URL);
        if (!response.ok) throw new Error("MAP_LOAD_FAILED");
        const geoJson = (await response.json()) as GeoFeatureCollection;
        if (cancelled) return;
        setMapData(projectChinaFeatures(geoJson, provinceMeta, regionCount));
      } catch {
        if (!cancelled) setLoadError(true);
      }
    }
    loadMap();
    return () => {
      cancelled = true;
    };
  }, [provinceMeta, regionCount]);

  const activeRegion = activeRegionName ? regionMeta.get(activeRegionName) : null;

  function activateRegion(regionName: string) {
    setActiveRegionName(regionName);
  }

  function clearHoveredRegion() {
    if (!pinnedRegionName) setActiveRegionName(null);
  }

  function togglePinnedRegion(regionName: string) {
    setPinnedRegionName((current) => {
      const next = current === regionName ? null : regionName;
      setActiveRegionName(next);
      return next;
    });
  }

  if (loadError) {
    return <EmptyState text={"\u5730\u56fe\u6570\u636e\u52a0\u8f7d\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5 public/maps/china.json"} />;
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="relative overflow-hidden rounded-lg border border-cyan-300/15 bg-[#08203f]/65 p-3">
        <svg viewBox="0 0 1000 760" className="h-[560px] w-full select-none drop-shadow-[0_24px_28px_rgba(8,47,73,0.35)]" role="img" aria-label={"\u4e2d\u56fd\u533a\u57df\u5230\u8bbf\u5730\u56fe"}>
          <defs>
            <linearGradient id="mapSide" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#0f172a" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0.95" />
            </linearGradient>
            <radialGradient id="mapRippleGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.18" />
              <stop offset="62%" stopColor="#38bdf8" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="oceanSheen" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0" />
              <stop offset="50%" stopColor="#67e8f9" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="oceanGlow" cx="50%" cy="60%" r="56%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.14" />
              <stop offset="70%" stopColor="#0ea5e9" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0" />
            </radialGradient>
            <pattern id="oceanDots" width="34" height="34" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="3" r="1" fill="#67e8f9" opacity="0.16" />
            </pattern>
            <filter id="oceanSoftGlow" x="-10%" y="-80%" width="120%" height="260%">
              <feGaussianBlur stdDeviation="2.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g pointerEvents="none" opacity="0.72">
            <rect x="54" y="520" width="890" height="210" fill="url(#oceanGlow)" />
            <rect x="54" y="538" width="890" height="178" fill="url(#oceanDots)" opacity="0.42">
              <animateTransform attributeName="transform" type="translate" values="0 0; 34 0; 0 0" dur="14s" repeatCount="indefinite" />
            </rect>
            <g filter="url(#oceanSoftGlow)">
              {[
                "M78 590 C180 560 250 620 350 592 S540 560 658 594 824 624 938 586",
                "M92 638 C210 606 294 660 426 632 S624 604 728 638 846 662 930 636",
                "M118 684 C220 666 322 704 448 680 S640 654 770 686 854 704 922 684",
              ].map((path, index) => (
                <path
                  key={`ocean-wave-${index}`}
                  d={path}
                  fill="none"
                  stroke="url(#oceanSheen)"
                  strokeWidth={index === 0 ? "2.4" : "1.8"}
                  strokeDasharray="110 280"
                  opacity={0.72 - index * 0.16}
                >
                  <animate attributeName="stroke-dashoffset" from={index % 2 === 0 ? "390" : "0"} to={index % 2 === 0 ? "0" : "-390"} dur={`${8 + index * 1.6}s`} repeatCount="indefinite" />
                </path>
              ))}
            </g>
            {[
              [110, 636],
              [202, 674],
              [318, 612],
              [468, 704],
              [590, 646],
              [718, 690],
              [842, 622],
              [908, 702],
            ].map(([cx, cy], index) => (
              <circle key={`ocean-light-${index}`} cx={cx} cy={cy} r="2.6" fill="#a5f3fc" opacity="0.2">
                <animate attributeName="opacity" values="0.12;0.44;0.12" dur={`${3.6 + index * 0.22}s`} repeatCount="indefinite" />
              </circle>
            ))}
          </g>
          <g pointerEvents="none" opacity="0.72">
            <ellipse cx="240" cy="184" rx="92" ry="30" fill="url(#mapRippleGlow)" />
            <ellipse cx="240" cy="184" rx="64" ry="20" fill="none" stroke="#67e8f9" strokeOpacity="0.26" strokeWidth="1.2" strokeDasharray="6 10" />
            <ellipse cx="240" cy="184" rx="118" ry="38" fill="none" stroke="#38bdf8" strokeOpacity="0.16" strokeWidth="1" strokeDasharray="10 14" />
            <ellipse cx="240" cy="184" rx="152" ry="50" fill="none" stroke="#0ea5e9" strokeOpacity="0.1" strokeWidth="1" strokeDasharray="14 18" />
            <circle cx="240" cy="184" r="3" fill="#a5f3fc" opacity="0.75" />
            <path d="M120 184 H360" stroke="#67e8f9" strokeOpacity="0.1" strokeWidth="1" />
            <path d="M240 122 V246" stroke="#67e8f9" strokeOpacity="0.08" strokeWidth="1" />
          </g>
          <g transform="translate(14 18)" opacity="0.58">
            {mapData.main.map((feature) => (
              <path key={`${feature.name}-side`} d={feature.path} fill="url(#mapSide)" stroke="#0f172a" strokeWidth="1" />
            ))}
          </g>
          <g>
            {mapData.main.map((feature) => (
              <path
                key={feature.name}
                d={feature.path}
                fill={feature.color}
                fillOpacity={activeRegionName && activeRegionName !== feature.regionName ? "0.36" : "0.9"}
                stroke={activeRegionName === feature.regionName ? "#e0f2fe" : "rgba(255,255,255,0.42)"}
                strokeWidth={activeRegionName === feature.regionName ? "1.8" : "0.7"}
                className="cursor-pointer transition-opacity duration-150"
                onMouseEnter={() => activateRegion(feature.regionName)}
                onMouseLeave={clearHoveredRegion}
                onClick={() => togglePinnedRegion(feature.regionName)}
              >
                <title>{`${feature.regionName}: ${feature.count} ${"\u6761\u5230\u8bbf"}`}</title>
              </path>
            ))}
          </g>
          <g pointerEvents="none">
            {mapData.main.map((feature) => (
              <text
                key={`${feature.name}-label`}
                x={feature.labelX}
                y={feature.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-white text-[11px] font-semibold tracking-wide"
                stroke="#020617"
                strokeWidth="3"
                paintOrder="stroke"
              >
                {feature.label}
              </text>
            ))}
          </g>
        </svg>
        {activeRegion ? (
          <div
            className="pointer-events-none absolute left-4 top-4 max-w-72 rounded-lg border bg-slate-950/90 p-4 shadow-xl shadow-cyan-950/40 backdrop-blur"
            style={{ borderColor: `${activeRegion.color}88` }}
          >
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: activeRegion.color }} />
              <p className="text-sm font-bold text-white">{activeRegion.name}</p>
              {pinnedRegionName === activeRegion.name ? (
                <span className="rounded-full border border-cyan-300/25 px-2 py-0.5 text-[10px] font-semibold text-cyan-200">{"\u5df2\u56fa\u5b9a"}</span>
              ) : null}
            </div>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-3xl font-bold text-white">{activeRegion.count}</span>
               <span className="pb-1 text-xs text-slate-400">{"\u6761\u5230\u8bbf"}</span>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-400">
              {"\u5305\u542b\u7701\u4efd"}：{activeRegion.provinces.length > 0 ? activeRegion.provinces.map(shortProvinceName).join("\u3001") : "\u6682\u65e0\u914d\u7f6e"}
            </p>
            <p className="mt-2 text-[11px] text-slate-500">{"\u70b9\u51fb\u7701\u4efd\u6216\u53f3\u4fa7\u5927\u533a\u53ef\u56fa\u5b9a\u5c55\u793a\uff0c\u518d\u6b21\u70b9\u51fb\u53d6\u6d88\u3002"}</p>
          </div>
        ) : null}
        {mapData.inset.length > 0 ? (
          <div className="absolute bottom-4 right-4 rounded-md border border-cyan-300/25 bg-slate-950/70 p-2 shadow-lg shadow-cyan-950/30">
            <svg viewBox="0 0 180 140" className="h-24 w-32 select-none" aria-label={"\u5357\u6d77\u8bf8\u5c9b\u7f29\u7565\u56fe"}>
              <g transform="translate(4 5)" opacity="0.5">
                {mapData.inset.map((feature) => (
                  <path key={`${feature.name}-inset-side`} d={feature.path} fill="url(#mapSide)" stroke="#0f172a" strokeWidth="1" />
                ))}
              </g>
              <g>
                {mapData.inset.map((feature) => (
                  <path
                    key={`${feature.name}-inset`}
                    d={feature.path}
                    fill={feature.color}
                    fillOpacity="0.84"
                    stroke="rgba(255,255,255,0.45)"
                    strokeWidth="0.8"
                  />
                ))}
              </g>
            </svg>
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border border-cyan-300/15 bg-slate-950/55 p-4">
        <div className="flex items-end justify-between gap-3 border-b border-cyan-300/15 pb-3">
          <div>
            <p className="text-sm font-semibold text-cyan-100">{"\u5927\u533a\u5230\u8bbf\u6570\u636e"}</p>
          </div>
          <span className="text-xs text-slate-500">{summary.regionOverview.length} {"\u4e2a\u533a\u57df"}</span>
        </div>

        <div className="mt-4 space-y-2">
          {summary.regionOverview.map((region, index) => (
            <div
              key={region.name}
              className={`cursor-pointer rounded-lg border px-3 py-3 transition ${
                activeRegionName === region.name ? "bg-white/[0.11] shadow-lg shadow-cyan-950/20" : "bg-white/[0.045] hover:bg-white/[0.075]"
              }`}
              style={{ borderColor: activeRegionName === region.name ? region.color : `${region.color}66` }}
              onMouseEnter={() => activateRegion(region.name)}
              onMouseLeave={clearHoveredRegion}
              onClick={() => togglePinnedRegion(region.name)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-3 w-3 shrink-0 rounded-sm shadow-sm" style={{ backgroundColor: region.color }} />
                  <span className="text-xs font-semibold text-cyan-300">{String(index + 1).padStart(2, "0")}</span>
                  <span className="truncate text-sm font-bold text-white">{region.name}</span>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-xl font-bold text-white">{region.count}</span>
                  <span className="ml-1 text-xs text-slate-400">{"\u6761\u5230\u8bbf"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function projectChinaFeatures(
  geoJson: GeoFeatureCollection,
  provinceMeta: Map<string, DashboardSummary["provinceRegionMap"][number]>,
  regionCount: Map<string, number>,
): ProjectedMapData {
  const mainSource = [] as Array<{ feature: GeoFeature; rings: [number, number][][] }>;
  const insetSource = [] as Array<{ feature: GeoFeature; rings: [number, number][][] }>;

  for (const feature of geoJson.features) {
    const mainRings: [number, number][][] = [];
    const insetRings: [number, number][][] = [];

    for (const ring of geometryToRings(feature.geometry)) {
      const projectedRing = ring.map(projectPoint);
      if (isSouthSeaInsetRing(ring)) {
        insetRings.push(projectedRing);
      } else {
        mainRings.push(projectedRing);
      }
    }

    if (mainRings.length > 0) mainSource.push({ feature, rings: mainRings });
    if (insetRings.length > 0) insetSource.push({ feature, rings: insetRings });
  }

  return {
    main: fitProjectedFeatures(mainSource, provinceMeta, regionCount, 1000, 760, 12, true),
    inset: fitProjectedFeatures(insetSource, provinceMeta, regionCount, 180, 140, 8, false),
  };
}

function fitProjectedFeatures(
  source: Array<{ feature: GeoFeature; rings: [number, number][][] }>,
  provinceMeta: Map<string, DashboardSummary["provinceRegionMap"][number]>,
  regionCount: Map<string, number>,
  targetWidth: number,
  targetHeight: number,
  padding: number,
  includeLabels: boolean,
) {
  if (source.length === 0) return [];

  const allPoints = source.flatMap((item) => item.rings.flat());
  const minX = Math.min(...allPoints.map((point) => point[0]));
  const maxX = Math.max(...allPoints.map((point) => point[0]));
  const minY = Math.min(...allPoints.map((point) => point[1]));
  const maxY = Math.max(...allPoints.map((point) => point[1]));
  const width = targetWidth - padding * 2;
  const height = targetHeight - padding * 2;
  const scale = Math.min(width / (maxX - minX), height / (maxY - minY));

  function fit(point: [number, number]) {
    return [padding + (point[0] - minX) * scale, padding + (point[1] - minY) * scale] as [number, number];
  }

  return source.map(({ feature, rings }) => {
    const provinceName = normalizeProvinceName(feature.properties?.name || "");
    const meta = provinceMeta.get(provinceName);
    const regionName = meta?.regionName || "\u672a\u5206\u533a";
    const fittedRings = rings.map((ring) => ring.map(fit));
    const [labelX, labelY] = includeLabels ? labelPointForProvince(provinceName, fittedRings, fit) : ([0, 0] as [number, number]);
    return {
      name: provinceName || feature.properties?.name || "\u672a\u77e5\u7701\u4efd",
      path: ringsToPath(fittedRings),
      regionName,
      color: meta?.color || "#94a3b8",
      count: regionCount.get(regionName) || 0,
      label: includeLabels ? shortProvinceName(provinceName || feature.properties?.name || "") : "",
      labelX,
      labelY,
    };
  });
}

function isSouthSeaInsetRing(ring: number[][]) {
  const maxLat = Math.max(...ring.map((point) => point[1]));
  const minLat = Math.min(...ring.map((point) => point[1]));
  const minLon = Math.min(...ring.map((point) => point[0]));
  const maxLon = Math.max(...ring.map((point) => point[0]));

  return maxLat < 18 || (minLat < 18 && minLon > 105 && maxLon < 125);
}

function labelPointForProvince(
  provinceName: string,
  rings: [number, number][][],
  fit: (point: [number, number]) => [number, number],
) {
  const coordinate = provinceLabelCoordinates[normalizeProvinceName(provinceName)];
  if (coordinate) {
    return fit(projectPoint(coordinate));
  }

  return labelPointForRings(rings);
}

function labelPointForRings(rings: [number, number][][]) {
  const largestRing = rings.reduce((largest, ring) => (Math.abs(polygonArea(ring)) > Math.abs(polygonArea(largest)) ? ring : largest), rings[0] || []);
  if (!largestRing.length) return [500, 380] as [number, number];
  const xs = largestRing.map((point) => point[0]);
  const ys = largestRing.map((point) => point[1]);
  return [
    (Math.min(...xs) + Math.max(...xs)) / 2,
    (Math.min(...ys) + Math.max(...ys)) / 2,
  ] as [number, number];
}

function polygonArea(ring: [number, number][]) {
  return ring.reduce((area, point, index) => {
    const next = ring[(index + 1) % ring.length];
    return area + point[0] * next[1] - next[0] * point[1];
  }, 0) / 2;
}

function geometryToRings(geometry: GeoGeometry) {
  if (geometry.type === "Polygon") return geometry.coordinates as number[][][];
  return (geometry.coordinates as number[][][][]).flat();
}

function projectPoint(point: number[]) {
  const lon = point[0];
  const lat = Math.max(Math.min(point[1], 85), -85);
  const x = lon;
  const y = -Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) * (180 / Math.PI);
  return [x, y] as [number, number];
}

function ringsToPath(rings: [number, number][][]) {
  return rings
    .map((ring) =>
      ring
        .map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
        .join(" ") + " Z",
    )
    .join(" ");
}

function normalizeProvinceName(name: string) {
  return name
    .replace(/(\u7701|\u5e02|\u58ee\u65cf\u81ea\u6cbb\u533a|\u56de\u65cf\u81ea\u6cbb\u533a|\u7ef4\u543e\u5c14\u81ea\u6cbb\u533a|\u81ea\u6cbb\u533a|\u7279\u522b\u884c\u653f\u533a)$/u, "")
    .replace(/^\u5185\u8499\u53e4$/u, "\u5185\u8499\u53e4")
    .trim();
}

function shortProvinceName(name: string) {
  const normalized = normalizeProvinceName(name);
  const aliases: Record<string, string> = {
    "\u5185\u8499\u53e4": "\u5185\u8499\u53e4",
    "\u9ed1\u9f99\u6c5f": "\u9ed1\u9f99\u6c5f",
    "\u65b0\u7586": "\u65b0\u7586",
    "\u5e7f\u897f": "\u5e7f\u897f",
    "\u5b81\u590f": "\u5b81\u590f",
    "\u897f\u85cf": "\u897f\u85cf",
    "\u9999\u6e2f": "\u9999\u6e2f",
    "\u6fb3\u95e8": "\u6fb3\u95e8",
  };
  return aliases[normalized] || normalized;
}
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
        <div className="scrollbar-none fixed inset-0 z-[9999] overflow-y-auto">
          <ScreenShell summary={summary} isFullscreen onToggleFullscreen={() => setIsFullscreen(false)} />
        </div>
      ) : null}
    </>
  );
}
