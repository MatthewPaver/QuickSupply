"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Briefcase, User } from "lucide-react";

const items = [
  { href: "/teacher/dashboard", label: "Dashboard", icon: Home },
  { href: "/teacher/jobs", label: "Jobs", icon: Briefcase },
  { href: "/teacher/availability", label: "Availability", icon: Calendar },
  { href: "/teacher/profile", label: "Profile", icon: User },
];

/**
 * Fixed bottom navigation for teacher portal on small screens. Hidden on md+.
 */
export function TeacherMobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden"
      aria-label="Primary"
    >
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex min-h-[48px] min-w-0 flex-col items-center justify-center gap-1 rounded-md px-3 py-2 text-xs transition-all touch-manipulation ${
              isActive
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            }`}
          >
            {isActive && (
              <span className="absolute -top-[1px] h-[2px] w-10 rounded-full bg-primary" />
            )}
            <Icon className={`h-5 w-5 shrink-0 transition-transform ${isActive ? "scale-105" : ""}`} aria-hidden />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
