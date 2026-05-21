import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";
import { BrandMark } from "@/components/brand-mark";
import { getCurrentAdminUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const currentUser = await getCurrentAdminUser();
  if (currentUser) {
    redirect("/admin/appointments");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-200/60 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="bg-slate-950 p-8 text-white">
          <BrandMark variant="dark" subtitle="智慧展厅预约管理后台" />
          <h1 className="mt-10 text-3xl font-bold leading-tight">统一预约审批与客户线索管理</h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            面向展会接待、展厅参观和实训基地交流，提供清晰高效的后台管理入口。
          </p>
        </div>
        <div className="p-8">
        <h2 className="text-3xl font-bold text-slate-950">后台登录</h2>
        <p className="mt-3 text-slate-600">请输入管理员账号和密码，进入展厅预约后台。</p>
        <AdminLoginForm />
        </div>
      </section>
    </main>
  );
}
