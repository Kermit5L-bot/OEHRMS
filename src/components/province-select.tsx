"use client";

import { FormSelect } from "@/components/form-select";
import { provinceOptions } from "@/lib/appointments";

type ProvinceSelectProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  variant?: "site" | "admin";
};

const provinceSelectOptions = provinceOptions.map((province) => ({
  value: province,
  label: province,
}));

export function ProvinceSelect({
  value,
  onChange,
  disabled,
  variant = "admin",
}: ProvinceSelectProps) {
  return (
    <FormSelect
      value={value}
      options={provinceSelectOptions}
      onChange={onChange}
      disabled={disabled}
      searchable
      variant={variant}
      placeholder="请选择或搜索省份"
    />
  );
}
