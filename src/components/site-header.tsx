"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Home, MonitorSmartphone } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

const navItems = [
  { href: "/", label: "首页", icon: Home },
  { href: "/showrooms", label: "展厅列表", icon: Building2 },
  { href: "/appointment", label: "预约参观", icon: MonitorSmartphone },
];

export function SiteHeader() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="sticky top-0 z-20 border-b border-cyan-300/15 bg-slate-950/82 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="min-w-0">
          <BrandMark variant="dark" logoOnly />
        </Link>
        <nav className="flex shrink-0 items-center gap-1 text-sm text-slate-200 sm:gap-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative inline-flex min-h-10 items-center gap-1.5 rounded-full px-2.5 py-2 font-semibold transition hover:bg-cyan-300/10 sm:px-3 ${
                  active
                    ? "bg-blue-600 text-base font-bold text-white shadow-lg shadow-blue-950/30 ring-1 ring-blue-300/40 hover:bg-blue-500"
                    : "text-sm text-slate-200"
                }`}
              >
                <Icon className={active ? "h-[18px] w-[18px]" : "h-4 w-4"} />
                <span className={item.href === "/appointment" ? "hidden sm:inline" : ""}>{item.label}</span>
                {item.href === "/appointment" ? <span className="sm:hidden">预约</span> : null}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
