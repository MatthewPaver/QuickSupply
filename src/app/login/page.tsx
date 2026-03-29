"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { School, GraduationCap, LayoutDashboard, Loader2, ArrowLeft } from "lucide-react";

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

interface DemoUser {
  id: string;
  name: string;
  role: "school" | "teacher" | "agent";
  subtitle: string;
}

const demoUsers: DemoUser[] = [
  // Schools
  { id: "school-1", name: "St. Mary's Catholic Primary", role: "school", subtitle: "L3 5TF" },
  { id: "school-2", name: "Kensington Primary", role: "school", subtitle: "L7 2RJ" },
  { id: "school-3", name: "Broadgreen International", role: "school", subtitle: "L16 8NQ" },
  // Teachers
  { id: "teacher-1", name: "Sarah Johnson", role: "teacher", subtitle: "Teacher - KS2" },
  { id: "teacher-2", name: "Michael Chen", role: "teacher", subtitle: "TA - EYFS/KS1" },
  { id: "teacher-3", name: "Amira Patel", role: "teacher", subtitle: "Teacher - KS3/KS4" },
  { id: "teacher-4", name: "James O'Brien", role: "teacher", subtitle: "TA - SEN" },
  // Agents
  { id: "agent-1", name: "Sarah Mitchell", role: "agent", subtitle: "Admin" },
  { id: "agent-2", name: "James Powell", role: "agent", subtitle: "Agent" },
];

const allRoles = ["school", "teacher", "agent"] as const;
type Role = (typeof allRoles)[number];

const roleIcon: Record<Role, typeof School> = {
  school: School,
  teacher: GraduationCap,
  agent: LayoutDashboard,
};

const roleLabel: Record<Role, string> = {
  school: "Schools",
  teacher: "Teachers & TAs",
  agent: "Agency Staff",
};

const roleRedirect: Record<Role, string> = {
  school: "/school/dashboard",
  teacher: "/teacher/dashboard",
  agent: "/agency/dashboard",
};

const roleSubtitle: Record<Role, string> = {
  school: "Sign in as a school",
  teacher: "Sign in as a teacher or TA",
  agent: "Sign in as agency staff",
};

function EmailPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.role) {
        const path = roleRedirect[data.role as Role] ?? "/";
        router.push(path);
        return;
      }
      setError(data?.error ?? "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Sign in</CardTitle>
        <CardDescription className="text-xs">Enter your email and password</CardDescription>
      </CardHeader>
      <CardContent>
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
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Sign in
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            <Link href="/forgot-password" className="underline hover:text-primary">Forgot password?</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);

  const portalParam = searchParams.get("portal");
  const isFiltered = portalParam !== null && allRoles.includes(portalParam as Role);
  const visibleRoles: readonly Role[] = isFiltered ? [portalParam as Role] : allRoles;

  async function handleQuickLogin(user: DemoUser) {
    setLoading(user.id);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          role: user.role,
          name: user.name,
        }),
      });
      if (res.ok) {
        router.push(roleRedirect[user.role]);
      }
    } finally {
      setLoading(null);
    }
  }

  const grouped: Record<Role, DemoUser[]> = {
    school: demoUsers.filter((u) => u.role === "school"),
    teacher: demoUsers.filter((u) => u.role === "teacher"),
    agent: demoUsers.filter((u) => u.role === "agent"),
  };

  if (!isDemoMode) {
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
          <p className="text-center text-xs text-muted-foreground sm:text-sm">Sign in to your account</p>
        </div>
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
        </div>
        <EmailPasswordForm />
      </div>
    );
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
        <h1 className="text-xl font-bold text-primary sm:text-2xl">QuickSupply Demo</h1>
        <p className="text-center text-xs text-muted-foreground sm:text-sm">
          {isFiltered ? roleSubtitle[portalParam as Role] : "Click any user below to sign in instantly"}
        </p>
      </div>

      {isFiltered && (
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to portals
          </Link>
        </div>
      )}

      <div className={isFiltered ? "w-full max-w-sm" : "grid w-full max-w-5xl gap-4 sm:gap-6 md:grid-cols-3"}>
        {visibleRoles.map((role) => {
          const Icon = roleIcon[role];
          return (
            <Card key={role}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{roleLabel[role]}</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Click to sign in as this user
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {grouped[role].map((user) => (
                  <Button
                    key={user.id}
                    variant="outline"
                    className="h-auto min-h-[44px] justify-start px-3 py-2.5 text-left sm:min-h-0"
                    disabled={loading !== null}
                    onClick={() => handleQuickLogin(user)}
                  >
                    {loading === user.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <div className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.subtitle}</span>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
