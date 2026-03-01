"use client";

import { School, FileText, Clock, History } from "lucide-react";
import { ActiveLinkButton } from "@/components/shared/active-link-button";

export function SchoolTopNav() {
  return (
    <nav className="flex flex-wrap items-center gap-1.5">
      <ActiveLinkButton href="/school/dashboard" label="Dashboard" icon={School} />
      <ActiveLinkButton href="/school/requests/new" label="New Request" icon={FileText} />
      <ActiveLinkButton href="/school/requests" label="All Requests" icon={Clock} exact />
      <ActiveLinkButton href="/school/history" label="History" icon={History} />
    </nav>
  );
}
