"use client";

import { usePathname } from "next/navigation";
import { AdminLogoutButton } from "@/components/admin-logout-button";

type AdminTopbarProps = {
  displayName: string;
};

export function AdminTopbar({ displayName }: AdminTopbarProps) {
  const pathname = usePathname();
  const isDashboard = pathname === "/admin/dashboard";
  const headerClassName = isDashboard
    ? "sticky top-0 z-40 flex h-[65px] shrink-0 items-center justify-between border-b border-cyan-300/15 bg-slate-950/95 px-4 shadow-sm shadow-cyan-950/25 backdrop-blur lg:px-8"
    : "sticky top-0 z-40 flex h-[65px] shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur lg:px-8";
  const labelClassName = isDashboard
    ? "text-xs font-semibold uppercase tracking-wide text-cyan-300"
    : "text-xs font-semibold uppercase tracking-wide text-blue-600";
  const nameClassName = isDashboard
    ? "mt-1 text-sm font-semibold text-white"
    : "mt-1 text-sm font-semibold text-slate-950";

  return (
    <header className={headerClassName}>
      <div>
        <p className={labelClassName}>{"\u5f53\u524d\u767b\u5f55\u7528\u6237"}</p>
        <p className={nameClassName}>{displayName}</p>
      </div>
      <AdminLogoutButton variant={isDashboard ? "dark" : "light"} />
    </header>
  );
}
