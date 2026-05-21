"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AdminLeadNoteFormProps = {
  leadId: number;
  initialFollowUpNote?: string | null;
};

export function AdminLeadNoteForm({ leadId, initialFollowUpNote }: AdminLeadNoteFormProps) {
  const router = useRouter();
  const [followUpNote, setFollowUpNote] = useState(initialFollowUpNote || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    if (isSaving) return;
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/leads/${leadId}/follow-up-note`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ followUpNote }),
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "保存失败");
        return;
      }

      setIsEditing(false);
      setMessage("保存成功");
      router.refresh();
    } catch {
      setMessage("网络异常，请稍后重试");
    } finally {
      setIsSaving(false);
    }
  }

  if (!isEditing) {
    return (
      <div className="space-y-2">
        <p className="max-w-xs whitespace-pre-wrap text-sm text-slate-600">{followUpNote || "暂无跟进备注"}</p>
        {message ? <p className="text-xs text-emerald-700">{message}</p> : null}
        <button type="button" onClick={() => setIsEditing(true)} className="text-sm font-semibold text-blue-700 hover:text-blue-900">
          编辑备注
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <textarea value={followUpNote} onChange={(event) => setFollowUpNote(event.target.value)} className="form-control min-h-24 w-72" placeholder="填写跟进备注" />
      {message ? <p className="text-xs text-red-600">{message}</p> : null}
      <div className="flex gap-2">
        <button type="button" onClick={handleSave} disabled={isSaving} className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">
          {isSaving ? "保存中..." : "保存"}
        </button>
        <button
          type="button"
          onClick={() => {
            setFollowUpNote(initialFollowUpNote || "");
            setIsEditing(false);
            setMessage(null);
          }}
          className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          取消
        </button>
      </div>
    </div>
  );
}
