import { requireSession } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { agencyNavItems } from "@/app/agency/nav-config";
import { AgencyMobileNav } from "@/components/agency/agency-mobile-nav";
import { NotificationBell } from "@/components/shared/notification-bell";

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
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-background md:flex">
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <Image src="/desian-logo.svg" alt="Desian" width={80} height={22} className="brightness-0 h-6 w-auto" />
          <span className="text-sm font-semibold text-primary">QuickSupply</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {agencyNavItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button variant="ghost" className="w-full justify-start gap-2" size="sm">
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>
        <div className="border-t p-3">
          <div className="mb-2 flex items-center justify-between gap-2 px-2">
            <span className="text-xs text-muted-foreground truncate">{session.name}</span>
            <NotificationBell />
          </div>
          <Link href="/login">
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </Link>
        </div>
      </aside>
      {/* Main content */}
      <main className="min-h-screen flex-1 overflow-auto bg-muted/30 p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
