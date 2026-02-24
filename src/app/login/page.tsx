"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { School, GraduationCap, LayoutDashboard, Loader2 } from "lucide-react";

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

const roleIcon = {
  school: School,
  teacher: GraduationCap,
  agent: LayoutDashboard,
};

const roleLabel = {
  school: "Schools",
  teacher: "Teachers & TAs",
  agent: "Agency Staff",
};

const roleRedirect = {
  school: "/school/dashboard",
  teacher: "/teacher/dashboard",
  agent: "/agency/dashboard",
};

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

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

  const grouped = {
    school: demoUsers.filter((u) => u.role === "school"),
    teacher: demoUsers.filter((u) => u.role === "teacher"),
    agent: demoUsers.filter((u) => u.role === "agent"),
  };

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
        <p className="text-center text-xs text-muted-foreground sm:text-sm">Click any user below to sign in instantly</p>
      </div>

      <div className="grid w-full max-w-5xl gap-4 sm:gap-6 md:grid-cols-3">
        {(["school", "teacher", "agent"] as const).map((role) => {
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
