import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig = {
  pending: {
    label: "Pending",
    variant: "outline" as const,
    className: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300",
    dotClassName: "bg-amber-500",
  },
  offering: {
    label: "Offering",
    variant: "outline" as const,
    className: "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300 qs-live-pulse",
    dotClassName: "bg-blue-500",
  },
  filled: {
    label: "Filled",
    variant: "outline" as const,
    className: "border-green-300 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-300",
    dotClassName: "bg-green-500",
  },
  cancelled: {
    label: "Cancelled",
    variant: "outline" as const,
    className: "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-700 dark:bg-rose-950 dark:text-rose-300",
    dotClassName: "bg-rose-500",
  },
  // Offer statuses
  accepted: {
    label: "Accepted",
    variant: "outline" as const,
    className: "border-green-300 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-300",
    dotClassName: "bg-green-500",
  },
  declined: {
    label: "Declined",
    variant: "outline" as const,
    className: "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-700 dark:bg-rose-950 dark:text-rose-300",
    dotClassName: "bg-rose-500",
  },
  expired: {
    label: "Expired",
    variant: "outline" as const,
    className: "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300",
    dotClassName: "bg-slate-500",
  },
  withdrawn: {
    label: "Withdrawn",
    variant: "outline" as const,
    className: "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300",
    dotClassName: "bg-slate-500",
  },
  // Timesheets
  submitted: {
    label: "Submitted",
    variant: "outline" as const,
    className: "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300",
    dotClassName: "bg-blue-500",
  },
  approved: {
    label: "Approved",
    variant: "outline" as const,
    className: "border-green-300 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-300",
    dotClassName: "bg-green-500",
  },
  disputed: {
    label: "Disputed",
    variant: "outline" as const,
    className: "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-700 dark:bg-rose-950 dark:text-rose-300",
    dotClassName: "bg-rose-500",
  },
  paid: {
    label: "Paid",
    variant: "outline" as const,
    className: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    dotClassName: "bg-emerald-500",
  },
  // Invoices
  draft: {
    label: "Draft",
    variant: "outline" as const,
    className: "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300",
    dotClassName: "bg-slate-500",
  },
  sent: {
    label: "Sent",
    variant: "outline" as const,
    className: "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300",
    dotClassName: "bg-blue-500",
  },
  // Compliance
  compliant: {
    label: "Compliant",
    variant: "outline" as const,
    className: "border-green-300 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-300",
    dotClassName: "bg-green-500",
  },
  "pending-compliance": {
    label: "Pending",
    variant: "outline" as const,
    className: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300",
    dotClassName: "bg-amber-500",
  },
  "expired-compliance": {
    label: "Expired",
    variant: "outline" as const,
    className: "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-700 dark:bg-rose-950 dark:text-rose-300",
    dotClassName: "bg-rose-500",
  },
};

export type StatusKey = keyof typeof statusConfig;

export function StatusBadge({ status }: { status: StatusKey | (string & {}) }) {
  const config = statusConfig[status as StatusKey] || {
    label: status.charAt(0).toUpperCase() + status.slice(1),
    variant: "outline" as const,
    className: "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300",
    dotClassName: "bg-slate-500",
  };

  return (
    <Badge
      variant={config.variant}
      className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold", config.className)}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dotClassName)} />
      {config.label}
    </Badge>
  );
}
