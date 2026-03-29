"use client";

import Link from "next/link";
import { FileText, Briefcase, Inbox, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";

const emptyStateIcons = {
  "file-text": FileText,
  briefcase: Briefcase,
  inbox: Inbox,
  "clipboard-list": ClipboardList,
} as const;

export type EmptyStateIconName = keyof typeof emptyStateIcons;

interface EmptyStateProps {
  /** Icon name (serialisable) so Server Components can use this without passing a component. */
  icon: EmptyStateIconName;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * Reusable empty state for lists and sections. Uses Desian primary for icon tint.
 */
export function EmptyState({
  icon: iconName,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className = "",
}: EmptyStateProps) {
  const Icon = emptyStateIcons[iconName];
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 py-10 px-6 text-center ${className}`}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {(actionLabel && (actionHref || onAction)) && (
        <div className="mt-4">
          {actionHref ? (
            <Button asChild size="sm">
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          ) : (
            <Button size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
