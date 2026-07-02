"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AppointmentStatus } from "@prisma/client";
import { CheckCircle2, ClipboardCheck, FileCheck2, XCircle } from "lucide-react";
import { AppointmentStatusBadge } from "@/components/appointment-status-badge";

type AdminAppointmentActionsProps = {
  appointmentId: number;
  status: AppointmentStatus;
};

type ActionMessage = {
  type: "success" | "error";
  text: string;
};

type ActiveDialog = "approve" | "reject" | "complete" | null;

export function AdminAppointmentActions({ appointmentId, status }: AdminAppointmentActionsProps) {
  const router = useRouter();
  const [approvalOpinion, setApprovalOpinion] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [message, setMessage] = useState<ActionMessage | null>(null);

  async function postAction(path: string, body?: object) {
    setIsSubmitting(path);
    setMessage(null);
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage({ type: "error", text: result.error || "操作失败" });
        return false;
      }

      setMessage({ type: "success", text: "操作成功" });
      setActiveDialog(null);
      router.refresh();
      return true;
    } catch {
      setMessage({ type: "error", text: "网络异常，请稍后重试" });
      return false;
    } finally {
      setIsSubmitting(null);
    }
  }

  const canApprove = status === "pending";
  const canReject = status === "pending";
  const canComplete = status === "approved";
  const hasAction = canApprove || canReject || canComplete;

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-blue-100 bg-white/95 shadow-[0_-12px_30px_rgba(15,23,42,0.10)] backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-950">
              <ClipboardCheck className="h-4 w-4 text-blue-600" />
              审批操作
            </span>
            <AppointmentStatusBadge status={status} />
            {message ? (
              <span className={`rounded-md px-3 py-1.5 text-sm font-medium ${message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                {message.text}
              </span>
            ) : null}
            {!hasAction ? <span className="text-sm text-slate-500">当前状态无可执行审批操作</span> : null}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {canApprove ? (
              <button
                type="button"
                disabled={isSubmitting !== null}
                onClick={() => setActiveDialog("approve")}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <CheckCircle2 className="h-4 w-4" />
                通过预约
              </button>
            ) : null}
            {canReject ? (
              <button
                type="button"
                disabled={isSubmitting !== null}
                onClick={() => setActiveDialog("reject")}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <XCircle className="h-4 w-4" />
                拒绝预约
              </button>
            ) : null}
            {canComplete ? (
              <button
                type="button"
                disabled={isSubmitting !== null}
                onClick={() => setActiveDialog("complete")}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <FileCheck2 className="h-4 w-4" />
                {isSubmitting?.includes("complete") ? "提交中..." : "标记已完成"}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {activeDialog === "approve" ? (
        <ActionDialog
          title="通过预约"
          description="审批意见为选填，填写后会保存到该预约的审批信息中。"
          label="审批意见"
          value={approvalOpinion}
          placeholder="可填写审批意见，例如接待安排或注意事项"
          confirmText={isSubmitting?.includes("approve") ? "提交中..." : "确定通过"}
          confirmClassName="bg-emerald-600 hover:bg-emerald-700"
          disabled={isSubmitting !== null}
          onChange={setApprovalOpinion}
          onCancel={() => setActiveDialog(null)}
          onConfirm={() => postAction(`/api/admin/appointments/${appointmentId}/approve`, { approvalOpinion })}
        />
      ) : null}

      {activeDialog === "reject" ? (
        <ActionDialog
          title="拒绝预约"
          description="拒绝原因必填，保存后会显示在预约详情的审批信息中。"
          label="拒绝原因"
          value={rejectReason}
          placeholder="请填写拒绝原因"
          confirmText={isSubmitting?.includes("reject") ? "提交中..." : "确定拒绝"}
          confirmClassName="bg-red-600 hover:bg-red-700"
          disabled={isSubmitting !== null}
          required
          onChange={setRejectReason}
          onCancel={() => setActiveDialog(null)}
          onConfirm={() => postAction(`/api/admin/appointments/${appointmentId}/reject`, { rejectReason })}
        />
      ) : null}

      {activeDialog === "complete" ? (
        <ConfirmDialog
          title="确认标记已完成"
          description="确认后该预约状态会变为已完成，历史预约记录会保留。已完成后仍可编辑预约信息，但状态流转不会自动回退。"
          confirmText={isSubmitting?.includes("complete") ? "提交中..." : "确认完成"}
          confirmClassName="bg-blue-600 hover:bg-blue-700"
          disabled={isSubmitting !== null}
          onCancel={() => setActiveDialog(null)}
          onConfirm={() => postAction(`/api/admin/appointments/${appointmentId}/complete`)}
        />
      ) : null}
    </>
  );
}

function ConfirmDialog({
  title,
  description,
  confirmText,
  confirmClassName,
  disabled,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmText: string;
  confirmClassName: string;
  disabled: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/35 px-4 py-6 sm:items-center">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
        <div>
          <h2 className="text-lg font-bold text-slate-950">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={disabled}
            onClick={onCancel}
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            取消
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onConfirm}
            className={`inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300 ${confirmClassName}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionDialog({
  title,
  description,
  label,
  value,
  placeholder,
  confirmText,
  confirmClassName,
  disabled,
  required,
  onChange,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  label: string;
  value: string;
  placeholder: string;
  confirmText: string;
  confirmClassName: string;
  disabled: boolean;
  required?: boolean;
  onChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isConfirmDisabled = disabled || (required && !value.trim());

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/35 px-4 py-6 sm:items-center">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-2xl">
        <div>
          <h2 className="text-lg font-bold text-slate-950">{title}</h2>
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>
        <label className="mt-5 block">
          <span className="text-sm font-semibold text-slate-700">
            {label}
            {required ? <span className="text-red-500"> *</span> : null}
          </span>
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="form-control mt-2 min-h-28 resize-y"
            placeholder={placeholder}
          />
        </label>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={disabled}
            onClick={onCancel}
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            取消
          </button>
          <button
            type="button"
            disabled={isConfirmDisabled}
            onClick={onConfirm}
            className={`inline-flex min-h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300 ${confirmClassName}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
