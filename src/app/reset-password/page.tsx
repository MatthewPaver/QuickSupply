"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") ?? "";
  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!token.trim()) {
      setError("Reset link is invalid or missing. Use the link from your email.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data?.error ?? "Something went wrong. Please request a new reset link.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 px-4 py-6 sm:py-8">
      <div className="mb-6 flex flex-col items-center gap-2 sm:mb-8 sm:gap-3">
        <Image
          src="/desian-logo.svg"
          alt="Desian Education"
          width={100}
          height={27}
          className="brightness-0 h-7 w-auto max-w-[100px] sm:h-8 sm:max-w-[112px]"
          priority
        />
        <h1 className="text-xl font-bold text-primary sm:text-2xl">QuickSupply</h1>
        <p className="text-center text-xs text-muted-foreground sm:text-sm">Set a new password</p>
      </div>
      <div className="mb-4">
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">New password</CardTitle>
          <CardDescription className="text-xs">
            Enter your new password below. Use at least 8 characters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <p className="text-sm text-muted-foreground">
              Password updated. You can now{" "}
              <Link href="/login" className="underline text-primary font-medium">sign in</Link>.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!tokenFromUrl && (
                <div className="space-y-2">
                  <Label htmlFor="token">Reset token</Label>
                  <Input
                    id="token"
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Paste the token from your email"
                    className="w-full font-mono text-xs"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Update password
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
