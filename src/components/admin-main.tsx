"use client";

import { usePathname } from "next/navigation";

type AdminMainProps = {
  children: React.ReactNode;
};

export function AdminMain({ children }: AdminMainProps) {
  const pathname = usePathname();
  const isDashboard = pathname === "/admin/dashboard";

  return (
    <main className={`relative min-h-0 flex-1 ${isDashboard ? "p-0" : "p-4 sm:p-6 lg:p-8"}`}>
      {children}
    </main>
  );
}
