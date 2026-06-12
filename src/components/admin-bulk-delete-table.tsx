"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Plus, Trash2 } from "lucide-react";
import { AdminAppointmentImportActions } from "@/components/admin-appointment-import-actions";

type AdminBulkDeleteTableProps = {
  children: React.ReactNode;
  endpoint: string;
  itemName: string;
  toolbarVariant?: "appointments";
  exportHref?: string;
};

export function AdminBulkDeleteTable({
  children,
  endpoint,
  itemName,
  toolbarVariant,
  exportHref,
}: AdminBulkDeleteTableProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const getRowCheckboxes = () =>
      Array.from(container.querySelectorAll<HTMLInputElement>("input[data-bulk-delete-row]"));
    const getAllCheckbox = () => container.querySelector<HTMLInputElement>("input[data-bulk-delete-all]");

    function syncSelection() {
      const rowCheckboxes = getRowCheckboxes();
      const checkedIds = rowCheckboxes
        .filter((checkbox) => checkbox.checked)
        .map((checkbox) => Number(checkbox.value))
        .filter((id) => Number.isInteger(id) && id > 0);
      const allCheckbox = getAllCheckbox();

      if (allCheckbox) {
        allCheckbox.checked = rowCheckboxes.length > 0 && checkedIds.length === rowCheckboxes.length;
        allCheckbox.indeterminate = checkedIds.length > 0 && checkedIds.length < rowCheckboxes.length;
      }

      setSelectedIds(checkedIds);
    }

    function handleChange(event: Event) {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;

      if (target.matches("input[data-bulk-delete-all]")) {
        getRowCheckboxes().forEach((checkbox) => {
          checkbox.checked = target.checked;
        });
      }

      syncSelection();
    }

    container.addEventListener("change", handleChange);
    syncSelection();

    return () => container.removeEventListener("change", handleChange);
  }, [children]);

  async function handleBulkDelete() {
    if (selectedIds.length === 0 || isDeleting) return;

    const confirmed = window.confirm(
      `确定要删除选中的 ${selectedIds.length} 条${itemName}吗？此操作不可撤销。`,
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        window.alert(result.error || "批量删除失败，请稍后重试");
        return;
      }

      setSelectedIds([]);
      router.refresh();
    } catch {
      window.alert("批量删除失败，请稍后重试");
    } finally {
      setIsDeleting(false);
    }
  }

  const deleteButton =
    selectedIds.length > 0 ? (
      <button
        type="button"
        onClick={handleBulkDelete}
        disabled={isDeleting}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
      >
        <Trash2 className="h-4 w-4" />
        {isDeleting ? "删除中..." : `批量删除（${selectedIds.length}）`}
      </button>
    ) : null;

  const defaultDeleteBar =
    selectedIds.length > 0 ? (
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-100 bg-red-50 px-4 py-3">
        <p className="text-sm font-medium text-red-700">
          已选择 <span className="font-bold">{selectedIds.length}</span> 条{itemName}
        </p>
        {deleteButton}
      </div>
    ) : null;

  const appointmentToolbar =
    toolbarVariant === "appointments" ? (
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Link
          href="/admin/appointments/new"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#2563EB] px-4 py-2 text-sm font-semibold !text-white shadow-lg shadow-blue-900/15 ring-1 ring-blue-500/20 hover:bg-[#1D4ED8]"
        >
          <Plus className="h-4 w-4 text-white" />
          <span className="text-white">新增预约</span>
        </Link>
        <Link
          href={exportHref || "/api/admin/appointments/export"}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-50"
        >
          <Download className="h-4 w-4" />
          按当前筛选导出 Excel
        </Link>
        <AdminAppointmentImportActions compact />
        {deleteButton}
      </div>
    ) : null;

  return (
    <div ref={containerRef}>
      {appointmentToolbar || defaultDeleteBar}
      {children}
    </div>
  );
}
