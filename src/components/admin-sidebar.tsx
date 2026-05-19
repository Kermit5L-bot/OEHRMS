import Link from "next/link";

const adminNavItems = [
  { href: "/admin/appointments", label: "预约管理" },
  { href: "/admin/leads", label: "留资管理" },
  { href: "/admin/showrooms", label: "展厅管理" },
];

export function AdminSidebar() {
  return (
    <aside className="min-h-screen w-64 border-r border-slate-200 bg-slate-950 px-4 py-6 text-white">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-wide text-slate-400">Admin</p>
        <h1 className="mt-1 text-lg font-semibold">展厅预约后台</h1>
      </div>
      <nav className="space-y-2">
        {adminNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-md px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
