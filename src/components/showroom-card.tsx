import Link from "next/link";
import {
  getShowroomCoverStyle,
  getShowroomStatusLabel,
  getShowroomTypeLabel,
  type ShowroomSummary,
} from "@/lib/showrooms";

type ShowroomCardProps = {
  showroom: ShowroomSummary;
};

export function ShowroomCard({ showroom }: ShowroomCardProps) {
  const isOpen = showroom.status === "open";

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div
        className="flex h-44 items-end bg-cover bg-center p-5 text-white"
        style={getShowroomCoverStyle(showroom)}
      >
        <div>
          <p className="text-sm font-medium text-white/85">{showroom.city}</p>
          <h2 className="mt-1 text-xl font-semibold">{showroom.name}</h2>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            {getShowroomTypeLabel(showroom.type)}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              isOpen ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
            }`}
          >
            {getShowroomStatusLabel(showroom.status)}
          </span>
        </div>

        <p className="mt-4 flex-1 text-sm leading-6 text-slate-600">{showroom.summary}</p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={`/showrooms/${showroom.id}`}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            查看详情
          </Link>
          {isOpen ? (
            <Link
              href={`/appointment?showroomId=${showroom.id}`}
              className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              预约参观
            </Link>
          ) : (
            <span className="cursor-not-allowed rounded-md bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500">
              暂停预约
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
