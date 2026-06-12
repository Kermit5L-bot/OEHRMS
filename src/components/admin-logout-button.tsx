"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

type AdminLogoutButtonProps = {
  variant?: "light" | "dark";
};

export function AdminLogoutButton({ variant = "light" }: AdminLogoutButtonProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const className =
    variant === "dark"
      ? "inline-flex items-center gap-2 rounded-md border border-cyan-300/25 bg-white/8 px-3 py-2 text-sm font-semibold text-cyan-50 hover:bg-white/14 disabled:cursor-not-allowed disabled:text-slate-500"
      : "inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400";

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await fetch("/api/admin/logout", {
        method: "POST",
      });
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      aria-label={"\u9000\u51fa\u767b\u5f55"}
      className={className}
    >
      <LogOut className="h-4 w-4" />
      {isLoggingOut ? "\u9000\u51fa\u4e2d..." : "\u9000\u51fa\u767b\u5f55"}
    </button>
  );
}