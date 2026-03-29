"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSent(true);
      } else {
        setError(data?.error ?? "Something went wrong. Please try again.");
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
        <p className="text-center text-xs text-muted-foreground sm:text-sm">Reset your password</p>
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
          <CardTitle className="text-lg">Forgot password</CardTitle>
          <CardDescription className="text-xs">
            Enter your email and we&apos;ll send you a link to set a new password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <p className="text-sm text-muted-foreground">
              If that email is registered, you will receive a reset link shortly. Check your inbox and spam folder.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send reset link
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
