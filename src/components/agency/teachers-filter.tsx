"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { TeacherRow } from "@/components/agency/teacher-row";
import { Search } from "lucide-react";

type Teacher = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  postcode: string;
  roleType: string;
  agencyRating: number;
  canDrive: boolean;
  emergencyAvailable: boolean;
  complianceStatus: "compliant" | "pending" | "expired";
};

interface Props {
  teachers: Teacher[];
}

export function TeachersFilter({ teachers }: Props) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [complianceFilter, setComplianceFilter] = useState("all");

  const filtered = useMemo(() => {
    return teachers.filter((t) => {
      if (roleFilter !== "all" && t.roleType !== roleFilter) return false;
      if (complianceFilter !== "all" && t.complianceStatus !== complianceFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = `${t.firstName} ${t.lastName}`.toLowerCase();
        const postcode = t.postcode.toLowerCase();
        if (!name.includes(q) && !postcode.includes(q)) return false;
      }
      return true;
    });
  }, [teachers, search, roleFilter, complianceFilter]);

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row">
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
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              No teachers match your filters.
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((t) => (
                <TeacherRow key={t.id} t={t} />
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
