"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Props {
  teacherId: string;
  isActive: boolean;
}

export function TeacherStatusToggle({ teacherId, isActive }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    if (isActive) {
      const confirmed = window.confirm(
        "Are you sure? This will prevent the teacher from signing in."
      );
      if (!confirmed) return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/agency/teachers/${teacherId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to update teacher status.");
        return;
      }

      toast.success(isActive ? "Teacher deactivated." : "Teacher reactivated.");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={isActive ? "destructive" : "outline"}
      size="sm"
      onClick={handleToggle}
      disabled={loading}
    >
      {loading ? "Saving..." : isActive ? "Deactivate Teacher" : "Reactivate Teacher"}
    </Button>
  );
}
