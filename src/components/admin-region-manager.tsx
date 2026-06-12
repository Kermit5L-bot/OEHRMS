"use client";

import { useState } from "react";
import { MapPinned, Plus, Save, Trash2 } from "lucide-react";
import type { RegionRecord } from "@/lib/regions";

type RegionData = {
  regions: RegionRecord[];
  provinces: string[];
  unassignedProvinces: string[];
};

type RegionFormState = {
  name: string;
  color: string;
  sortOrder: string;
  provinces: string[];
};

type AdminRegionManagerProps = {
  initialData: RegionData;
};

function toFormState(region: RegionRecord): RegionFormState {
  return {
    name: region.name,
    color: region.color,
    sortOrder: String(region.sortOrder),
    provinces: region.provinces,
  };
}

const emptyForm: RegionFormState = {
  name: "",
  color: "#2563eb",
  sortOrder: "0",
  provinces: [],
};

export function AdminRegionManager({ initialData }: AdminRegionManagerProps) {
  const [data, setData] = useState(initialData);
  const [createForm, setCreateForm] = useState<RegionFormState>(emptyForm);
  const [editForms, setEditForms] = useState<Record<number, RegionFormState>>(
    Object.fromEntries(initialData.regions.map((region) => [region.id, toFormState(region)])),
  );
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function syncData(nextData: RegionData) {
    setData(nextData);
    setEditForms(Object.fromEntries(nextData.regions.map((region) => [region.id, toFormState(region)])));
  }

  function updateCreateField<K extends keyof RegionFormState>(field: K, value: RegionFormState[K]) {
    setCreateForm((current) => ({ ...current, [field]: value }));
    setMessage(null);
  }

  function updateEditField<K extends keyof RegionFormState>(regionId: number, field: K, value: RegionFormState[K]) {
    setEditForms((current) => ({
      ...current,
      [regionId]: {
        ...current[regionId],
        [field]: value,
      },
    }));
    setMessage(null);
  }

  function toggleCreateProvince(province: string) {
    setCreateForm((current) => toggleProvinceInForm(current, province));
    setMessage(null);
  }

  function toggleEditProvince(regionId: number, province: string) {
    setEditForms((current) => ({
      ...current,
      [regionId]: toggleProvinceInForm(current[regionId], province),
    }));
    setMessage(null);
  }

  async function submitCreate() {
    if (!createForm.name.trim()) {
      setMessage({ type: "error", text: "请填写区域名称" });
      return;
    }

    setIsSubmitting("create");
    setMessage(null);
    try {
      const response = await fetch("/api/admin/regions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createForm,
          sortOrder: Number(createForm.sortOrder),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage({ type: "error", text: result.error || "区域创建失败" });
        return;
      }
      syncData(result);
      setCreateForm(emptyForm);
      setMessage({ type: "success", text: "区域创建成功" });
    } catch {
      setMessage({ type: "error", text: "网络异常，请稍后重试" });
    } finally {
      setIsSubmitting(null);
    }
  }

  async function submitUpdate(regionId: number) {
    const form = editForms[regionId];
    if (!form?.name.trim()) {
      setMessage({ type: "error", text: "请填写区域名称" });
      return;
    }

    setIsSubmitting(`update-${regionId}`);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/regions/${regionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          sortOrder: Number(form.sortOrder),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage({ type: "error", text: result.error || "区域保存失败" });
        return;
      }
      syncData(result);
      setMessage({ type: "success", text: "区域保存成功" });
    } catch {
      setMessage({ type: "error", text: "网络异常，请稍后重试" });
    } finally {
      setIsSubmitting(null);
    }
  }

  async function submitDelete(region: RegionRecord) {
    const confirmed = window.confirm(`确认删除“${region.name}”？删除后该区域下省份会解除绑定并归为未分区。`);
    if (!confirmed) return;

    setIsSubmitting(`delete-${region.id}`);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/regions/${region.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) {
        setMessage({ type: "error", text: result.error || "区域删除失败" });
        return;
      }
      syncData(result);
      setMessage({ type: "success", text: "区域已删除，省份绑定已解除" });
    } catch {
      setMessage({ type: "error", text: "网络异常，请稍后重试" });
    } finally {
      setIsSubmitting(null);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      {message ? (
        <div className={`rounded-md px-4 py-3 text-sm font-medium ${message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      ) : null}

      <section className="admin-panel rounded-lg p-6">
        <h2 className="inline-flex items-center gap-2 text-lg font-bold text-slate-950">
          <Plus className="h-5 w-5 text-blue-600" />
          新增区域
        </h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_12rem_8rem_auto] lg:items-end">
          <Field label="区域名称">
            <input value={createForm.name} onChange={(event) => updateCreateField("name", event.target.value)} className="form-control" placeholder="例如：华南大区" />
          </Field>
          <Field label="区域颜色">
            <input type="color" value={createForm.color} onChange={(event) => updateCreateField("color", event.target.value)} className="h-11 w-full rounded-md border border-slate-200 bg-white p-1" />
          </Field>
          <Field label="排序">
            <input type="number" value={createForm.sortOrder} onChange={(event) => updateCreateField("sortOrder", event.target.value)} className="form-control" />
          </Field>
          <button
            type="button"
            disabled={isSubmitting !== null}
            onClick={submitCreate}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Plus className="h-4 w-4" />
            新增区域
          </button>
        </div>
        <ProvincePicker
          title="新增区域省份配置"
          provinces={data.provinces}
          selected={createForm.provinces}
          onToggle={toggleCreateProvince}
        />
      </section>

      <section className="admin-panel rounded-lg p-6">
        <div className="flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="inline-flex items-center gap-2 text-lg font-bold text-slate-950">
            <MapPinned className="h-5 w-5 text-blue-600" />
            区域列表
          </h2>
          <p className="text-sm text-slate-500">一个省份只能归属一个区域，保存时会自动移动绑定关系。</p>
        </div>

        <div className="mt-5 space-y-4">
          {data.regions.map((region) => {
            const form = editForms[region.id] || toFormState(region);
            return (
              <article key={region.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="grid gap-4 lg:grid-cols-[1fr_12rem_8rem_auto_auto] lg:items-end">
                  <Field label="区域名称">
                    <input value={form.name} onChange={(event) => updateEditField(region.id, "name", event.target.value)} className="form-control" />
                  </Field>
                  <Field label="区域颜色">
                    <div className="flex items-center gap-2">
                      <input type="color" value={form.color} onChange={(event) => updateEditField(region.id, "color", event.target.value)} className="h-11 w-16 rounded-md border border-slate-200 bg-white p-1" />
                      <span className="text-sm font-semibold text-slate-600">{form.color}</span>
                    </div>
                  </Field>
                  <Field label="排序">
                    <input type="number" value={form.sortOrder} onChange={(event) => updateEditField(region.id, "sortOrder", event.target.value)} className="form-control" />
                  </Field>
                  <button
                    type="button"
                    disabled={isSubmitting !== null}
                    onClick={() => submitUpdate(region.id)}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <Save className="h-4 w-4" />
                    {isSubmitting === `update-${region.id}` ? "保存中..." : "保存"}
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting !== null}
                    onClick={() => submitDelete(region)}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" />
                    删除
                  </button>
                </div>
                <ProvincePicker
                  title={`${region.name} 省份配置`}
                  provinces={data.provinces}
                  selected={form.provinces}
                  onToggle={(province) => toggleEditProvince(region.id, province)}
                />
              </article>
            );
          })}

          {data.regions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <h3 className="text-base font-semibold text-slate-950">暂无区域数据</h3>
              <p className="mt-2 text-sm text-slate-600">可先新增区域，再绑定省份。</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="admin-panel rounded-lg p-6">
        <h2 className="text-lg font-bold text-slate-950">未分区省份</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {data.unassignedProvinces.map((province) => (
            <span key={province} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600">
              {province}
            </span>
          ))}
          {data.unassignedProvinces.length === 0 ? (
            <span className="text-sm text-slate-500">当前没有未分区省份。</span>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function toggleProvinceInForm(form: RegionFormState, province: string): RegionFormState {
  const exists = form.provinces.includes(province);
  return {
    ...form,
    provinces: exists
      ? form.provinces.filter((item) => item !== province)
      : [...form.provinces, province],
  };
}

function ProvincePicker({
  title,
  provinces,
  selected,
  onToggle,
}: {
  title: string;
  provinces: string[];
  selected: string[];
  onToggle: (province: string) => void;
}) {
  return (
    <div className="mt-5">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {provinces.map((province) => {
          const checked = selected.includes(province);
          return (
            <label
              key={province}
              className={`flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition ${
                checked
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <input type="checkbox" checked={checked} onChange={() => onToggle(province)} className="h-4 w-4 rounded border-slate-300" />
              {province}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
