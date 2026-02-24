import Image from "next/image";
import Link from "next/link";
import { School, GraduationCap, LayoutDashboard } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const portals = [
  {
    title: "School Portal",
    description: "Submit cover requests, track status, and request preferred teachers.",
    icon: School,
    href: "/school/dashboard",
    color: "bg-primary",
  },
  {
    title: "Teacher Portal",
    description: "Manage availability, receive job offers, and accept assignments.",
    icon: GraduationCap,
    href: "/teacher/dashboard",
    color: "bg-desian-blue",
  },
  {
    title: "Agency Dashboard",
    description: "Manage all requests, assign teachers, and oversee operations.",
    icon: LayoutDashboard,
    href: "/agency/dashboard",
    color: "bg-primary",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 px-4 py-8 sm:py-12">
      <div className="mb-8 flex flex-col items-center gap-3 sm:mb-12 sm:gap-4">
        <Image
          src="/desian-logo.svg"
          alt="Desian Education"
          width={112}
          height={30}
          className="brightness-0 h-8 w-auto max-w-[112px] sm:h-9 sm:max-w-[128px]"
          priority
        />
        <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
          QuickSupply
        </h1>
        <p className="max-w-md text-center text-sm text-muted-foreground sm:text-base">
          Supply teaching workforce scheduling. Fast assignment, real-time tracking, seamless communication.
        </p>
      </div>

      <div className="grid w-full max-w-4xl gap-4 sm:gap-6 md:grid-cols-3">
        {portals.map((portal) => (
          <Link key={portal.title} href={portal.href} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl">
            <Card className="group h-full cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/30">
              <CardHeader className="pb-3">
                <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-lg sm:h-12 sm:w-12 ${portal.color} text-white`}>
                  <portal.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <CardTitle className="text-base group-hover:text-primary transition-colors sm:text-lg">
                  {portal.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs sm:text-sm">
                  {portal.description}
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 text-center sm:mt-12">
        <Link
          href="/login"
          className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
        >
          Sign in with credentials &rarr;
        </Link>
      </div>

      <footer className="mt-12 text-center text-xs text-muted-foreground sm:mt-16">
        &copy; {new Date().getFullYear()} Desian Education &middot; QuickSupply Demo
      </footer>
    </div>
  );
}
