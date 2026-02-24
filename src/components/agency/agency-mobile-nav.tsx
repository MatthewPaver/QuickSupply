"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { agencyNavItems } from "@/app/agency/nav-config";

interface AgencyMobileNavProps {
  sessionName: string;
}

/**
 * Mobile menu for agency: hamburger opens a sheet with nav links. Shown only on md and below.
 */
export function AgencyMobileNav({ sessionName }: AgencyMobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-14 items-center justify-between gap-2 border-b bg-background px-4 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0" showCloseButton={true}>
          <div className="flex h-16 items-center gap-2 border-b px-4">
            <Image src="/desian-logo.svg" alt="Desian" width={72} height={20} className="brightness-0 h-5 w-auto" />
            <span className="text-sm font-semibold text-primary">QuickSupply</span>
          </div>
          <nav className="flex flex-1 flex-col gap-1 p-3">
            {agencyNavItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-2" size="sm">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
          <div className="border-t p-3">
            <p className="mb-2 truncate px-2 text-xs text-muted-foreground">{sessionName}</p>
            <Link href="/login" onClick={() => setOpen(false)}>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </Link>
          </div>
        </SheetContent>
      </Sheet>
      <Link href="/agency/dashboard" className="flex items-center gap-2">
        <Image src="/desian-logo.svg" alt="Desian" width={72} height={20} className="brightness-0 h-5 w-auto" />
        <span className="text-sm font-semibold text-primary">QuickSupply</span>
      </Link>
      <div className="w-10" />
    </div>
  );
}
