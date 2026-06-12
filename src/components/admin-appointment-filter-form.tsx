"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { FormSelect, type FormSelectOption } from "@/components/form-select";

type AdminAppointmentFilterFormProps = {
  status: string;
  showroomId: string;
  startDate: string;
  endDate: string;
  keyword: string;
  statusOptions: readonly FormSelectOption[];
  showroomOptions: readonly FormSelectOption[];
};

export function AdminAppointmentFilterForm({
  status,
  showroomId,
  startDate,
  endDate,
  keyword,
  statusOptions,
  showroomOptions,
}: AdminAppointmentFilterFormProps) {
  const [selectedStatus, setSelectedStatus] = useState(status);
  const [selectedShowroomId, setSelectedShowroomId] = useState(showroomId);

  return (
    <form className="admin-panel mt-6 grid gap-3 rounded-lg p-4 lg:grid-cols-6">
      <FormSelect
        name="status"
        value={selectedStatus}
        onChange={setSelectedStatus}
        options={statusOptions}
      />
      <FormSelect
        name="showroomId"
        value={selectedShowroomId}
        onChange={setSelectedShowroomId}
        options={showroomOptions}
      />
      <input name="startDate" type="date" defaultValue={startDate} className="form-control" />
      <input name="endDate" type="date" defaultValue={endDate} className="form-control" />
      <input name="keyword" defaultValue={keyword} placeholder="姓名 / 手机号 / 公司" className="form-control" />
      <button className="inline-flex min-h-11 w-fit min-w-28 items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700">
        <Search className="h-4 w-4" />
        <span>查询</span>
      </button>
    </form>
  );
}
