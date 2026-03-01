"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ActiveLinkButtonProps {
  href: string;
  label: string;
  icon: LucideIcon;
  size?: "default" | "sm" | "lg" | "icon";
  exact?: boolean;
  className?: string;
  onClick?: () => void;
}

export function ActiveLinkButton({
  href,
  label,
  icon: Icon,
  size = "sm",
  exact = false,
  className,
  onClick,
}: ActiveLinkButtonProps) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Button
      asChild
      variant="ghost"
      size={size}
      className={cn(
        "gap-2 rounded-md transition-all",
        isActive
          ? "bg-primary/10 text-primary shadow-sm hover:bg-primary/15"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        className
      )}
    >
      <Link href={href} onClick={onClick} aria-current={isActive ? "page" : undefined}>
        <Icon className={cn("h-4 w-4", isActive && "text-primary")} />
        {label}
      </Link>
    </Button>
  );
}
