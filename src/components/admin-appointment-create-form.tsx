"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
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
};

type AdminAppointmentCreateFormProps = {
  showrooms: ShowroomOption[];
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
  internalContactInfo: string;
  customerLevel: string;
  mainVisitorInfo: string;
  industry: string;
  customerType: string;
  interestAreas: string[];
  needSolutionConsulting: string;
  needVehicle: string;
  vehicleRequirement: string;
  needAccommodation: string;
  accommodationRequirement: string;
  needDining: string;
  diningRequirement: string;
  giftPreparation: string;
  giftRequirement: string;
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
  internalContactInfo: "",
  customerLevel: "",
  mainVisitorInfo: "",
  industry: "",
  customerType: "",
  interestAreas: [],
  needSolutionConsulting: "",
  needVehicle: "",
  vehicleRequirement: "",
  needAccommodation: "",
  accommodationRequirement: "",
  needDining: "",
  diningRequirement: "",
  giftPreparation: "",
  giftRequirement: "",
  visitPurpose: "",
  needGuide: true,
  customerRemark: "",
};

const requestOptions = [
  { value: "", label: "待确认" },
  { value: "no", label: "不需要" },
  { value: "yes", label: "需要" },
];

export function AdminAppointmentCreateForm({ showrooms }: AdminAppointmentCreateFormProps) {
  const router = useRouter();
  const today = useMemo(() => getTodayDateString(), []);
  const [form, setForm] = useState<FormState>(initialState);
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
  }

  function validate() {
    const nextErrors: FormErrors = {};
    const visitorCount = Number(form.visitorCount);

    if (!form.showroomId) nextErrors.showroomId = "请选择预约展厅";
    if (!form.visitDate) nextErrors.visitDate = "请选择参观日期";
    if (form.visitDate && form.visitDate < today) nextErrors.visitDate = "参观日期不能早于今天";
    if (!form.visitTimeSlot) nextErrors.visitTimeSlot = "请选择参观时间段";
    if (!Number.isInteger(visitorCount) || visitorCount < 1) nextErrors.visitorCount = "参观人数至少为 1 人";
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
      const response = await fetch("/api/admin/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          showroomId: Number(form.showroomId),
          visitorCount: Number(form.visitorCount),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setErrors({ submit: result.error || "预约创建失败，请稍后重试" });
        return;
      }

      router.push(`/admin/appointments/${result.appointment.id}`);
      router.refresh();
    } catch {
      setErrors({ submit: "网络异常，请稍后重试" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="admin-panel rounded-lg p-6">
      <FormGroup title="参观信息">
        <Field label="预约展厅" error={errors.showroomId} required>
          <select value={form.showroomId} onChange={(event) => updateField("showroomId", event.target.value)} className="form-control">
            <option value="">请选择展厅</option>
            {showrooms.map((showroom) => (
              <option key={showroom.id} value={showroom.id}>
                {showroom.name}
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

      <FormGroup title="客户与申请信息">
        <Field label="客户姓名" error={errors.contactName} required>
          <input value={form.contactName} onChange={(event) => updateField("contactName", event.target.value)} className="form-control" placeholder="请输入客户联系人姓名" />
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
        <Field label="内部对接人">
          <input value={form.internalContactInfo} onChange={(event) => updateField("internalContactInfo", event.target.value)} className="form-control" placeholder="请输入内部销售或客户经理姓名" />
        </Field>
        <Field label="来访客户级别">
          <input value={form.customerLevel} onChange={(event) => updateField("customerLevel", event.target.value)} className="form-control" placeholder="选填，例如：重点客户、普通客户" />
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
        <Field label="主要来访人员信息" className="md:col-span-2">
          <textarea value={form.mainVisitorInfo} onChange={(event) => updateField("mainVisitorInfo", event.target.value)} className="form-control min-h-24" placeholder="选填，可填写来访人员姓名、职务、人数补充等" />
        </Field>
      </FormGroup>

      <FormGroup title="接待需求">
        <Field label="车辆接送安排">
          <select value={form.needVehicle} onChange={(event) => updateField("needVehicle", event.target.value)} className="form-control">
            {requestOptions.map((option) => (
              <option key={option.value || "pending"} value={option.value}>{option.label}</option>
            ))}
          </select>
        </Field>
        <Field label="住宿安排">
          <select value={form.needAccommodation} onChange={(event) => updateField("needAccommodation", event.target.value)} className="form-control">
            {requestOptions.map((option) => (
              <option key={option.value || "pending"} value={option.value}>{option.label}</option>
            ))}
          </select>
        </Field>
        <Field label="宴请安排">
          <select value={form.needDining} onChange={(event) => updateField("needDining", event.target.value)} className="form-control">
            {requestOptions.map((option) => (
              <option key={option.value || "pending"} value={option.value}>{option.label}</option>
            ))}
          </select>
        </Field>
        <Field label="礼品准备">
          <input value={form.giftPreparation} onChange={(event) => updateField("giftPreparation", event.target.value)} className="form-control" placeholder="选填，例如：需要、无需、待确认" />
        </Field>
        <Field label="车辆接送具体要求" className="md:col-span-2">
          <textarea value={form.vehicleRequirement} onChange={(event) => updateField("vehicleRequirement", event.target.value)} className="form-control min-h-24" placeholder="选填，例如：到站时间、接送地点、车辆数量等" />
        </Field>
        <Field label="住宿具体要求" className="md:col-span-2">
          <textarea value={form.accommodationRequirement} onChange={(event) => updateField("accommodationRequirement", event.target.value)} className="form-control min-h-24" placeholder="选填，例如：入住时间、房间数量、特殊要求等" />
        </Field>
        <Field label="宴请具体要求" className="md:col-span-2">
          <textarea value={form.diningRequirement} onChange={(event) => updateField("diningRequirement", event.target.value)} className="form-control min-h-24" placeholder="选填，例如：人数、餐标、忌口、地点建议等" />
        </Field>
        <Field label="指定伴手礼说明" className="md:col-span-2">
          <textarea value={form.giftRequirement} onChange={(event) => updateField("giftRequirement", event.target.value)} className="form-control min-h-24" placeholder="选填，如需指定伴手礼可填写说明" />
        </Field>
      </FormGroup>

      <FormGroup title="需求备注">
        <Field label="关注方向" className="md:col-span-2">
          <div className="grid gap-2 sm:grid-cols-2">
            {interestAreaOptions.map((option) => (
              <label key={option.value} className="flex min-h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700">
                <input type="checkbox" checked={form.interestAreas.includes(option.value)} onChange={() => toggleInterestArea(option.value)} className="h-4 w-4 rounded border-slate-300" />
                {option.label}
              </label>
            ))}
          </div>
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
          <label className="flex min-h-11 items-center gap-3 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700">
            <input type="checkbox" checked={form.needGuide} onChange={(event) => updateField("needGuide", event.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            需要安排接待讲解
          </label>
        </Field>
        <Field label="参观目的" className="md:col-span-2">
          <textarea value={form.visitPurpose} onChange={(event) => updateField("visitPurpose", event.target.value)} className="form-control min-h-24" placeholder="选填，可填写关注方向或参观需求" />
        </Field>
        <Field label="客户备注" className="md:col-span-2">
          <textarea value={form.customerRemark} onChange={(event) => updateField("customerRemark", event.target.value)} className="form-control min-h-24" placeholder="选填，可填写其他补充说明" />
        </Field>
      </FormGroup>

      {errors.submit ? <p className="mt-5 rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{errors.submit}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        <Save className="h-4 w-4" />
        {isSubmitting ? "保存中..." : "保存预约"}
      </button>
    </form>
  );
}

function FormGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-slate-100 py-5 first:pt-0 last:border-b-0">
      <h2 className="text-base font-bold text-slate-950">{title}</h2>
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
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </span>
      <div className="mt-2">{children}</div>
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
