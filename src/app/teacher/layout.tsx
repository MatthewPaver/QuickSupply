import { requireSession } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { TeacherMobileBottomNav } from "@/components/teacher/mobile-bottom-nav";
import { TeacherDesktopNav } from "@/components/teacher/teacher-desktop-nav";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { NotificationBell } from "@/components/shared/notification-bell";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { ThemeToggle } from "@/components/shared/theme-toggle";

/** Async: resolves session then renders header right (name + logout). */
async function TeacherAuthHeader() {
  const session = await requireSession("teacher");
  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-[120px] truncate text-sm text-muted-foreground sm:max-w-none md:inline">
        {session.name}
      </span>
      <SignOutButton variant="ghost" size="sm" className="shrink-0" />
    </div>
  );
}

/** Async: resolves session then renders children (keeps main in sync layout to avoid hydration mismatch). */
async function TeacherAuthContent({ children }: { children: React.ReactNode }) {
  await requireSession("teacher");
  return <>{children}</>;
}

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:h-16">
          <Link href="/teacher/dashboard" className="flex shrink-0 items-center gap-2">
            <Image src="/desian-logo.svg" alt="Desian" width={80} height={22} className="brightness-0 dark:invert h-6 w-auto" />
            <span className="hidden text-sm font-semibold text-primary sm:inline">QuickSupply</span>
          </Link>
          <TeacherDesktopNav />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
            <Suspense fallback={<span className="text-muted-foreground">...</span>}>
              <TeacherAuthHeader />
            </Suspense>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 pb-20 md:py-6 md:pb-6">
        <Suspense fallback={<PageSkeleton />}>
          <TeacherAuthContent>{children}</TeacherAuthContent>
        </Suspense>
      </main>
      <TeacherMobileBottomNav />
    </div>
  );
}
