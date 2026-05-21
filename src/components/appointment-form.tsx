"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, MessageSquareText, Send, UserRound } from "lucide-react";
import {
  customerTypeOptions,
  getTodayDateString,
  interestAreaOptions,
  phonePattern,
  solutionConsultingOptions,
} from "@/lib/appointments";

type ShowroomOption = {
  id: number;
  name: string;
  status: "open" | "closed";
};

type AppointmentFormProps = {
  showrooms: ShowroomOption[];
  initialShowroomId?: number;
};

type FormState = {
  showroomId: string;
  visitDate: string;
  visitTimeSlot: string;
  visitorCount: string;
  contactName: string;
  contactPhone: string;
  companyName: string;
  position: string;
  industry: string;
  customerType: string;
  interestAreas: string[];
  needSolutionConsulting: string;
  visitPurpose: string;
  needGuide: boolean;
  customerRemark: string;
};

type FormErrors = Partial<Record<keyof FormState | "submit", string>>;

const initialState: FormState = {
  showroomId: "",
  visitDate: "",
  visitTimeSlot: "morning",
  visitorCount: "1",
  contactName: "",
  contactPhone: "",
  companyName: "",
  position: "",
  industry: "",
  customerType: "",
  interestAreas: [],
  needSolutionConsulting: "",
  visitPurpose: "",
  needGuide: true,
  customerRemark: "",
};

export function AppointmentForm({ showrooms, initialShowroomId }: AppointmentFormProps) {
  const router = useRouter();
  const today = useMemo(() => getTodayDateString(), []);
  const [form, setForm] = useState<FormState>({
    ...initialState,
    showroomId: initialShowroomId ? String(initialShowroomId) : "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, submit: undefined }));
  }

  function toggleInterestArea(value: string) {
    setForm((current) => {
      const exists = current.interestAreas.includes(value);
      return {
        ...current,
        interestAreas: exists
          ? current.interestAreas.filter((item) => item !== value)
          : [...current.interestAreas, value],
      };
    });
    setErrors((current) => ({ ...current, submit: undefined }));
  }

  function validate() {
    const nextErrors: FormErrors = {};
    const visitorCount = Number(form.visitorCount);

    if (!form.showroomId) nextErrors.showroomId = "请选择预约展厅";
    if (!form.visitDate) nextErrors.visitDate = "请选择参观日期";
    if (form.visitDate && form.visitDate < today) nextErrors.visitDate = "参观日期不能早于今天";
    if (!form.visitTimeSlot) nextErrors.visitTimeSlot = "请选择参观时间段";
    if (!Number.isInteger(visitorCount) || visitorCount < 1) nextErrors.visitorCount = "参观人数至少 1 人";
    if (!form.contactName.trim()) nextErrors.contactName = "请填写客户姓名";
    if (!form.contactPhone.trim()) nextErrors.contactPhone = "请填写手机号码";
    if (form.contactPhone.trim() && !phonePattern.test(form.contactPhone.trim())) {
      nextErrors.contactPhone = "请输入正确的手机号码";
    }
    if (!form.companyName.trim()) nextErrors.companyName = "请填写公司名称";

    return nextErrors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          showroomId: Number(form.showroomId),
          visitDate: form.visitDate,
          visitTimeSlot: form.visitTimeSlot,
          visitorCount: Number(form.visitorCount),
          contactName: form.contactName,
          contactPhone: form.contactPhone,
          companyName: form.companyName,
          position: form.position,
          industry: form.industry,
          customerType: form.customerType,
          interestAreas: form.interestAreas,
          needSolutionConsulting: form.needSolutionConsulting,
          visitPurpose: form.visitPurpose,
          needGuide: form.needGuide,
          customerRemark: form.customerRemark,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        setErrors({ submit: result.error || "预约提交失败，请稍后重试" });
        return;
      }

      const params = new URLSearchParams({
        appointmentNo: result.appointmentNo,
        showroomName: result.showroomName,
        visitDate: result.visitDate,
        visitTimeSlot: result.visitTimeSlot,
        contactName: result.contactName,
        contactPhone: result.maskedPhone,
      });
      router.push(`/appointment/success?${params.toString()}`);
    } catch {
      setErrors({ submit: "网络异常，请稍后重试" });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (showrooms.length === 0) {
    return (
      <div className="glass-panel rounded-lg p-8 text-center">
        <h2 className="text-lg font-semibold text-white">暂无可预约展厅</h2>
        <p className="mt-2 text-sm text-slate-300">请先初始化展厅数据，再提交预约。</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel rounded-lg p-5 sm:p-6">
      <FormGroup title="参观信息" icon={CalendarDays}>
        <Field label="预约展厅" error={errors.showroomId} required>
          <select value={form.showroomId} onChange={(event) => updateField("showroomId", event.target.value)} className="form-control">
            <option value="">请选择展厅</option>
            {showrooms.map((showroom) => (
              <option key={showroom.id} value={showroom.id} disabled={showroom.status === "closed"}>
                {showroom.name}
                {showroom.status === "closed" ? "（暂停预约）" : ""}
              </option>
            ))}
          </select>
        </Field>

        <Field label="参观日期" error={errors.visitDate} required>
          <input type="date" min={today} value={form.visitDate} onChange={(event) => updateField("visitDate", event.target.value)} className="form-control" />
        </Field>

        <Field label="参观时间段" error={errors.visitTimeSlot} required>
          <select value={form.visitTimeSlot} onChange={(event) => updateField("visitTimeSlot", event.target.value)} className="form-control">
            <option value="morning">上午</option>
            <option value="afternoon">下午</option>
          </select>
        </Field>

        <Field label="参观人数" error={errors.visitorCount} required>
          <input type="number" min={1} value={form.visitorCount} onChange={(event) => updateField("visitorCount", event.target.value)} className="form-control" />
        </Field>
      </FormGroup>

      <FormGroup title="联系人信息" icon={UserRound}>
        <Field label="客户姓名" error={errors.contactName} required>
          <input value={form.contactName} onChange={(event) => updateField("contactName", event.target.value)} className="form-control" placeholder="请输入联系人姓名" />
        </Field>
        <Field label="手机号码" error={errors.contactPhone} required>
          <input value={form.contactPhone} onChange={(event) => updateField("contactPhone", event.target.value)} className="form-control" placeholder="例如：13800000000" inputMode="tel" />
        </Field>
        <Field label="公司名称" error={errors.companyName} required>
          <input value={form.companyName} onChange={(event) => updateField("companyName", event.target.value)} className="form-control" placeholder="请输入公司名称" />
        </Field>
        <Field label="职务">
          <input value={form.position} onChange={(event) => updateField("position", event.target.value)} className="form-control" placeholder="选填" />
        </Field>
        <Field label="所属行业">
          <input value={form.industry} onChange={(event) => updateField("industry", event.target.value)} className="form-control" placeholder="选填" />
        </Field>
        <Field label="客户类型">
          <select value={form.customerType} onChange={(event) => updateField("customerType", event.target.value)} className="form-control">
            <option value="">选填</option>
            {customerTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="是否需要方案交流">
          <select value={form.needSolutionConsulting} onChange={(event) => updateField("needSolutionConsulting", event.target.value)} className="form-control">
            <option value="">选填</option>
            {solutionConsultingOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="是否需要接待讲解">
          <label className="flex min-h-12 items-center gap-3 rounded-md border border-cyan-300/20 bg-slate-950/35 px-3 text-sm text-slate-100">
            <input type="checkbox" checked={form.needGuide} onChange={(event) => updateField("needGuide", event.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            需要安排接待讲解
          </label>
        </Field>
      </FormGroup>

      <FormGroup title="需求备注" icon={MessageSquareText}>
        <Field label="关注方向" className="md:col-span-2">
          <div className="grid gap-2 sm:grid-cols-2">
            {interestAreaOptions.map((option) => (
              <label key={option.value} className="flex min-h-11 items-center gap-2 rounded-md border border-cyan-300/20 bg-slate-950/30 px-3 text-sm text-slate-100">
                <input
                  type="checkbox"
                  checked={form.interestAreas.includes(option.value)}
                  onChange={() => toggleInterestArea(option.value)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                {option.label}
              </label>
            ))}
          </div>
        </Field>
        <Field label="参观目的" className="md:col-span-2">
          <textarea value={form.visitPurpose} onChange={(event) => updateField("visitPurpose", event.target.value)} className="form-control min-h-28" placeholder="选填，可填写关注方向或参观需求" />
        </Field>
        <Field label="客户备注" className="md:col-span-2">
          <textarea value={form.customerRemark} onChange={(event) => updateField("customerRemark", event.target.value)} className="form-control min-h-28" placeholder="选填，可填写其他补充说明" />
        </Field>
      </FormGroup>

      {errors.submit ? <p className="mt-5 rounded-md bg-red-500/12 px-4 py-3 text-sm font-medium text-red-100">{errors.submit}</p> : null}

      <div className="mt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-12 w-full rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-600 sm:w-auto"
        >
          <Send className="mr-2 inline h-4 w-4 align-[-2px]" />
          {isSubmitting ? "提交中..." : "提交预约"}
        </button>
      </div>
    </form>
  );
}

function FormGroup({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-cyan-300/15 py-5 first:pt-0 last:border-b-0">
      <h2 className="inline-flex items-center gap-2 text-base font-bold text-white">
        <Icon className="h-5 w-5 text-cyan-200" />
        {title}
      </h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  error,
  required,
  className = "",
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-semibold text-slate-200">
        {label}
        {required ? <span className="text-cyan-200"> *</span> : null}
      </span>
      <div className="mt-2">{children}</div>
      {error ? <span className="mt-1 block text-xs text-red-200">{error}</span> : null}
    </label>
  );
}
