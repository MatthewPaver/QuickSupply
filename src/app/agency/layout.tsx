import { requireSession } from "@/lib/auth";
import Image from "next/image";
import { AgencyMobileNav } from "@/components/agency/agency-mobile-nav";
import { AgencyDesktopNav } from "@/components/agency/agency-desktop-nav";
import { NotificationBell } from "@/components/shared/notification-bell";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { SearchCommand } from "@/components/agency/search-command";

export default async function AgencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession("agent");

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Mobile: top bar with menu */}
      <AgencyMobileNav sessionName={session.name} />
      {/* Desktop: sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r bg-background md:flex">
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <Image src="/desian-logo.svg" alt="Desian" width={80} height={22} className="brightness-0 dark:invert h-6 w-auto" />
          <span className="text-sm font-semibold text-primary">QuickSupply</span>
        </div>
        <AgencyDesktopNav />
        <div className="border-t p-3">
          <div className="mb-2 flex items-center justify-between gap-2 px-2">
            <span className="truncate text-xs font-medium text-muted-foreground">{session.name}</span>
            <SearchCommand />
            <ThemeToggle />
            <NotificationBell />
          </div>
          <SignOutButton variant="ghost" size="sm" className="w-full justify-start gap-2" showLabel />
        </div>
      </aside>
      {/* Main content */}
      <main className="min-h-screen flex-1 overflow-auto bg-muted/[0.24] p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
