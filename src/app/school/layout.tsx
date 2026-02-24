import { requireSession } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import { School, FileText, Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

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
            <Image src="/desian-logo.svg" alt="Desian" width={80} height={22} className="brightness-0 h-6 w-auto" />
            <span className="hidden text-sm font-semibold text-primary sm:inline">QuickSupply</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            <Link href="/school/dashboard">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs sm:text-sm">
                <School className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link href="/school/requests/new">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs sm:text-sm">
                <FileText className="h-4 w-4" />
                New Request
              </Button>
            </Link>
            <Link href="/school/requests">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs sm:text-sm">
                <Clock className="h-4 w-4" />
                All Requests
              </Button>
            </Link>
          </nav>
          <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
            <span className="max-w-[140px] truncate text-xs text-muted-foreground sm:max-w-none sm:text-sm">
              {session.name}
            </span>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                <LogOut className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 sm:py-6">
        {children}
      </main>
    </div>
  );
}
