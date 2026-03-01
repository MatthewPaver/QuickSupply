"use client";

import { agencyNavItems } from "@/app/agency/nav-config";
import { ActiveLinkButton } from "@/components/shared/active-link-button";

export function AgencyDesktopNav() {
  return (
    <nav className="flex flex-1 flex-col gap-1.5 p-3">
      <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
        Operations
      </p>
      {agencyNavItems.map((item) => (
        <ActiveLinkButton
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          className="w-full justify-start"
        />
      ))}
    </nav>
  );
}
