import Image from "next/image";

type BrandMarkProps = {
  variant?: "dark" | "light";
  subtitle?: string;
  compact?: boolean;
  logoOnly?: boolean;
};

export function BrandMark({
  variant = "dark",
  subtitle = "智慧展厅预约",
  compact = false,
  logoOnly = false,
}: BrandMarkProps) {
  const isDark = variant === "dark";

  if (logoOnly) {
    return (
      <span className="block h-12 w-28 sm:w-32">
        <Image src="/logo.png" alt="万维盈创" width={160} height={64} className="h-full w-full object-contain" priority />
      </span>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
          isDark ? "border-cyan-300/25 bg-white/8" : "border-blue-100 bg-blue-50"
        }`}
      >
        <Image src="/logo.png" alt="万维盈创" width={30} height={30} className="h-7 w-7 object-contain" priority />
      </span>
      <span className="min-w-0">
        <span className={`block truncate text-base font-bold ${isDark ? "text-white" : "text-slate-950"}`}>
          万维盈创
        </span>
        {!compact ? (
          <span className={`block truncate text-xs font-semibold ${isDark ? "text-cyan-200" : "text-blue-700"}`}>
            {subtitle}
          </span>
        ) : null}
      </span>
    </div>
  );
}
