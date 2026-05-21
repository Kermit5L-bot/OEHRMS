import Link from "next/link";
import { Building2, CircleCheck, MapPin, PauseCircle } from "lucide-react";
import {
  getShowroomStatusLabel,
  getShowroomTypeLabel,
  normalizeShowroomCoverSrc,
  type ShowroomSummary,
} from "@/lib/showrooms";

type ShowroomCardProps = {
  showroom: ShowroomSummary;
};

export function ShowroomCard({ showroom }: ShowroomCardProps) {
  const isOpen = showroom.status === "open";
  const coverSrc = normalizeShowroomCoverSrc(showroom.coverImage);

  return (
    <article className="glass-panel group flex h-full flex-col overflow-hidden rounded-lg transition sm:hover:-translate-y-0.5">
      <div className="relative flex aspect-video min-h-44 items-end overflow-hidden p-5">
        {coverSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverSrc}
            alt={`${showroom.name}封面图`}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(34,211,238,0.35),transparent_16rem),linear-gradient(135deg,rgba(14,116,144,0.95),rgba(37,99,235,0.86)),linear-gradient(45deg,#0f172a,#1e293b)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-slate-950/20 to-slate-950/82" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-cyan-300/35" />
        <div className="relative">
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-100">
            <MapPin className="h-4 w-4" />
            {showroom.city}
          </p>
          <h2 className="mt-1 text-xl font-bold text-white">{showroom.name}</h2>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
            <Building2 className="h-3.5 w-3.5" />
            {getShowroomTypeLabel(showroom.type)}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
              isOpen
                ? "bg-emerald-400/12 text-emerald-200 ring-emerald-300/25"
                : "bg-slate-500/18 text-slate-300 ring-slate-400/20"
            }`}
          >
            {isOpen ? <CircleCheck className="h-3.5 w-3.5" /> : <PauseCircle className="h-3.5 w-3.5" />}
            {getShowroomStatusLabel(showroom.status)}
          </span>
        </div>

        <p className="mt-4 flex-1 text-sm leading-6 text-slate-300">{showroom.summary}</p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link
            href={`/showrooms/${showroom.id}`}
            className="min-h-11 rounded-md border border-cyan-300/30 px-4 py-3 text-center text-sm font-semibold text-cyan-100 hover:bg-cyan-300/10"
          >
            查看详情
          </Link>
          {isOpen ? (
            <Link
              href={`/appointment?showroomId=${showroom.id}`}
              className="min-h-11 rounded-md bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-blue-950/30 hover:bg-blue-500"
            >
              预约参观
            </Link>
          ) : (
            <span className="min-h-11 cursor-not-allowed rounded-md bg-slate-700/70 px-4 py-3 text-center text-sm font-semibold text-slate-400">
              暂停预约
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
