import { SiteHeader } from "@/components/site-header";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="tech-site-shell">
      <SiteHeader />
      <main>{children}</main>
      <footer className="border-t border-cyan-300/15 bg-slate-950/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-white">万维盈创 · 智慧展厅预约</p>
            <p className="mt-1 text-slate-400">联系方式：4008-555-996</p>
          </div>
          <p className="text-slate-400">© {new Date().getFullYear()} 万维盈创 版权所有</p>
        </div>
      </footer>
    </div>
  );
}
