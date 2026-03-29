"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface Request {
  id: string;
  schoolId: string;
  date: string;
  startTime: string;
  endTime: string;
  roleNeeded: string;
  subject: string | null;
  keyStage: string | null;
  status: string;
  isEmergency: boolean;
  createdAt: string | Date;
}

interface ActiveOffer {
  requestId: string;
  teacherFirstName: string;
  teacherLastName: string;
}

interface Props {
  requests: Request[];
  schoolMap: Record<string, { name: string }>;
  offerMap: Record<string, ActiveOffer>;
}

export function RequestsFilter({ requests, schoolMap, offerMap }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    return requests.filter((req) => {
      if (statusFilter !== "all" && req.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const school = schoolMap[req.schoolId];
        const schoolName = school?.name?.toLowerCase() ?? "";
        const role = req.roleNeeded.toLowerCase();
        const subject = req.subject?.toLowerCase() ?? "";
        const keyStage = req.keyStage?.toLowerCase() ?? "";
        if (
          !schoolName.includes(q) &&
          !role.includes(q) &&
          !subject.includes(q) &&
          !keyStage.includes(q) &&
          !req.date.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [requests, search, statusFilter, schoolMap]);

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by school, role, subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="offering">Offering</SelectItem>
            <SelectItem value="filled">Filled</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              No requests match your filters.
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((req) => {
                const school = schoolMap[req.schoolId];
                const offer = offerMap[req.id];
                return (
                  <Link key={req.id} href={`/agency/requests/${req.id}`}>
                    <div className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/50">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{school?.name || "Unknown"}</span>
                          {req.isEmergency && (
                            <Badge variant="destructive" className="text-xs">EMERGENCY</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span className="capitalize">{req.roleNeeded}</span>
                          {req.subject && <span> - {req.subject}</span>}
                          {req.keyStage && <span> ({req.keyStage})</span>}
                          {" "}&middot; {format(new Date(req.date), "EEE d MMM yyyy")} &middot; {req.startTime} - {req.endTime}
                        </div>
                        {offer && (
                          <div className="text-sm text-secondary">
                            Offering to: {offer.teacherFirstName} {offer.teacherLastName}
                          </div>
                        )}
                      </div>
                      <StatusBadge status={req.status} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {requests.length} requests
      </p>
    </>
  );
}
