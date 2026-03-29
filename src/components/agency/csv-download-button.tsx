"use client";

import { useCallback } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CsvDownloadButtonProps {
  data: Record<string, string | number>[];
  filename: string;
}

function toCsvString(data: Record<string, string | number>[]): string {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers
      .map((h) => {
        const val = String(row[h] ?? "");
        // Escape values containing commas, quotes, or newlines
        if (val.includes(",") || val.includes('"') || val.includes("\n")) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      })
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

export function CsvDownloadButton({ data, filename }: CsvDownloadButtonProps) {
  const handleDownload = useCallback(() => {
    if (data.length === 0) return;

    const csv = toCsvString(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [data, filename]);

  if (data.length === 0) return null;

  return (
    <Button variant="outline" size="sm" onClick={handleDownload}>
      <Download className="h-4 w-4" />
      Download CSV
    </Button>
  );
}
