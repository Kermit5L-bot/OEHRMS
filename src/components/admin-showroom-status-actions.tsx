"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ShowroomStatusValue } from "@/lib/showrooms";

type AdminShowroomStatusActionsProps = {
  showroomId: number;
  status: ShowroomStatusValue;
};

type StatusAction = {
  label: string;
  status: ShowroomStatusValue;
  tone: string;
  confirm?: string;
};

function getActions(status: ShowroomStatusValue): StatusAction[] {
  if (status === "open") {
    return [
      { label: "暂停预约", status: "closed", tone: "neutral" },
      {
        label: "隐藏",
        status: "hidden",
        tone: "warning",
        confirm: "隐藏后用户端将不再展示该展厅，但后台仍可管理。确认隐藏吗？",
      },
      {
        label: "删除",
        status: "deleted",
        tone: "danger",
        confirm: "删除后该展厅将不再对外展示，但历史预约记录仍会保留。确认删除吗？",
      },
    ];
  }

  if (status === "closed") {
    return [
      { label: "开放预约", status: "open", tone: "primary" },
      {
        label: "隐藏",
        status: "hidden",
        tone: "warning",
        confirm: "隐藏后用户端将不再展示该展厅，但后台仍可管理。确认隐藏吗？",
      },
      {
        label: "删除",
        status: "deleted",
        tone: "danger",
        confirm: "删除后该展厅将不再对外展示，但历史预约记录仍会保留。确认删除吗？",
      },
    ];
  }

  if (status === "hidden") {
    return [
      { label: "取消隐藏", status: "closed", tone: "primary" },
      {
        label: "删除",
        status: "deleted",
        tone: "danger",
        confirm: "删除后该展厅将不再对外展示，但历史预约记录仍会保留。确认删除吗？",
      },
    ];
  }

  return [{ label: "恢复为暂停预约", status: "closed", tone: "primary" }];
}

function getToneClass(tone: string) {
  switch (tone) {
    case "primary":
      return "border-blue-200 text-blue-700 hover:bg-blue-50";
    case "warning":
      return "border-amber-200 text-amber-700 hover:bg-amber-50";
    case "danger":
      return "border-red-200 text-red-700 hover:bg-red-50";
    default:
      return "border-slate-300 text-slate-700 hover:bg-slate-50";
  }
}

export function AdminShowroomStatusActions({ showroomId, status }: AdminShowroomStatusActionsProps) {
  const router = useRouter();
  const [pendingStatus, setPendingStatus] = useState<ShowroomStatusValue | null>(null);
  const [error, setError] = useState("");

  async function updateStatus(action: StatusAction) {
    setError("");
    if (action.confirm && !window.confirm(action.confirm)) return;

    setPendingStatus(action.status);
    try {
      const response = await fetch(`/api/admin/showrooms/${showroomId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action.status }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setError(result?.error || "状态更新失败，请稍后重试");
        return;
      }

      router.refresh();
    } catch {
      setError("状态更新失败，请稍后重试");
    } finally {
      setPendingStatus(null);
    }
  }

  return (
    <div className="mt-2 flex max-w-xs flex-wrap gap-2">
      {getActions(status).map((action) => (
        <button
          key={`${showroomId}-${action.status}`}
          type="button"
          disabled={pendingStatus !== null}
          onClick={() => updateStatus(action)}
          className={`rounded-md border px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${getToneClass(action.tone)}`}
        >
          {pendingStatus === action.status ? "处理中..." : action.label}
        </button>
      ))}
      {error ? <p className="basis-full text-xs font-medium text-red-600">{error}</p> : null}
    </div>
  );
}
