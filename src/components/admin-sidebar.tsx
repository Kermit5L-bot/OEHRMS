"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Building2, CalendarCheck, UsersRound } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

const adminNavItems = [
  { href: "/admin/dashboard", label: "数据看板", icon: BarChart3 },
  { href: "/admin/appointments", label: "预约管理", icon: CalendarCheck },
  { href: "/admin/leads", label: "留资管理", icon: UsersRound },
  { href: "/admin/showrooms", label: "展厅管理", icon: Building2 },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="relative overflow-hidden border-b border-cyan-300/15 bg-slate-950 px-4 py-4 text-white lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r lg:px-4 lg:py-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(56,189,248,0.24),transparent_14rem),linear-gradient(135deg,#020617_0%,#07111f_52%,#0b1220_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.08)_1px,transparent_1px)] bg-[size:28px_28px] opacity-70" />
      <div className="relative z-10 px-1 py-2">
        <BrandMark variant="dark" logoOnly />
      </div>
      <nav className="relative z-10 mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:mt-8 lg:grid-cols-1">
        {adminNavItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-md px-3 py-3 text-sm font-semibold transition ${
                active
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-950/40 ring-1 ring-cyan-300/30"
                  : "text-slate-300 hover:bg-cyan-300/10 hover:text-white"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                  active ? "bg-white/18 text-white" : "bg-cyan-300/10 text-cyan-200"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
