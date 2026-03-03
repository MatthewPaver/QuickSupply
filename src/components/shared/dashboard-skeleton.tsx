import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Shimmer skeleton matching the dashboard layout: header, stat cards, and a content card.
 * Used by agency, school, and teacher dashboard loading states.
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          <div className="h-9 w-56 animate-pulse rounded bg-muted" />
          <div className="h-4 w-72 max-w-full animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[1, 2, 3, 4].slice(0, 4).map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-4 w-4 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-9 w-16 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="h-6 w-40 animate-pulse rounded bg-muted" />
          <div className="h-9 w-24 animate-pulse rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border bg-muted/30 p-4"
            >
              <div className="flex gap-3">
                <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                <div className="space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-48 animate-pulse rounded bg-muted" />
                </div>
              </div>
              <div className="h-6 w-20 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
