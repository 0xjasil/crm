import React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  IconArrowUpRight,
  IconArrowDownRight,
} from "@tabler/icons-react";

export type IndicatorColor =
  | "amber"
  | "orange"
  | "emerald"
  | "green"
  | "blue"
  | "purple"
  | "rose"
  | "red"
  | "cyan"
  | "sky"
  | "teal"
  | "slate"
  | "gray";

export interface KpiCardProps {
  title: string;
  value: string | number;
  indicatorColor?: IndicatorColor | string;
  icon?: React.ReactNode;
  description?: React.ReactNode;
  trend?: {
    value: string | number;
    isPositive?: boolean;
    label?: string;
  };
  href?: string;
  onClick?: () => void;
  showChevron?: boolean;
  className?: string;
}

const COLOR_MAP: Record<string, string> = {
  amber: "bg-amber-500 dark:bg-amber-400",
  orange: "bg-orange-500 dark:bg-orange-400",
  emerald: "bg-emerald-500 dark:bg-emerald-400",
  green: "bg-emerald-500 dark:bg-emerald-400",
  blue: "bg-blue-500 dark:bg-blue-400",
  purple: "bg-purple-500 dark:bg-purple-400",
  rose: "bg-rose-500 dark:bg-rose-400",
  red: "bg-rose-500 dark:bg-rose-400",
  cyan: "bg-cyan-500 dark:bg-cyan-400",
  sky: "bg-sky-500 dark:bg-sky-400",
  teal: "bg-teal-500 dark:bg-teal-400",
  slate: "bg-slate-400 dark:bg-slate-500",
  gray: "bg-slate-400 dark:bg-slate-500",
};

function getIndicatorColorClass(color?: string, title?: string): string {
  if (color && COLOR_MAP[color.toLowerCase()]) {
    return COLOR_MAP[color.toLowerCase()];
  }
  if (color && color.startsWith("bg-")) {
    return color;
  }

  // Automatic heuristic based on title keyword matching
  const t = (title || "").toLowerCase();
  if (
    t.includes("total") ||
    t.includes("order") ||
    t.includes("revenue") ||
    t.includes("income")
  ) {
    return "bg-amber-500 dark:bg-amber-400";
  }
  if (
    t.includes("ongoing") ||
    t.includes("active") ||
    t.includes("new") ||
    t.includes("enroll") ||
    t.includes("success")
  ) {
    return "bg-emerald-500 dark:bg-emerald-400";
  }
  if (t.includes("pending") || t.includes("wait") || t.includes("scheduled")) {
    return "bg-slate-400 dark:bg-slate-500";
  }
  if (
    t.includes("overdue") ||
    t.includes("urgent") ||
    t.includes("action") ||
    t.includes("expense") ||
    t.includes("drop")
  ) {
    return "bg-rose-500 dark:bg-rose-400";
  }
  if (t.includes("call") || t.includes("phone") || t.includes("telecaller")) {
    return "bg-purple-500 dark:bg-purple-400";
  }
  if (t.includes("branch") || t.includes("center")) {
    return "bg-blue-500 dark:bg-blue-400";
  }

  return "bg-emerald-500 dark:bg-emerald-400";
}

export function KpiCard({
  title,
  value,
  indicatorColor,
  icon,
  description,
  trend,
  href,
  onClick,
  showChevron = true,
  className,
}: KpiCardProps) {
  const colorClass = getIndicatorColorClass(indicatorColor, title);
  const isInteractive = Boolean(href || onClick);
  const valueLength = String(value).length;
  const cardClassName = cn(
    "group relative flex h-full min-h-0 sm:min-h-[140px] w-full min-w-0 flex-col justify-between gap-3 sm:gap-5 rounded-xl border border-border/80 bg-card p-3.5 sm:p-5 lg:p-6 text-left text-card-foreground shadow-xs",
    isInteractive &&
      "cursor-pointer transition-[transform,box-shadow,border-color] duration-200 hover:border-border hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-safe:hover:-translate-y-0.5 motion-reduce:transition-none",
    className,
  );

  const cardContent = (
    <>
      <span className="flex w-full min-w-0 items-start justify-between gap-3">
        <span className="flex min-w-0 items-end gap-2">
          <span
            className={cn(
              "block font-semibold leading-none tracking-tight tabular-nums [overflow-wrap:anywhere]",
              valueLength > 12
                ? "text-lg sm:text-xl md:text-2xl"
                : valueLength > 8
                  ? "text-xl sm:text-2xl md:text-3xl"
                  : "text-2xl sm:text-3xl md:text-4xl",
            )}
          >
            {value}
          </span>
          {trend && (
            <span
              className={cn(
                "mb-0.5 flex flex-wrap items-center text-xs font-medium",
                trend.isPositive !== false
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400",
              )}
            >
              {trend.isPositive !== false ? (
                <IconArrowUpRight aria-hidden="true" className="size-3.5 shrink-0" />
              ) : (
                <IconArrowDownRight aria-hidden="true" className="size-3.5 shrink-0" />
              )}
              <span className="[overflow-wrap:anywhere]">{trend.value}</span>
              {trend.label && (
                <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                  {trend.label}
                </span>
              )}
            </span>
          )}
        </span>
        {isInteractive && showChevron && (
          <span
            aria-hidden="true"
            className={cn(
              "flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-lg text-white transition-transform group-hover:scale-105",
              colorClass,
            )}
          >
            <IconArrowUpRight className="size-3.5 sm:size-4" />
          </span>
        )}
      </span>

      <span className="block w-full min-w-0">
        <span className="flex items-start gap-2 text-xs sm:text-sm font-semibold leading-snug">
          {icon && (
            <span aria-hidden="true" className="mt-0.5 shrink-0 text-muted-foreground [&>svg]:size-4">
              {icon}
            </span>
          )}
          <span className="min-w-0 [overflow-wrap:anywhere]">{title}</span>
        </span>
        {description && (
          <span className="mt-1 hidden sm:block text-xs font-normal leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
            {description}
          </span>
        )}
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={cardClassName}>
        {cardContent}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cardClassName}>
        {cardContent}
      </button>
    );
  }

  return <div className={cardClassName}>{cardContent}</div>;
}

export default KpiCard;
