"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

type AdminAppointmentDeleteButtonProps = {
  appointmentId: number;
  appointmentNo: string;
};

export function AdminAppointmentDeleteButton({ appointmentId, appointmentNo }: AdminAppointmentDeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(`确认删除预约 ${appointmentNo}？删除后该预约记录会从后台移除，并同步更新对应客户留资统计。`);
    if (!confirmed || isDeleting) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/appointments/${appointmentId}`, {
        method: "DELETE",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        window.alert(result.error || "预约删除失败，请稍后重试");
        return;
      }

      router.refresh();
    } catch {
      window.alert("网络异常，请稍后重试");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <button
      type="button"
      disabled={isDeleting}
      onClick={handleDelete}
      className="inline-flex items-center gap-1 font-semibold text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:text-slate-300"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {isDeleting ? "删除中..." : "删除"}
    </button>
  );
}
