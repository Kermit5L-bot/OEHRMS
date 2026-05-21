import { redirect } from "next/navigation";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { AdminSidebar } from "@/components/admin-sidebar";
import { getCurrentAdminUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">当前登录用户</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">{currentUser.realName || currentUser.username}</p>
          </div>
          <AdminLogoutButton />
        </header>
        <main className="relative flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
