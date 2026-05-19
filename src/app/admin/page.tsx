import { redirect } from "next/navigation";
import { getCurrentAdminUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminIndexPage() {
  const currentUser = await getCurrentAdminUser();
  if (!currentUser) {
    redirect("/admin/login");
  }

  redirect("/admin/appointments");
}
