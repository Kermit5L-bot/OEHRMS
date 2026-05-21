"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AppointmentStatus } from "@prisma/client";
import { CheckCircle2, ClipboardCheck, FileCheck2, Save, XCircle } from "lucide-react";

type InternalReceptionState = {
  receptionist: string;
  receptionNote: string;
  followUpNote: string;
  applicantName: string;
  internalContactInfo: string;
  customerLevel: string;
  mainVisitorInfo: string;
  visitStartTime: string;
  visitEndTime: string;
  actualReceptionLocation: string;
  needVehicle: string;
  vehicleRequirement: string;
  needAccommodation: string;
  accommodationRequirement: string;
  needDining: string;
  diningRequirement: string;
  giftPreparation: string;
  giftRequirement: string;
  receptionScheduleNote: string;
  receptionPreparationNote: string;
};

type AdminAppointmentActionsProps = {
  appointmentId: number;
  status: AppointmentStatus;
  initialReception: InternalReceptionState;
};

type ActionMessage = {
  type: "success" | "error";
  text: string;
};

const yesNoOptions = [
  { value: "", label: "未设置" },
  { value: "yes", label: "是" },
  { value: "no", label: "否" },
  { value: "pending", label: "待沟通" },
];

const schedulePlaceholder = [
  "讲师：王老师｜内容：公司介绍｜时间：09:30-10:00｜地点：展厅入口",
  "讲师：李老师｜内容：产品方案讲解｜时间：10:00-10:40｜地点：智慧环保展区",
  "讲师：张老师｜内容：实训基地介绍｜时间：10:40-11:10｜地点：会议室",
].join("\n");

export function AdminAppointmentActions({
  appointmentId,
  status,
  initialReception,
}: AdminAppointmentActionsProps) {
  const router = useRouter();
  const [approvalOpinion, setApprovalOpinion] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [reception, setReception] = useState<InternalReceptionState>(initialReception);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [message, setMessage] = useState<ActionMessage | null>(null);

  function updateReception<K extends keyof InternalReceptionState>(field: K, value: InternalReceptionState[K]) {
    setReception((current) => ({ ...current, [field]: value }));
    setMessage(null);
  }

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
        <div className={`rounded-md px-4 py-3 text-sm font-medium ${message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </div>
      ) : null}

      <section className="admin-panel rounded-lg p-6">
        <h2 className="inline-flex items-center gap-2 text-lg font-bold text-slate-950">
          <ClipboardCheck className="h-5 w-5 text-blue-600" />
          审批操作
        </h2>
        <div className="mt-4 grid gap-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">审批意见</span>
            <textarea value={approvalOpinion} onChange={(event) => setApprovalOpinion(event.target.value)} disabled={!canApprove} className="form-control mt-2 min-h-24" placeholder="通过时可填写审批意见" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={!canApprove || isSubmitting !== null}
              onClick={() => postAction(`/api/admin/appointments/${appointmentId}/approve`, { approvalOpinion, receptionist: reception.receptionist, receptionNote: reception.receptionNote })}
              className="min-h-11 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <CheckCircle2 className="mr-2 inline h-4 w-4 align-[-2px]" />
              {isSubmitting?.includes("approve") ? "提交中..." : "通过预约"}
            </button>
            <button
              type="button"
              disabled={!canComplete || isSubmitting !== null}
              onClick={() => postAction(`/api/admin/appointments/${appointmentId}/complete`)}
              className="min-h-11 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <FileCheck2 className="mr-2 inline h-4 w-4 align-[-2px]" />
              {isSubmitting?.includes("complete") ? "提交中..." : "标记已完成"}
            </button>
          </div>
        </div>
      </section>

      <section className="admin-panel rounded-lg p-6">
        <h2 className="inline-flex items-center gap-2 text-lg font-bold text-slate-950">
          <XCircle className="h-5 w-5 text-red-600" />
          拒绝预约
        </h2>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-slate-700">拒绝原因</span>
          <textarea value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} disabled={!canReject} className="form-control mt-2 min-h-24" placeholder="拒绝预约时必须填写原因" />
        </label>
        <button
          type="button"
          disabled={!canReject || isSubmitting !== null}
          onClick={() => postAction(`/api/admin/appointments/${appointmentId}/reject`, { rejectReason })}
          className="mt-4 min-h-11 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <XCircle className="mr-2 inline h-4 w-4 align-[-2px]" />
          {isSubmitting?.includes("reject") ? "提交中..." : "拒绝预约"}
        </button>
      </section>

      <section className="admin-panel rounded-lg p-6">
        <h2 className="inline-flex items-center gap-2 text-lg font-bold text-slate-950">
          <Save className="h-5 w-5 text-blue-600" />
          内部接待安排
        </h2>
        <div className="mt-4 grid gap-4">
          <TextInput label="申请人" value={reception.applicantName} disabled={!canEditNote} onChange={(value) => updateReception("applicantName", value)} />
          <TextInput label="内部对接人及电话" value={reception.internalContactInfo} disabled={!canEditNote} onChange={(value) => updateReception("internalContactInfo", value)} />
          <TextInput label="来访客户级别" value={reception.customerLevel} disabled={!canEditNote} onChange={(value) => updateReception("customerLevel", value)} />
          <TextArea label="主要来访人员信息" value={reception.mainVisitorInfo} disabled={!canEditNote} onChange={(value) => updateReception("mainVisitorInfo", value)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput label="来访开始时间" type="datetime-local" value={reception.visitStartTime} disabled={!canEditNote} onChange={(value) => updateReception("visitStartTime", value)} />
            <TextInput label="离开时间" type="datetime-local" value={reception.visitEndTime} disabled={!canEditNote} onChange={(value) => updateReception("visitEndTime", value)} />
          </div>
          <TextInput label="实际接待地点" value={reception.actualReceptionLocation} disabled={!canEditNote} onChange={(value) => updateReception("actualReceptionLocation", value)} />
          <SelectInput label="车辆接送安排" value={reception.needVehicle} disabled={!canEditNote} onChange={(value) => updateReception("needVehicle", value)} />
          <TextArea label="车辆接送具体要求" value={reception.vehicleRequirement} disabled={!canEditNote} onChange={(value) => updateReception("vehicleRequirement", value)} />
          <SelectInput label="住宿安排" value={reception.needAccommodation} disabled={!canEditNote} onChange={(value) => updateReception("needAccommodation", value)} />
          <TextArea label="住宿具体要求" value={reception.accommodationRequirement} disabled={!canEditNote} onChange={(value) => updateReception("accommodationRequirement", value)} />
          <SelectInput label="宴请安排" value={reception.needDining} disabled={!canEditNote} onChange={(value) => updateReception("needDining", value)} />
          <TextArea label="宴请具体要求" value={reception.diningRequirement} disabled={!canEditNote} onChange={(value) => updateReception("diningRequirement", value)} />
          <TextInput label="礼品准备" value={reception.giftPreparation} disabled={!canEditNote} onChange={(value) => updateReception("giftPreparation", value)} />
          <TextArea label="指定伴手礼说明" value={reception.giftRequirement} disabled={!canEditNote} onChange={(value) => updateReception("giftRequirement", value)} />
          <TextArea label="接待准备事项" value={reception.receptionPreparationNote} disabled={!canEditNote} onChange={(value) => updateReception("receptionPreparationNote", value)} />
          <TextArea label="接待讲解安排" value={reception.receptionScheduleNote} disabled={!canEditNote} onChange={(value) => updateReception("receptionScheduleNote", value)} placeholder={schedulePlaceholder} tall />
        </div>
      </section>

      <section className="admin-panel rounded-lg p-6">
        <h2 className="inline-flex items-center gap-2 text-lg font-bold text-slate-950">
          <Save className="h-5 w-5 text-blue-600" />
          接待备注与跟进
        </h2>
        <div className="mt-4 grid gap-4">
          <TextInput label="接待负责人" value={reception.receptionist} disabled={!canEditNote} onChange={(value) => updateReception("receptionist", value)} />
          <TextArea label="接待备注" value={reception.receptionNote} disabled={!canEditNote} onChange={(value) => updateReception("receptionNote", value)} />
          <TextArea label="后续跟进记录" value={reception.followUpNote} disabled={!canEditNote} onChange={(value) => updateReception("followUpNote", value)} />
          <button
            type="button"
            disabled={!canEditNote || isSubmitting !== null}
            onClick={() => postAction(`/api/admin/appointments/${appointmentId}/reception-note`, reception)}
            className="min-h-11 w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-fit"
          >
            <Save className="mr-2 inline h-4 w-4 align-[-2px]" />
            {isSubmitting?.includes("reception-note") ? "保存中..." : "保存接待安排"}
          </button>
        </div>
      </section>
    </div>
  );
}

function TextInput({
  label,
  value,
  disabled,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="form-control mt-2" />
    </label>
  );
}

function TextArea({
  label,
  value,
  disabled,
  onChange,
  placeholder,
  tall,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  tall?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className={`form-control mt-2 ${tall ? "min-h-40" : "min-h-24"}`}
        placeholder={placeholder}
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="form-control mt-2">
        {yesNoOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
