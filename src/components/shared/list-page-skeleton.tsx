import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Shimmer skeleton for list/table-style pages (e.g. requests, teachers, jobs).
 */
export function ListPageSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-10 w-28 animate-pulse rounded-md bg-muted" />
      </div>
      <Card>
        <CardHeader>
          <div className="h-6 w-36 animate-pulse rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border bg-muted/30 p-3"
            >
              <div className="flex gap-3">
                <div className="h-9 w-9 animate-pulse rounded bg-muted" />
                <div className="space-y-1">
                  <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                </div>
              </div>
              <div className="h-6 w-16 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
