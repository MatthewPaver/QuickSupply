import { requireSession } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import { Home, Calendar, Briefcase, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TeacherMobileBottomNav } from "@/components/teacher/mobile-bottom-nav";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession("teacher");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:h-16">
          <Link href="/teacher/dashboard" className="flex shrink-0 items-center gap-2">
            <Image src="/desian-logo.svg" alt="Desian" width={100} height={28} className="brightness-0" />
            <span className="hidden text-sm font-semibold text-primary sm:inline">QuickSupply</span>
          </Link>
          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            <Link href="/teacher/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <Home className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link href="/teacher/availability">
              <Button variant="ghost" size="sm" className="gap-2">
                <Calendar className="h-4 w-4" />
                Availability
              </Button>
            </Link>
            <Link href="/teacher/jobs">
              <Button variant="ghost" size="sm" className="gap-2">
                <Briefcase className="h-4 w-4" />
                Jobs
              </Button>
            </Link>
            <Link href="/teacher/profile">
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="h-4 w-4" />
                Profile
              </Button>
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <span className="hidden max-w-[120px] truncate text-sm text-muted-foreground sm:max-w-none md:inline">
              {session.name}
            </span>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="shrink-0">
                <LogOut className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 pb-20 md:py-6 md:pb-6">
        {children}
      </main>
      <TeacherMobileBottomNav />
    </div>
  );
}
