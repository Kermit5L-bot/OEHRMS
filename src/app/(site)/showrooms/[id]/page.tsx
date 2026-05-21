import Link from "next/link";
import { Building2, CheckCircle2, Info, Lightbulb, MapPin, Send, TicketCheck } from "lucide-react";
import {
  getShowroomStatusLabel,
  getShowroomTypeLabel,
  normalizeShowroomCoverSrc,
} from "@/lib/showrooms";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ShowroomDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ShowroomDetailPage({ params }: ShowroomDetailPageProps) {
  const { id } = await params;
  const showroomId = Number(id);

  if (!Number.isInteger(showroomId)) {
    return <ShowroomNotFound />;
  }

  const showroom = await prisma.showroom.findUnique({
    where: { id: showroomId },
  });

  if (!showroom) {
    return <ShowroomNotFound />;
  }
  if (showroom.status !== "open" && showroom.status !== "closed") {
    return <ShowroomNotFound />;
  }

  const isOpen = showroom.status === "open";
  const coverSrc = normalizeShowroomCoverSrc(showroom.coverImage);

  return (
    <div className="tech-grid min-h-[calc(100vh-73px)]">
      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <Link href="/showrooms" className="text-sm font-semibold text-cyan-200 hover:text-cyan-100">
          返回展厅列表
        </Link>

        <section className="glass-panel mt-6 overflow-hidden rounded-lg">
          <div className="relative flex aspect-video min-h-80 items-end overflow-hidden p-6 sm:p-8">
            {coverSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverSrc} alt={`${showroom.name}封面图`} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(34,211,238,0.35),transparent_18rem),linear-gradient(135deg,rgba(14,116,144,0.95),rgba(37,99,235,0.86)),linear-gradient(45deg,#0f172a,#1e293b)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
            <div className="relative max-w-3xl">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-100">
                <MapPin className="h-4 w-4" />
                {showroom.city} · {getShowroomTypeLabel(showroom.type)}
              </p>
              <h1 className="mt-2 text-3xl font-bold text-white sm:text-5xl">{showroom.name}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">{showroom.summary}</p>
            </div>
          </div>

          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.45fr_0.9fr] lg:p-8">
            <div className="space-y-5">
              <InfoBlock title="展厅介绍" icon={Info}>
                <p className="leading-7 text-slate-300">{showroom.description || showroom.summary}</p>
              </InfoBlock>
              <InfoBlock title="展示重点" icon={Lightbulb}>
                <p className="leading-7 text-slate-300">
                  围绕环保业务展示、客户接待交流和实训基地参观，提供统一入口和数字化预约体验。
                </p>
              </InfoBlock>
              <InfoBlock title="预约参观提示" icon={TicketCheck}>
                <p className="leading-7 text-slate-300">
                  提交预约申请后，请耐心等待工作人员确认。审核通过后，我们将结合参观时间、接待安排与您联系。
                </p>
              </InfoBlock>
            </div>

            <aside className="rounded-lg border border-cyan-300/20 bg-slate-950/42 p-5">
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
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {getShowroomStatusLabel(showroom.status)}
                </span>
              </div>
              <h2 className="mt-5 inline-flex items-center gap-2 text-lg font-bold text-white">
                <MapPin className="h-5 w-5 text-cyan-200" />
                参观信息
              </h2>
              <dl className="mt-4 space-y-4 text-sm">
                <InfoItem label="地点" value={showroom.city} />
                <InfoItem label="开放时间" value={showroom.openingHours || "待补充"} />
                <InfoItem label="建议参观时长" value={showroom.suggestedDuration || "待补充"} />
                <InfoItem label="地址说明" value={showroom.address || "待补充"} />
              </dl>

              <div className="mt-6 grid gap-3">
                {isOpen ? (
                  <Link
                    href={`/appointment?showroomId=${showroom.id}`}
                    className="min-h-12 rounded-md bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-blue-950/30 hover:bg-blue-500"
                  >
                    <Send className="mr-2 inline h-4 w-4 align-[-2px]" />
                    预约参观
                  </Link>
                ) : (
                  <div className="rounded-md bg-slate-700/70 px-5 py-3 text-center text-sm font-semibold text-slate-300">
                    该展厅当前暂停预约，请稍后再试
                  </div>
                )}
                <Link
                  href="/showrooms"
                  className="min-h-12 rounded-md border border-cyan-300/30 px-5 py-3 text-center text-sm font-semibold text-cyan-100 hover:bg-cyan-300/10"
                >
                  返回展厅列表
                </Link>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </div>
  );
}

function InfoBlock({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-cyan-300/18 bg-slate-950/35 p-5">
      <h2 className="inline-flex items-center gap-2 text-lg font-bold text-white">
        <Icon className="h-5 w-5 text-cyan-200" />
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-slate-400">{label}</dt>
      <dd className="mt-1 font-semibold text-slate-100">{value}</dd>
    </div>
  );
}

function ShowroomNotFound() {
  return (
    <div className="tech-grid min-h-[calc(100vh-73px)] px-4 py-16">
      <div className="glass-panel mx-auto max-w-3xl rounded-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-white">未找到展厅</h1>
        <p className="mt-3 text-slate-300">该展厅可能不存在，或数据库中暂无对应记录。</p>
        <div className="mt-6">
          <Link href="/showrooms" className="rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500">
            返回展厅列表
          </Link>
        </div>
      </div>
    </div>
  );
}
