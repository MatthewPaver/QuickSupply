"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignOutButton({
  variant = "ghost",
  size = "sm",
  className,
  showLabel = false,
  onSignOut,
}: {
  variant?: "ghost" | "outline";
  size?: "sm" | "default" | "lg";
  className?: string;
  showLabel?: boolean;
  onSignOut?: () => void;
}) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await fetch("/api/auth", { method: "DELETE" });
    } finally {
      onSignOut?.();
      router.push("/");
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleSignOut}
      disabled={signingOut}
      aria-label="Sign out"
    >
      {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      {showLabel ? "Sign Out" : null}
    </Button>
  );
}
