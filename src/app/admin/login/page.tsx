import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";
import { getCurrentAdminUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const currentUser = await getCurrentAdminUser();
  if (currentUser) {
    redirect("/admin/appointments");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-blue-700">后台管理</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">后台登录</h1>
        <p className="mt-3 text-slate-600">请输入管理员账号和密码进入展厅预约后台。</p>
        <AdminLoginForm />
      </section>
    </main>
  );
}
