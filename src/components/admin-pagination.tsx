"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type AdminPaginationProps = {
  page: number;
  pageCount: number;
};

function clampPage(page: number, pageCount: number) {
  if (!Number.isInteger(page)) return 1;
  return Math.min(Math.max(page, 1), Math.max(pageCount, 1));
}

export function AdminPagination({ page, pageCount }: AdminPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const normalizedPageCount = Math.max(pageCount, 1);
  const normalizedPage = clampPage(page, normalizedPageCount);
  const [jumpPage, setJumpPage] = useState(String(normalizedPage));

  function goToPage(nextPage: number) {
    const targetPage = clampPage(nextPage, normalizedPageCount);
    const params = new URLSearchParams(searchParams.toString());
    if (targetPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(targetPage));
    }
    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ""}`);
  }

  function handleJump(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    goToPage(Number(jumpPage));
  }

  return (
    <div className="mt-5 flex flex-col gap-3 text-sm text-slate-600 lg:flex-row lg:items-center lg:justify-between">
      <span>
        第 <span className="font-semibold text-slate-950">{normalizedPage}</span> /{" "}
        <span className="font-semibold text-slate-950">{normalizedPageCount}</span> 页
      </span>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => goToPage(normalizedPage - 1)}
          disabled={normalizedPage <= 1}
          className="rounded-md border border-slate-300 px-3 py-2 text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:text-slate-300"
        >
          上一页
        </button>

        <label className="flex items-center gap-2">
          <span className="text-slate-500">页码</span>
          <select
            value={normalizedPage}
            onChange={(event) => {
              const nextPage = Number(event.target.value);
              setJumpPage(String(nextPage));
              goToPage(nextPage);
            }}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {Array.from({ length: normalizedPageCount }, (_, index) => index + 1).map((item) => (
              <option key={item} value={item}>
                第 {item} 页
              </option>
            ))}
          </select>
        </label>

        <form onSubmit={handleJump} className="flex items-center gap-2">
          <span className="text-slate-500">跳转到</span>
          <input
            type="number"
            min={1}
            max={normalizedPageCount}
            value={jumpPage}
            onChange={(event) => setJumpPage(event.target.value)}
            className="h-10 w-20 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <button type="submit" className="rounded-md bg-blue-600 px-3 py-2 font-semibold text-white hover:bg-blue-700">
            跳转
          </button>
        </form>

        <button
          type="button"
          onClick={() => goToPage(normalizedPage + 1)}
          disabled={normalizedPage >= normalizedPageCount}
          className="rounded-md border border-slate-300 px-3 py-2 text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:text-slate-300"
        >
          下一页
        </button>
      </div>
    </div>
  );
}
