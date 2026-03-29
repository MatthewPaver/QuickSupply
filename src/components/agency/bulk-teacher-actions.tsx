"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Download, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

type Teacher = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roleType: string;
  complianceStatus: "compliant" | "pending" | "expired";
};

interface Props {
  selectedIds: string[];
  teachers: Teacher[];
}

export function BulkTeacherActions({ selectedIds, teachers }: Props) {
  const selectedTeachers = teachers.filter((t) => selectedIds.includes(t.id));

  function handleSendMessage() {
    toast.info("Send Message is coming soon.");
  }

  function handleExportCsv() {
    if (selectedTeachers.length === 0) return;

    const header = "Name,Email,Phone,Role,Compliance Status";
    const rows = selectedTeachers.map((t) =>
      [
        `${t.firstName} ${t.lastName}`,
        t.email,
        t.phone,
        t.roleType,
        t.complianceStatus,
      ]
        .map((v) => `"${v.replace(/"/g, '""')}"`)
        .join(","),
    );

    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `teachers-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${selectedTeachers.length} teachers to CSV.`);
  }

  async function handleUpdateCompliance() {
    toast.info("Batch compliance update is coming soon.");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={selectedIds.length === 0}>
          Bulk Actions ({selectedIds.length})
          <ChevronDown className="ml-1 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={handleSendMessage}>
          <Mail className="mr-2 h-4 w-4" />
          Send Message
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleExportCsv}>
          <Download className="mr-2 h-4 w-4" />
          Export Selected
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleUpdateCompliance}>
          <ShieldCheck className="mr-2 h-4 w-4" />
          Update Compliance Status
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
