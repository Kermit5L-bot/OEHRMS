"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Upload } from "lucide-react";

type ImportFailure = {
  row: number;
  reason: string;
};

type ImportResult = {
  successCount: number;
  failureCount: number;
  failures: ImportFailure[];
};

type AdminAppointmentImportActionsProps = {
  compact?: boolean;
};

export function AdminAppointmentImportActions({ compact = false }: AdminAppointmentImportActionsProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || isUploading) return;

    setResult(null);
    setError("");
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      setError("仅支持上传 .xlsx 文件");
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setIsUploading(true);
    try {
      const response = await fetch("/api/admin/appointments/import", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "导入失败，请稍后重试");
        return;
      }

      setResult(data);
      router.refresh();
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  const actions = (
    <>
      <Link
        href="/api/admin/appointments/import/template"
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-50"
      >
        <Download className="h-4 w-4" />
        下载导入模板
      </Link>
      <button
        type="button"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        <Upload className="h-4 w-4" />
        {isUploading ? "导入中..." : "上传导入文件"}
      </button>
      <input ref={inputRef} type="file" accept=".xlsx" className="hidden" onChange={handleFileChange} />
    </>
  );

  const feedback = (
    <>
      {error ? <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p> : null}
      {result ? (
        <div className="mt-3 rounded-md bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
          <p>
            导入完成：成功 <span className="font-semibold text-emerald-700">{result.successCount}</span> 条，失败{" "}
            <span className="font-semibold text-red-700">{result.failureCount}</span> 条。
          </p>
          {result.failures.length > 0 ? (
            <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-xs text-red-700">
              {result.failures.map((failure) => (
                <li key={`${failure.row}-${failure.reason}`}>
                  第 {failure.row} 行：{failure.reason}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </>
  );

  if (compact) {
    return (
      <div>
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
        {feedback}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {actions}
        <p className="text-xs text-slate-500">仅支持 .xlsx；合法行会正常导入，错误行会跳过。</p>
      </div>
      {feedback}
    </div>
  );
}
