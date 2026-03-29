import { requireSession } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import { NotificationBell } from "@/components/shared/notification-bell";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { SchoolTopNav } from "@/components/school/school-top-nav";

export default async function SchoolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession("school");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:h-16 sm:flex-nowrap sm:py-0">
          <Link href="/school/dashboard" className="flex shrink-0 items-center gap-2">
            <Image src="/desian-logo.svg" alt="Desian" width={80} height={22} className="brightness-0 dark:invert h-6 w-auto" />
            <span className="hidden text-sm font-semibold text-primary sm:inline">QuickSupply</span>
          </Link>
          <SchoolTopNav />
          <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
            <ThemeToggle />
            <NotificationBell />
            <span className="max-w-[140px] truncate text-xs font-medium text-muted-foreground sm:max-w-none sm:text-sm">
              {session.name}
            </span>
            <SignOutButton variant="ghost" size="sm" />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 sm:py-6">
        {children}
      </main>
    </div>
  );
}
