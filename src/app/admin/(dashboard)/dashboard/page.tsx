import { DashboardBigScreen } from "@/components/dashboard-big-screen";
import { getDashboardSummary } from "@/lib/admin-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const summary = await getDashboardSummary();

  return <DashboardBigScreen summary={summary} />;
}
