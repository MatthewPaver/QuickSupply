"use client";

import { useState, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { format } from "date-fns";

interface LogEntry {
  at: string;
  message: string;
}

export function SmsLogDrawer() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<LogEntry[]>([]);

  useEffect(() => {
    if (open) {
      fetch("/api/agency/sms-log", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setEntries(Array.isArray(data) ? data : []))
        .catch(() => setEntries([]));
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <MessageSquare className="h-4 w-4" />
          SMS log
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>SMS log (simulated)</SheetTitle>
        </SheetHeader>
        <p className="text-sm text-muted-foreground mt-1">
          Messages that would have been sent to teachers.
        </p>
        <div className="mt-4 space-y-2 max-h-[70vh] overflow-y-auto">
          {entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            entries.map((e, i) => (
              <div key={i} className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                <div className="text-muted-foreground text-xs">
                  {format(new Date(e.at), "d MMM yyyy, HH:mm")}
                </div>
                <div className="font-medium mt-0.5">{e.message}</div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
