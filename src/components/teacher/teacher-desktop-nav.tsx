"use client";

import { Home, Calendar, Briefcase, User } from "lucide-react";
import { ActiveLinkButton } from "@/components/shared/active-link-button";

export function TeacherDesktopNav() {
  return (
    <nav className="hidden items-center gap-1.5 md:flex">
      <ActiveLinkButton href="/teacher/dashboard" label="Dashboard" icon={Home} />
      <ActiveLinkButton href="/teacher/availability" label="Availability" icon={Calendar} />
      <ActiveLinkButton href="/teacher/jobs" label="Jobs" icon={Briefcase} />
      <ActiveLinkButton href="/teacher/profile" label="Profile" icon={User} />
    </nav>
  );
}
