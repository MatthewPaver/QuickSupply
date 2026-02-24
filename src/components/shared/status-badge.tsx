import { Badge } from "@/components/ui/badge";

const statusConfig = {
  pending: { label: "Pending", variant: "outline" as const, className: "border-amber-300 bg-amber-50 text-amber-700" },
  offering: { label: "Offering", variant: "outline" as const, className: "border-blue-300 bg-blue-50 text-blue-700 animate-pulse" },
  filled: { label: "Filled", variant: "outline" as const, className: "border-green-300 bg-green-50 text-green-700" },
  cancelled: { label: "Cancelled", variant: "outline" as const, className: "border-red-300 bg-red-50 text-red-700" },
  // Offer statuses
  accepted: { label: "Accepted", variant: "outline" as const, className: "border-green-300 bg-green-50 text-green-700" },
  declined: { label: "Declined", variant: "outline" as const, className: "border-red-300 bg-red-50 text-red-700" },
  expired: { label: "Expired", variant: "outline" as const, className: "border-gray-300 bg-gray-50 text-gray-700" },
  withdrawn: { label: "Withdrawn", variant: "outline" as const, className: "border-gray-300 bg-gray-50 text-gray-700" },
  // Compliance
  compliant: { label: "Compliant", variant: "outline" as const, className: "border-green-300 bg-green-50 text-green-700" },
  "pending-compliance": { label: "Pending", variant: "outline" as const, className: "border-amber-300 bg-amber-50 text-amber-700" },
  "expired-compliance": { label: "Expired", variant: "outline" as const, className: "border-red-300 bg-red-50 text-red-700" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    variant: "outline" as const,
    className: "",
  };

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}
