"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AppointmentStatus } from "@prisma/client";
import { CheckCircle2, Edit3, Save, X } from "lucide-react";
import { AppointmentStatusBadge } from "@/components/appointment-status-badge";
import { FormSelect } from "@/components/form-select";
import { ProvinceSelect } from "@/components/province-select";
import {
  customerTypeOptions,
  getCustomerTypeLabel,
  getInterestAreaLabels,
  getProvinceLabel,
  getSolutionConsultingLabel,
  getVisitTimeSlotLabel,
  interestAreaOptions,
  isValidProvince,
  phonePattern,
  solutionConsultingOptions,
} from "@/lib/appointments";

type FormState = {
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
  province: string;
  customerType: string;
  interestAreas: string[];
  needSolutionConsulting: string;
  needGuide: string;
  visitPurpose: string;
  customerRemark: string;
  receptionist: string;
  receptionNote: string;
  followUpNote: string;
  actualReceptionLocation: string;
  visitStartTime: string;
  visitEndTime: string;
  receptionScheduleNote: string;
  receptionPreparationNote: string;
  needVehicle: string;
  vehicleRequirement: string;
  needAccommodation: string;
  accommodationRequirement: string;
  needDining: string;
  diningRequirement: string;
  giftPreparation: string;
  giftRequirement: string;
};

type DisplayInfo = {
  appointmentNo: string;
  showroomName: string;
  approvedByName: string;
  approvedAt: string;
  approvalOpinion: string;
  rejectReason: string;
};

type FormErrors = Partial<Record<keyof FormState | "submit", string>>;

type AdminAppointmentEditFormProps = {
  appointmentId: number;
  status: AppointmentStatus;
  initialValues: FormState;
  displayInfo: DisplayInfo;
};

const requestOptions = [
  { value: "pending", label: "待确认" },
  { value: "no", label: "不需要" },
  { value: "yes", label: "需要" },
];

const visitTimeSlotOptions = [
  { value: "morning", label: "上午" },
  { value: "afternoon", label: "下午" },
];

const editableStatuses = new Set<AppointmentStatus>(["pending", "approved"]);

export function AdminAppointmentEditForm({
  appointmentId,
  status,
  initialValues,
  displayInfo,
}: AdminAppointmentEditFormProps) {
  const router = useRouter();
  const isEditable = editableStatuses.has(status);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<FormState>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, submit: undefined }));
    setMessage(null);
  }

  function updateRequestField(
    field: "needVehicle" | "needAccommodation" | "needDining" | "giftPreparation",
    detailField: "vehicleRequirement" | "accommodationRequirement" | "diningRequirement" | "giftRequirement",
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
      [detailField]: value === "yes" ? current[detailField] : "",
    }));
    setErrors((current) => ({ ...current, [field]: undefined, [detailField]: undefined, submit: undefined }));
    setMessage(null);
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
    setMessage(null);
  }

  function validate() {
    const nextErrors: FormErrors = {};
    const visitorCount = Number(form.visitorCount);

    if (!form.visitDate) nextErrors.visitDate = "请选择参观日期";
    if (!form.visitTimeSlot) nextErrors.visitTimeSlot = "请选择参观时间段";
    if (!Number.isInteger(visitorCount) || visitorCount < 1) nextErrors.visitorCount = "参观人数至少为 1 人";
    if (!form.contactName.trim()) nextErrors.contactName = "请填写联系人姓名";
    if (!form.contactPhone.trim()) nextErrors.contactPhone = "请填写联系电话";
    if (form.contactPhone.trim() && !phonePattern.test(form.contactPhone.trim())) {
      nextErrors.contactPhone = "请输入正确的手机号码";
    }
    if (!form.companyName.trim()) nextErrors.companyName = "请填写公司名称";
    if (!form.internalContactInfo.trim()) nextErrors.internalContactInfo = "请填写内部对接人";
    if (!isValidProvince(form.province)) nextErrors.province = "请选择正确的所属省份";
    if (!form.customerType) nextErrors.customerType = "请选择客户类型";
    if (form.interestAreas.length === 0) nextErrors.interestAreas = "请至少选择一个关注方向";

    return nextErrors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isEditable || !isEditing || isSubmitting) return;

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/appointments/${appointmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          visitorCount: Number(form.visitorCount),
          vehicleRequirement: form.needVehicle === "yes" ? form.vehicleRequirement : "",
          accommodationRequirement: form.needAccommodation === "yes" ? form.accommodationRequirement : "",
          diningRequirement: form.needDining === "yes" ? form.diningRequirement : "",
          giftRequirement: form.giftPreparation === "yes" ? form.giftRequirement : "",
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        setErrors({ submit: result.error || "预约保存失败，请稍后重试" });
        return;
      }

      setMessage("保存成功，预约详情、列表和相关线索信息已同步更新。");
      setIsEditing(false);
      router.refresh();
    } catch {
      setErrors({ submit: "网络异常，请稍后重试" });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancel() {
    setForm(initialValues);
    setErrors({});
    setMessage(null);
    setIsEditing(false);
  }

  if (!isEditing) {
    return (
      <div className="space-y-6">
        <div className="admin-panel sticky top-20 z-10 flex flex-col justify-between gap-3 rounded-lg border border-blue-100 bg-white/95 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-950">预约信息</h2>
            <p className="mt-1 text-sm text-slate-500">默认只展示信息，避免详情页常驻大表单。</p>
          </div>
          <button
            type="button"
            disabled={!isEditable}
            onClick={() => setIsEditing(true)}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Edit3 className="h-4 w-4" />
            编辑预约信息
          </button>
        </div>
        {!isEditable ? (
          <p className="rounded-md bg-slate-100 px-4 py-3 text-sm font-medium text-slate-600">
            当前预约状态不允许编辑，仅待审批和已通过状态可编辑。
          </p>
        ) : null}
        {message ? <p className="rounded-md bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</p> : null}
        <ReadOnlyDetail form={form} status={status} displayInfo={displayInfo} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="admin-panel sticky top-20 z-20 flex flex-col justify-between gap-3 rounded-lg border border-blue-100 bg-white/95 p-4 shadow-md backdrop-blur sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-950">编辑预约信息</h2>
          <p className="mt-1 text-sm text-slate-500">预约编号、创建时间、审批人、审批时间和当前状态不可在此处修改。</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X className="h-4 w-4" />
            取消
          </button>
          <button
            type="submit"
            disabled={!isEditable || isSubmitting}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? "保存中..." : "保存修改"}
          </button>
        </div>
      </div>

      {errors.submit ? <p className="rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{errors.submit}</p> : null}

      <EditPanel title="参观信息">
        <Field label="参观日期" error={errors.visitDate} required>
          <input type="date" value={form.visitDate} onChange={(event) => updateField("visitDate", event.target.value)} className="form-control" />
        </Field>
        <Field label="参观时间段" error={errors.visitTimeSlot} required>
          <FormSelect value={form.visitTimeSlot} onChange={(value) => updateField("visitTimeSlot", value)} options={visitTimeSlotOptions} />
        </Field>
        <Field label="参观人数" error={errors.visitorCount} required>
          <input type="number" min={1} value={form.visitorCount} onChange={(event) => updateField("visitorCount", event.target.value)} className="form-control" />
        </Field>
      </EditPanel>

      <EditPanel title="客户信息">
        <Field label="客户类型" error={errors.customerType} required>
          <FormSelect value={form.customerType} onChange={(value) => updateField("customerType", value)} placeholder="请选择客户类型" options={customerTypeOptions} />
        </Field>
        <Field label="联系人姓名" error={errors.contactName} required>
          <input value={form.contactName} onChange={(event) => updateField("contactName", event.target.value)} className="form-control" />
        </Field>
        <Field label="联系电话" error={errors.contactPhone} required>
          <input value={form.contactPhone} onChange={(event) => updateField("contactPhone", event.target.value)} className="form-control" inputMode="tel" />
        </Field>
        <Field label="所属省份" error={errors.province} required>
          <ProvinceSelect value={form.province} onChange={(value) => updateField("province", value)} />
        </Field>
        <Field label="公司名称" error={errors.companyName} required>
          <input value={form.companyName} onChange={(event) => updateField("companyName", event.target.value)} className="form-control" />
        </Field>
        <Field label="职务">
          <input value={form.position} onChange={(event) => updateField("position", event.target.value)} className="form-control" />
        </Field>
        <Field label="内部对接人" error={errors.internalContactInfo} required>
          <input value={form.internalContactInfo} onChange={(event) => updateField("internalContactInfo", event.target.value)} className="form-control" placeholder="内部销售或客户经理姓名" />
        </Field>
        <Field label="来访客户级别">
          <input value={form.customerLevel} onChange={(event) => updateField("customerLevel", event.target.value)} className="form-control" />
        </Field>
        <Field label="主要来访人员信息" className="md:col-span-2">
          <textarea value={form.mainVisitorInfo} onChange={(event) => updateField("mainVisitorInfo", event.target.value)} className="form-control min-h-24" />
        </Field>
      </EditPanel>

      <EditPanel title="需求与备注">
        <Field label="关注方向" error={errors.interestAreas} required className="md:col-span-2">
          <div className="grid gap-2 sm:grid-cols-2">
            {interestAreaOptions.map((option) => (
              <label
                key={option.value}
                className={`flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition ${
                  form.interestAreas.includes(option.value)
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-[0_0_0_1px_rgba(16,185,129,0.18)]"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                <input type="checkbox" checked={form.interestAreas.includes(option.value)} onChange={() => toggleInterestArea(option.value)} className="h-4 w-4 rounded border-slate-300" />
                {option.label}
              </label>
            ))}
          </div>
        </Field>
        <Field label="参观目的" className="md:col-span-2">
          <textarea value={form.visitPurpose} onChange={(event) => updateField("visitPurpose", event.target.value)} className="form-control min-h-24" />
        </Field>
        <Field label="客户备注" className="md:col-span-2">
          <textarea value={form.customerRemark} onChange={(event) => updateField("customerRemark", event.target.value)} className="form-control min-h-24" />
        </Field>
      </EditPanel>

      <EditPanel title="接待安排">
        <Field label="接待人">
          <input value={form.receptionist} onChange={(event) => updateField("receptionist", event.target.value)} className="form-control" />
        </Field>
        <Field label="实际接待地点">
          <input value={form.actualReceptionLocation} onChange={(event) => updateField("actualReceptionLocation", event.target.value)} className="form-control" />
        </Field>
        <Field label="到访开始时间">
          <input type="datetime-local" value={form.visitStartTime} onChange={(event) => updateField("visitStartTime", event.target.value)} className="form-control" />
        </Field>
        <Field label="到访结束时间">
          <input type="datetime-local" value={form.visitEndTime} onChange={(event) => updateField("visitEndTime", event.target.value)} className="form-control" />
        </Field>
        <Field label="接待备注" className="md:col-span-2">
          <textarea value={form.receptionNote} onChange={(event) => updateField("receptionNote", event.target.value)} className="form-control min-h-24" />
        </Field>
        <Field label="接待准备事项" className="md:col-span-2">
          <textarea value={form.receptionPreparationNote} onChange={(event) => updateField("receptionPreparationNote", event.target.value)} className="form-control min-h-24" />
        </Field>
        <Field label="接待讲解安排" className="md:col-span-2">
          <textarea value={form.receptionScheduleNote} onChange={(event) => updateField("receptionScheduleNote", event.target.value)} className="form-control min-h-32" />
        </Field>
        <Field label="跟进记录" className="md:col-span-2">
          <textarea value={form.followUpNote} onChange={(event) => updateField("followUpNote", event.target.value)} className="form-control min-h-24" />
        </Field>
      </EditPanel>

      <EditPanel title="接待需求">
        <Field label="是否需要方案交流">
          <RadioGroup value={form.needSolutionConsulting} options={solutionConsultingOptions} onChange={(value) => updateField("needSolutionConsulting", value)} />
        </Field>
        <Field label="是否需要接待讲解">
          <RadioGroup value={form.needGuide} options={requestOptions} onChange={(value) => updateField("needGuide", value)} />
        </Field>
        <Field label="是否需要车辆接送">
          <RadioGroup value={form.needVehicle} options={requestOptions} onChange={(value) => updateRequestField("needVehicle", "vehicleRequirement", value)} />
        </Field>
        {form.needVehicle === "yes" ? (
          <Field label="车辆接送具体要求" className="md:col-span-2">
            <textarea value={form.vehicleRequirement} onChange={(event) => updateField("vehicleRequirement", event.target.value)} className="form-control min-h-24" />
          </Field>
        ) : null}
        <Field label="是否需要住宿安排">
          <RadioGroup value={form.needAccommodation} options={requestOptions} onChange={(value) => updateRequestField("needAccommodation", "accommodationRequirement", value)} />
        </Field>
        {form.needAccommodation === "yes" ? (
          <Field label="住宿具体要求" className="md:col-span-2">
            <textarea value={form.accommodationRequirement} onChange={(event) => updateField("accommodationRequirement", event.target.value)} className="form-control min-h-24" />
          </Field>
        ) : null}
        <Field label="是否需要宴请安排">
          <RadioGroup value={form.needDining} options={requestOptions} onChange={(value) => updateRequestField("needDining", "diningRequirement", value)} />
        </Field>
        {form.needDining === "yes" ? (
          <Field label="宴请具体要求" className="md:col-span-2">
            <textarea value={form.diningRequirement} onChange={(event) => updateField("diningRequirement", event.target.value)} className="form-control min-h-24" />
          </Field>
        ) : null}
        <Field label="是否需要准备礼品">
          <RadioGroup value={form.giftPreparation} options={requestOptions} onChange={(value) => updateRequestField("giftPreparation", "giftRequirement", value)} />
        </Field>
        {form.giftPreparation === "yes" ? (
          <Field label="礼品具体要求" className="md:col-span-2">
            <textarea value={form.giftRequirement} onChange={(event) => updateField("giftRequirement", event.target.value)} className="form-control min-h-24" />
          </Field>
        ) : null}
      </EditPanel>
    </form>
  );
}

function ReadOnlyDetail({
  form,
  status,
  displayInfo,
}: {
  form: FormState;
  status: AppointmentStatus;
  displayInfo: DisplayInfo;
}) {
  return (
    <div className="space-y-6">
      <InfoSection title="预约信息">
        <InfoItem label="预约编号" value={displayInfo.appointmentNo} />
        <InfoItem label="预约展厅" value={displayInfo.showroomName} />
        <InfoItem label="参观日期" value={formatDateValue(form.visitDate)} />
        <InfoItem label="参观时间段" value={getVisitTimeSlotLabel(form.visitTimeSlot)} />
        <InfoItem label="参观人数" value={`${form.visitorCount} 人`} />
        <InfoItem label="是否需要接待讲解" value={getSimpleOptionLabel(form.needGuide)} />
        <InfoItem label="客户备注" value={form.customerRemark} wide />
      </InfoSection>

      <InfoSection title="客户信息">
        <InfoItem label="客户类型" value={getCustomerTypeLabel(form.customerType)} />
        <InfoItem label="联系人姓名" value={form.contactName} />
        <InfoItem label="联系电话" value={form.contactPhone} />
        <InfoItem label="所属省份" value={getProvinceLabel(form.province)} />
        <InfoItem label="公司名称" value={form.companyName} />
        <InfoItem label="职务" value={form.position} />
        <InfoItem label="内部对接人" value={form.internalContactInfo} />
        <InfoItem label="来访客户级别" value={form.customerLevel} />
        <InfoItem label="主要来访人员信息" value={form.mainVisitorInfo} wide />
        <InfoItem label="关注方向" value={getInterestAreaLabels(form.interestAreas.join(","))} wide />
        <InfoItem label="是否需要方案交流" value={getSolutionConsultingLabel(form.needSolutionConsulting)} />
        <InfoItem label="是否需要车辆接送" value={getSimpleOptionLabel(form.needVehicle)} />
        <InfoItem label="是否需要住宿安排" value={getSimpleOptionLabel(form.needAccommodation)} />
        <InfoItem label="车辆接送具体要求" value={form.vehicleRequirement} wide />
        <InfoItem label="住宿具体要求" value={form.accommodationRequirement} wide />
        <InfoItem label="是否需要宴请安排" value={getSimpleOptionLabel(form.needDining)} />
        <InfoItem label="是否需要准备礼品" value={getSimpleOptionLabel(form.giftPreparation)} />
        <InfoItem label="宴请具体要求" value={form.diningRequirement} wide />
        <InfoItem label="礼品具体要求" value={form.giftRequirement} wide />
        <InfoItem label="参观目的" value={form.visitPurpose} wide />
      </InfoSection>

      <InfoSection title="审批信息">
        <InfoItem label="当前状态" value={<AppointmentStatusBadge status={status} />} />
        <InfoItem label="审批人" value={displayInfo.approvedByName} />
        <InfoItem label="审批时间" value={displayInfo.approvedAt} />
        <InfoItem label="审批意见" value={displayInfo.approvalOpinion} wide />
        <InfoItem label="拒绝原因" value={displayInfo.rejectReason} wide />
      </InfoSection>

      <InfoSection title="内部接待安排">
        <InfoItem label="到访开始时间" value={formatDateTimeValue(form.visitStartTime)} />
        <InfoItem label="到访结束时间" value={formatDateTimeValue(form.visitEndTime)} />
        <InfoItem label="实际接待地点" value={form.actualReceptionLocation} />
        <InfoItem label="接待准备事项" value={form.receptionPreparationNote} wide />
        <InfoItem label="接待讲解安排" value={form.receptionScheduleNote} wide />
      </InfoSection>

      <InfoSection title="接待备注与跟进">
        <InfoItem label="接待人" value={form.receptionist} />
        <InfoItem label="接待备注" value={form.receptionNote} wide />
        <InfoItem label="跟进记录" value={form.followUpNote} wide />
      </InfoSection>
    </div>
  );
}

function EditPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="admin-panel rounded-lg p-6">
      <h3 className="border-b border-slate-100 pb-4 text-lg font-bold text-slate-950">{title}</h3>
      <div className="mt-5 grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function InfoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="admin-panel rounded-lg p-6">
      <h3 className="border-b border-slate-100 pb-4 text-lg font-bold text-slate-950">{title}</h3>
      <dl className="mt-5 grid gap-4 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function InfoItem({
  label,
  value,
  wide,
}: {
  label: string;
  value?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold text-slate-950">{value || "-"}</dd>
    </div>
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

function RadioGroup({
  value,
  options,
  onChange,
}: {
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {options.map((option) => (
        <label
          key={option.value}
          className={`flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition ${
            value === option.value
              ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-[0_0_0_1px_rgba(16,185,129,0.18)]"
              : "border-slate-200 bg-white text-slate-600"
          }`}
        >
          <input
            type="radio"
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          {value === option.value ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : null}
          {option.label}
        </label>
      ))}
    </div>
  );
}

function getSimpleOptionLabel(value?: string | null) {
  if (value === "yes") return "是";
  if (value === "no") return "否";
  if (value === "pending") return "待确认";
  return value || "-";
}

function formatDateValue(value: string) {
  if (!value) return "-";
  return value;
}

function formatDateTimeValue(value: string) {
  if (!value) return "-";
  return value.replace("T", " ");
}
