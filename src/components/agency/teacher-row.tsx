"use client";

import { useRouter } from "next/navigation";
import { Star, Car, Phone, MapPin } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";

/** Teacher row for agency list: row navigates to profile; phone link is separate to avoid nested <a>. */
type Teacher = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  postcode: string;
  roleType: string;
  agencyRating: number;
  canDrive: boolean;
  emergencyAvailable: boolean;
  complianceStatus: "compliant" | "pending" | "expired";
  isActive: boolean;
};

export function TeacherRow({ t }: { t: Teacher }) {
  const router = useRouter();

  return (
    <div
      role="button"
      tabIndex={0}
      className={`flex cursor-pointer items-center justify-between px-6 py-4 transition-colors hover:bg-muted/50 ${!t.isActive ? "opacity-50" : ""}`}
      onClick={() => router.push(`/agency/teachers/${t.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(`/agency/teachers/${t.id}`);
        }
      }}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {t.firstName[0]}
          {t.lastName[0]}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              {t.firstName} {t.lastName}
            </span>
            <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-medium capitalize text-muted-foreground">
              {t.roleType}
            </span>
            {!t.isActive && (
              <span className="rounded bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-600">
                Inactive
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 text-amber-500" /> {t.agencyRating.toFixed(1)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {t.postcode}
            </span>
            {t.canDrive && (
              <span className="flex items-center gap-1">
                <Car className="h-3 w-3" /> Drives
              </span>
            )}
            {t.emergencyAvailable && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600">Emergency OK</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
        <a
          href={`tel:${t.phone}`}
          aria-label={`Call ${t.firstName} ${t.lastName}`}
          className="rounded-md p-1 text-primary transition-colors hover:bg-primary/10"
        >
          <Phone className="h-4 w-4" />
        </a>
        <StatusBadge
          status={
            t.complianceStatus === "compliant"
              ? "compliant"
              : t.complianceStatus === "pending"
                ? "pending-compliance"
                : "expired-compliance"
          }
        />
      </div>
    </div>
  );
}
