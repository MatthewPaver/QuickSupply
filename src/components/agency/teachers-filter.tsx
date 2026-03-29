"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { TeacherRow } from "@/components/agency/teacher-row";
import { BulkTeacherActions } from "@/components/agency/bulk-teacher-actions";
import { Search } from "lucide-react";

type Teacher = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  postcode: string;
  roleType: string;
  agencyRating: number;
  canDrive: boolean;
  emergencyAvailable: boolean;
  complianceStatus: "compliant" | "pending" | "expired";
  isActive: boolean;
};

interface Props {
  teachers: Teacher[];
}

export function TeachersFilter({ teachers }: Props) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [complianceFilter, setComplianceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filtered = useMemo(() => {
    return teachers.filter((t) => {
      if (roleFilter !== "all" && t.roleType !== roleFilter) return false;
      if (complianceFilter !== "all" && t.complianceStatus !== complianceFilter) return false;
      if (statusFilter === "active" && !t.isActive) return false;
      if (statusFilter === "inactive" && t.isActive) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = `${t.firstName} ${t.lastName}`.toLowerCase();
        const postcode = t.postcode.toLowerCase();
        if (!name.includes(q) && !postcode.includes(q)) return false;
      }
      return true;
    });
  }, [teachers, search, roleFilter, complianceFilter, statusFilter]);

  const filteredIds = useMemo(() => new Set(filtered.map((t) => t.id)), [filtered]);
  const visibleSelectedIds = selectedIds.filter((id) => filteredIds.has(id));
  const allVisibleSelected = filtered.length > 0 && visibleSelectedIds.length === filtered.length;

  function toggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      setSelectedIds((prev) => {
        const existing = new Set(prev);
        for (const t of filtered) existing.add(t.id);
        return Array.from(existing);
      });
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or postcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="teacher">Teacher</SelectItem>
            <SelectItem value="ta">TA</SelectItem>
            <SelectItem value="both">Both</SelectItem>
          </SelectContent>
        </Select>
        <Select value={complianceFilter} onValueChange={setComplianceFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Compliance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All compliance</SelectItem>
            <SelectItem value="compliant">Compliant</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All teachers</SelectItem>
            <SelectItem value="active">Active only</SelectItem>
            <SelectItem value="inactive">Inactive only</SelectItem>
          </SelectContent>
        </Select>
        <BulkTeacherActions selectedIds={visibleSelectedIds} teachers={teachers} />
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              No teachers match your filters.
            </div>
          ) : (
            <div className="divide-y">
              {/* Select-all header */}
              <div className="flex items-center gap-3 px-6 py-2 bg-muted/30">
                <Checkbox
                  checked={allVisibleSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all visible teachers"
                />
                <span className="text-xs text-muted-foreground">
                  {visibleSelectedIds.length > 0
                    ? `${visibleSelectedIds.length} selected`
                    : "Select all"}
                </span>
              </div>
              {filtered.map((t) => (
                <div key={t.id} className="flex items-center">
                  <div className="pl-6 flex items-center">
                    <Checkbox
                      checked={selectedIds.includes(t.id)}
                      onCheckedChange={() => toggleSelect(t.id)}
                      aria-label={`Select ${t.firstName} ${t.lastName}`}
                    />
                  </div>
                  <div className="flex-1">
                    <TeacherRow t={t} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {teachers.length} teachers
      </p>
    </>
  );
}
