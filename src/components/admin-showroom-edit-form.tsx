"use client";

import type { Showroom } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getShowroomStatusLabel, getShowroomTypeLabel } from "@/lib/showrooms";

type AdminShowroomEditFormProps = {
  showroom: Showroom;
};

type FormState = {
  name: string;
  city: string;
  type: "company" | "training_base";
  coverImage: string;
  summary: string;
  description: string;
  openingHours: string;
  suggestedDuration: string;
  address: string;
  status: "open" | "closed";
  sortOrder: string;
};

function getInitialForm(showroom: Showroom): FormState {
  return {
    name: showroom.name,
    city: showroom.city,
    type: showroom.type,
    coverImage: showroom.coverImage || "",
    summary: showroom.summary,
    description: showroom.description || "",
    openingHours: showroom.openingHours || "",
    suggestedDuration: showroom.suggestedDuration || "",
    address: showroom.address || "",
    status: showroom.status,
    sortOrder: String(showroom.sortOrder),
  };
}

function Field({
  label,
  children,
  required,
}: Readonly<{
  label: string;
  children: React.ReactNode;
  required?: boolean;
}>) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function AdminShowroomEditForm({ showroom }: AdminShowroomEditFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<FormState>(() => getInitialForm(showroom));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetAndClose() {
    setForm(getInitialForm(showroom));
    setError("");
    setIsOpen(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/showrooms/${showroom.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          sortOrder: form.sortOrder === "" ? null : Number(form.sortOrder),
        }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setError(result?.error || "保存失败，请稍后重试");
        return;
      }

      setIsOpen(false);
      router.refresh();
    } catch {
      setError("保存失败，请稍后重试");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        编辑
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 px-4 py-8">
          <div className="mx-auto max-w-3xl rounded-lg bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-sm font-medium text-blue-700">编辑展厅</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">{showroom.name}</h2>
              </div>
              <button
                type="button"
                onClick={resetAndClose}
                className="rounded-md px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100"
              >
                关闭
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="展厅名称" required>
                  <input
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    required
                  />
                </Field>
                <Field label="展厅地点" required>
                  <input
                    value={form.city}
                    onChange={(event) => updateField("city", event.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    required
                  />
                </Field>
                <Field label="展厅类型" required>
                  <select
                    value={form.type}
                    onChange={(event) => updateField("type", event.target.value as FormState["type"])}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="company">{getShowroomTypeLabel("company")}</option>
                    <option value="training_base">{getShowroomTypeLabel("training_base")}</option>
                  </select>
                </Field>
                <Field label="开放状态" required>
                  <select
                    value={form.status}
                    onChange={(event) => updateField("status", event.target.value as FormState["status"])}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="open">{getShowroomStatusLabel("open")}</option>
                    <option value="closed">{getShowroomStatusLabel("closed")}</option>
                  </select>
                </Field>
                <Field label="封面图 URL">
                  <input
                    value={form.coverImage}
                    onChange={(event) => updateField("coverImage", event.target.value)}
                    placeholder="https://example.com/showroom.jpg"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </Field>
                <Field label="排序值">
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(event) => updateField("sortOrder", event.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </Field>
              </div>

              <Field label="展厅简介" required>
                <textarea
                  value={form.summary}
                  onChange={(event) => updateField("summary", event.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm leading-6 focus:border-blue-500 focus:outline-none"
                  required
                />
              </Field>

              <Field label="展厅详情">
                <textarea
                  value={form.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm leading-6 focus:border-blue-500 focus:outline-none"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="开放时间">
                  <input
                    value={form.openingHours}
                    onChange={(event) => updateField("openingHours", event.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </Field>
                <Field label="建议参观时长">
                  <input
                    value={form.suggestedDuration}
                    onChange={(event) => updateField("suggestedDuration", event.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </Field>
                <Field label="地址说明">
                  <input
                    value={form.address}
                    onChange={(event) => updateField("address", event.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </Field>
              </div>

              {error ? (
                <div className="rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {isSaving ? "保存中..." : "保存"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
