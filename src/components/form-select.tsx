"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type FormSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type FormSelectProps = {
  value: string;
  options: readonly FormSelectOption[];
  onChange: (value: string) => void;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  variant?: "site" | "admin";
};

export function FormSelect({
  value,
  options,
  onChange,
  name,
  placeholder = "请选择",
  disabled,
  searchable,
  variant = "admin",
}: FormSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const selectedOption = options.find((option) => option.value === value);
  const isSite = variant === "site";

  const filteredOptions = useMemo(() => {
    const trimmedKeyword = keyword.trim();
    if (!searchable || !trimmedKeyword) return options;
    return options.filter((option) => option.label.includes(trimmedKeyword));
  }, [keyword, options, searchable]);

  const triggerClassName = isSite
    ? "form-control flex min-h-12 w-full items-center justify-between gap-3 pr-10 text-left"
    : "form-control flex min-h-11 w-full items-center justify-between gap-3 pr-10 text-left";
  const panelClassName = isSite
    ? "absolute z-40 mt-2 max-h-64 w-full overflow-auto rounded-md border border-cyan-300/20 bg-slate-950/95 p-1 shadow-xl shadow-slate-950/40"
    : "absolute z-40 mt-2 max-h-64 w-full overflow-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg";
  const searchClassName = isSite
    ? "mb-1 w-full rounded border border-cyan-300/20 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-400 focus:border-cyan-200"
    : "mb-1 w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-400";
  const emptyClassName = isSite
    ? "px-3 py-2 text-sm text-slate-400"
    : "px-3 py-2 text-sm text-slate-400";

  function close() {
    setIsOpen(false);
    setKeyword("");
  }

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          close();
        }
      }}
    >
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        type="button"
        disabled={disabled}
        className={triggerClassName}
        onClick={() => {
          if (!disabled) setIsOpen((current) => !current);
        }}
      >
        <span className={selectedOption ? "" : isSite ? "text-slate-400" : "text-slate-400"}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 transition ${
            isOpen ? "rotate-180" : ""
          } ${isSite ? "text-cyan-100/70" : "text-slate-400"}`}
        />
      </button>
      {isOpen && !disabled ? (
        <div className={panelClassName}>
          {searchable ? (
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              className={searchClassName}
              placeholder="输入关键词搜索"
              autoComplete="off"
            />
          ) : null}
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={option.disabled}
                className={getOptionClassName({
                  isSite,
                  isSelected: value === option.value,
                  isDisabled: option.disabled,
                })}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  if (option.disabled) return;
                  onChange(option.value);
                  close();
                }}
              >
                <span>{option.label}</span>
                {value === option.value ? <Check className="h-4 w-4" /> : null}
              </button>
            ))
          ) : (
            <p className={emptyClassName}>没有匹配选项</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function getOptionClassName({
  isSite,
  isSelected,
  isDisabled,
}: {
  isSite: boolean;
  isSelected: boolean;
  isDisabled?: boolean;
}) {
  const base = "flex w-full items-center justify-between gap-3 rounded px-3 py-2 text-left text-sm transition";
  if (isDisabled) {
    return `${base} cursor-not-allowed opacity-45 ${isSite ? "text-slate-400" : "text-slate-400"}`;
  }
  if (isSite) {
    return `${base} ${
      isSelected
        ? "bg-cyan-300/15 text-cyan-50"
        : "text-slate-100 hover:bg-cyan-300/10"
    }`;
  }
  return `${base} ${
    isSelected
      ? "bg-blue-50 text-blue-700"
      : "text-slate-700 hover:bg-blue-50"
  }`;
}
