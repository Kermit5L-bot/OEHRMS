"use client";

import type { Showroom } from "@prisma/client";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  getShowroomStatusLabel,
  getShowroomTypeLabel,
  normalizeShowroomCoverSrc,
  type ShowroomStatusValue,
} from "@/lib/showrooms";

type AdminShowroomRecord = Omit<Showroom, "status"> & {
  status: ShowroomStatusValue;
};

type AdminShowroomEditFormProps = {
  showroom?: AdminShowroomRecord;
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
  status: ShowroomStatusValue;
  sortOrder: string;
};

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxImageSize = 5 * 1024 * 1024;

function getInitialForm(showroom?: AdminShowroomRecord): FormState {
  return {
    name: showroom?.name || "",
    city: showroom?.city || "",
    type: showroom?.type || "company",
    coverImage: showroom?.coverImage || "",
    summary: showroom?.summary || "",
    description: showroom?.description || "",
    openingHours: showroom?.openingHours || "",
    suggestedDuration: showroom?.suggestedDuration || "",
    address: showroom?.address || "",
    status: showroom?.status || "hidden",
    sortOrder: String(showroom?.sortOrder ?? 0),
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
  const isCreate = !showroom;
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<FormState>(() => getInitialForm(showroom));
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const previewSrc = normalizeShowroomCoverSrc(form.coverImage);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openModal() {
    setForm(getInitialForm(showroom));
    setError("");
    setIsOpen(true);
  }

  function resetAndClose() {
    setForm(getInitialForm(showroom));
    setError("");
    setIsOpen(false);
  }

  async function handleCoverUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    setError("");

    if (!file) return;

    if (!allowedImageTypes.includes(file.type)) {
      setError("仅支持 JPG、PNG、WebP 格式图片");
      return;
    }

    if (file.size > maxImageSize) {
      setError("图片大小不能超过 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setIsUploading(true);

    try {
      const response = await fetch("/api/admin/upload/showroom-cover", {
        method: "POST",
        body: formData,
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setError(result?.error || "图片上传失败，请稍后重试");
        return;
      }

      updateField("coverImage", result.url);
    } catch {
      setError("图片上传失败，请稍后重试");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const response = await fetch(isCreate ? "/api/admin/showrooms" : `/api/admin/showrooms/${showroom.id}`, {
        method: isCreate ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
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
        onClick={openModal}
        className={
          isCreate
            ? "inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            : "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        }
      >
        {isCreate ? <Plus className="h-4 w-4" /> : null}
        {isCreate ? "新增展厅" : "编辑"}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 px-4 py-8">
          <div className="mx-auto max-w-3xl rounded-lg bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-sm font-semibold text-blue-700">{isCreate ? "新增展厅" : "编辑展厅"}</p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">{isCreate ? "创建新的展厅档案" : showroom.name}</h2>
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
                  <input value={form.name} onChange={(event) => updateField("name", event.target.value)} className="form-control" required />
                </Field>
                <Field label="展厅地点" required>
                  <input value={form.city} onChange={(event) => updateField("city", event.target.value)} className="form-control" required />
                </Field>
                <Field label="展厅类型" required>
                  <select value={form.type} onChange={(event) => updateField("type", event.target.value as FormState["type"])} className="form-control">
                    <option value="company">{getShowroomTypeLabel("company")}</option>
                    <option value="training_base">{getShowroomTypeLabel("training_base")}</option>
                  </select>
                </Field>
                <Field label="展厅状态" required>
                  <select value={form.status} onChange={(event) => updateField("status", event.target.value as ShowroomStatusValue)} className="form-control">
                    <option value="open">{getShowroomStatusLabel("open")}</option>
                    <option value="closed">{getShowroomStatusLabel("closed")}</option>
                    <option value="hidden">{getShowroomStatusLabel("hidden")}</option>
                    <option value="deleted">{getShowroomStatusLabel("deleted")}</option>
                  </select>
                </Field>
                <Field label="排序值">
                  <input type="number" value={form.sortOrder} onChange={(event) => updateField("sortOrder", event.target.value)} className="form-control" />
                </Field>
              </div>

              <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                  <div className="aspect-video overflow-hidden rounded-md border border-slate-200 bg-slate-900">
                    {previewSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previewSrc} alt={`${form.name || "展厅"}封面图预览`} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_18%_20%,rgba(34,211,238,0.35),transparent_9rem),linear-gradient(135deg,rgba(14,116,144,0.95),rgba(37,99,235,0.86))] px-4 text-center text-sm font-semibold text-cyan-100">
                        暂无封面图
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">封面图</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      建议上传 16:9 横版图片，推荐尺寸 1600×900px，最低建议 1200×675px，支持 JPG、PNG、WebP，文件大小不超过 5MB。
                    </p>
                    {form.coverImage ? <p className="mt-2 break-all text-xs text-slate-500">当前图片：{form.coverImage}</p> : null}
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <label className="inline-flex cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                        {isUploading ? "上传中..." : form.coverImage ? "重新上传" : "上传图片"}
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCoverUpload} disabled={isUploading} className="sr-only" />
                      </label>
                      {form.coverImage ? (
                        <button type="button" onClick={() => updateField("coverImage", "")} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white">
                          清空封面
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </section>

              <Field label="展厅简介" required>
                <textarea value={form.summary} onChange={(event) => updateField("summary", event.target.value)} rows={3} className="form-control leading-6" required />
              </Field>
              <Field label="展厅详情">
                <textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} rows={4} className="form-control leading-6" />
              </Field>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="开放时间">
                  <input value={form.openingHours} onChange={(event) => updateField("openingHours", event.target.value)} className="form-control" />
                </Field>
                <Field label="建议参观时长">
                  <input value={form.suggestedDuration} onChange={(event) => updateField("suggestedDuration", event.target.value)} className="form-control" />
                </Field>
                <Field label="地址说明">
                  <input value={form.address} onChange={(event) => updateField("address", event.target.value)} className="form-control" />
                </Field>
              </div>

              {error ? <div className="rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div> : null}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button type="button" onClick={resetAndClose} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploading}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {isSaving ? "保存中..." : isCreate ? "创建展厅" : "保存"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
