import { DashboardBigScreen } from "@/components/dashboard-big-screen";
import { getDashboardSummary, type DashboardFilters } from "@/lib/admin-dashboard";

export const dynamic = "force-dynamic";

type AdminDashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  const params = await searchParams;
  const year = Number(getSingleValue(params.year));
  const quarter = Number(getSingleValue(params.quarter));
  const month = Number(getSingleValue(params.month));
  const period = getSingleValue(params.period);
  const filters: DashboardFilters = {
    period: period === "year" || period === "quarter" || period === "month" ? period : undefined,
    year: Number.isInteger(year) ? year : undefined,
    quarter: quarter === 1 || quarter === 2 || quarter === 3 || quarter === 4 ? (quarter as 1 | 2 | 3 | 4) : undefined,
    month: Number.isInteger(month) && month >= 1 && month <= 12 ? month : undefined,
  };
  const summary = await getDashboardSummary(filters);

  return <DashboardBigScreen summary={summary} />;
}
