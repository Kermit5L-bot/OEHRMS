"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AppointmentStatus } from "@prisma/client";

type AdminAppointmentActionsProps = {
  appointmentId: number;
  status: AppointmentStatus;
  initialReceptionist?: string | null;
  initialReceptionNote?: string | null;
  initialFollowUpNote?: string | null;
};

type ActionMessage = {
  type: "success" | "error";
  text: string;
};

export function AdminAppointmentActions({
  appointmentId,
  status,
  initialReceptionist,
  initialReceptionNote,
  initialFollowUpNote,
}: AdminAppointmentActionsProps) {
  const router = useRouter();
  const [approvalOpinion, setApprovalOpinion] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [receptionist, setReceptionist] = useState(initialReceptionist || "");
  const [receptionNote, setReceptionNote] = useState(initialReceptionNote || "");
  const [followUpNote, setFollowUpNote] = useState(initialFollowUpNote || "");
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
  const canEditNote = status !== "cancelled";

  return (
    <div className="space-y-6">
      {message ? (
        <div
          className={`rounded-md px-4 py-3 text-sm font-medium ${
            message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">审批操作</h2>
        <div className="mt-4 grid gap-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">审批意见</span>
            <textarea
              value={approvalOpinion}
              onChange={(event) => setApprovalOpinion(event.target.value)}
              disabled={!canApprove}
              className="mt-2 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
              placeholder="通过时可填写审批意见"
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!canApprove || isSubmitting !== null}
              onClick={() =>
                postAction(`/api/admin/appointments/${appointmentId}/approve`, {
                  approvalOpinion,
                  receptionist,
                  receptionNote,
                })
              }
              className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting?.includes("approve") ? "提交中..." : "通过预约"}
            </button>
            <button
              type="button"
              disabled={!canComplete || isSubmitting !== null}
              onClick={() => postAction(`/api/admin/appointments/${appointmentId}/complete`)}
              className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting?.includes("complete") ? "提交中..." : "标记已完成"}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">拒绝预约</h2>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-slate-700">拒绝原因</span>
          <textarea
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            disabled={!canReject}
            className="mt-2 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
            placeholder="拒绝预约时必须填写原因"
          />
        </label>
        <button
          type="button"
          disabled={!canReject || isSubmitting !== null}
          onClick={() => postAction(`/api/admin/appointments/${appointmentId}/reject`, { rejectReason })}
          className="mt-4 rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting?.includes("reject") ? "提交中..." : "拒绝预约"}
        </button>
      </section>

      <section className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">接待备注</h2>
        <div className="mt-4 grid gap-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">接待负责人</span>
            <input
              value={receptionist}
              onChange={(event) => setReceptionist(event.target.value)}
              disabled={!canEditNote}
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">接待备注</span>
            <textarea
              value={receptionNote}
              onChange={(event) => setReceptionNote(event.target.value)}
              disabled={!canEditNote}
              className="mt-2 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">跟进记录</span>
            <textarea
              value={followUpNote}
              onChange={(event) => setFollowUpNote(event.target.value)}
              disabled={!canEditNote}
              className="mt-2 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
            />
          </label>
          <button
            type="button"
            disabled={!canEditNote || isSubmitting !== null}
            onClick={() =>
              postAction(`/api/admin/appointments/${appointmentId}/reception-note`, {
                receptionist,
                receptionNote,
                followUpNote,
              })
            }
            className="w-fit rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting?.includes("reception-note") ? "保存中..." : "保存接待备注"}
          </button>
        </div>
      </section>
    </div>
  );
}
