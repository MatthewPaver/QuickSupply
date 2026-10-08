import Link from "next/link";
import {
  School,
  Users,
  BarChart3,
  GraduationCap,
  LayoutDashboard,
  Radio,
  ListOrdered,
  ShieldCheck,
  PoundSterling,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const features = [
  {
    title: "Schools",
    description:
      "Log a cover request with the date, times, role and year group. See which teacher is being asked, who accepted, and rate them afterwards.",
    icon: School,
  },
  {
    title: "Teachers and TAs",
    description:
      "Get one offer at a time with a reply deadline and accept or decline it. Set the days you can work and submit a timesheet after each booking.",
    icon: Users,
  },
  {
    title: "Agency staff",
    description:
      "Work each request from a ranked list of eligible teachers. Check DBS and right-to-work documents, approve timesheets and raise invoices.",
    icon: BarChart3,
  },
] as const;

const steps = [
  { number: 1, text: "The school logs a cover request." },
  { number: 2, text: "Teachers who fail an eligibility check drop out. The rest are ranked." },
  { number: 3, text: "The top teacher gets an offer with a deadline. A decline or no reply moves it to the next." },
  { number: 4, text: "A teacher accepts and the school, agency and teacher all see the booking." },
] as const;

const stats = [
  { label: "Status updates pushed to each portal as they happen", icon: Radio },
  { label: "Role, compliance, availability and distance checks before each offer", icon: ListOrdered },
  { label: "DBS and right-to-work documents with expiry dates", icon: ShieldCheck },
  { label: "Timesheets, pay rates and invoices", icon: PoundSterling },
] as const;

const portals = [
  {
    title: "School portal",
    description:
      "Log cover requests, see who has been offered the day, and review the teacher after a booking.",
    icon: School,
    href: "/login?portal=school",
    accent: "bg-primary",
  },
  {
    title: "Teacher portal",
    description:
      "Reply to offers, set the days you can work and submit timesheets.",
    icon: GraduationCap,
    href: "/login?portal=teacher",
    accent: "bg-desian-blue",
  },
  {
    title: "Agency portal",
    description:
      "Send offers for each request, keep teacher and school records, and raise invoices.",
    icon: LayoutDashboard,
    href: "/login?portal=agent",
    accent: "bg-primary",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col">
      <section className="relative flex flex-col items-center justify-center overflow-hidden px-4 pb-20 pt-24 sm:pb-28 sm:pt-32 md:pb-32 md:pt-40">
        {/* gradient backdrop */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-desian-blue/5 to-accent/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl"
        />

        <div className="qs-enter relative z-10 flex max-w-3xl flex-col items-center text-center">
          <Badge variant="secondary" className="mb-6">
            Case study with fictional data
          </Badge>

          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Book supply cover{" "}
            <span className="text-primary">for a school day</span>
          </h1>

          <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg md:text-xl">
            A school logs an absence. The agency offers the day to one eligible
            teacher at a time, and the school, agency and teacher all see the
            same status until someone accepts. Every school and person in this
            demo is made up.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Button asChild size="lg" className="text-base">
              <Link href="/login">
                Try the demo
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base">
              <a href="#how-it-works">
                How it works
                <ChevronDown className="ml-1 size-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Features Grid ────────────────────────────────────────── */}
      <section
        id="features"
        className="scroll-mt-16 bg-muted/30 px-4 py-16 sm:py-20 md:py-24"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Who uses it
            </h2>
            <p className="mt-3 text-muted-foreground">
              Each role signs in to its own view of the same requests.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card
                key={f.title}
                className="qs-pop border-border/60 bg-card transition-shadow hover:shadow-md"
              >
                <CardHeader>
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <f.icon className="size-5" />
                  </div>
                  <CardTitle className="text-lg">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {f.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────── */}
      <section id="how-it-works" className="scroll-mt-16 px-4 py-16 sm:py-20 md:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              How a request gets filled
            </h2>
            <p className="mt-3 text-muted-foreground">
              What happens after a school logs an absence.
            </p>
          </div>

          <div className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* connecting line (desktop) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-0 right-0 top-8 hidden h-0.5 bg-gradient-to-r from-primary/20 via-desian-blue/20 to-primary/20 lg:block"
            />

            {steps.map((step) => (
              <div key={step.number} className="relative flex flex-col items-center text-center">
                <div className="relative z-10 mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-background text-2xl font-bold text-primary shadow-sm">
                  {step.number}
                </div>
                <p className="text-sm font-medium text-foreground sm:text-base">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────── */}
      <section className="bg-primary px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-xl font-semibold text-primary-foreground sm:text-2xl">
            What the demo covers
          </h2>

          <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col items-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-foreground/15 text-primary-foreground">
                  <s.icon className="size-6" />
                </div>
                <p className="text-sm font-medium leading-snug text-primary-foreground/90">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Portal Cards ─────────────────────────────────────────── */}
      <section className="px-4 py-16 sm:py-20 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Pick a role
            </h2>
            <p className="mt-3 text-muted-foreground">
              Each card opens the sign-in page for that role.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {portals.map((portal) => (
              <Link
                key={portal.title}
                href={portal.href}
                className="group rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <Card className="qs-pop flex h-full flex-col transition-all hover:-translate-y-1 hover:shadow-lg hover:border-primary/30">
                  <CardHeader className="pb-3">
                    <div
                      className={`mb-3 flex h-12 w-12 items-center justify-center rounded-lg ${portal.accent} text-white`}
                    >
                      <portal.icon className="size-6" />
                    </div>
                    <CardTitle className="text-lg transition-colors group-hover:text-primary">
                      {portal.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col">
                    <CardDescription className="mb-5 flex-1 text-sm leading-relaxed">
                      {portal.description}
                    </CardDescription>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      Sign in
                      <ArrowRight className="size-4" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      </main>
      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-muted/30 px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-sm font-medium text-foreground">
            QuickSupply{" "}
            <span className="font-normal text-muted-foreground">
              by Desian Education
            </span>
          </p>

          <nav className="flex gap-5 text-sm text-muted-foreground" aria-label="Footer">
            <Link
              href="/privacy"
              className="transition-colors hover:text-foreground"
            >
              Privacy Policy
            </Link>
            <Link
              href="/login"
              className="transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
          </nav>

          <p className="text-xs text-muted-foreground">
            Demo only. All schools and people are fictional.
          </p>
        </div>
      </footer>
    </div>
  );
}
