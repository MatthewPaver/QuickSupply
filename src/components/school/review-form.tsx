"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

interface Props {
  bookingId: string;
  teacherName: string;
  existingRating?: number | null;
  existingComment?: string | null;
}

export function ReviewForm({ bookingId, teacherName, existingRating, existingComment }: Props) {
  const router = useRouter();
  const [rating, setRating] = useState(existingRating ?? 0);
  const [hover, setHover] = useState(0);
  const [loading, setLoading] = useState(false);

  if (existingRating != null && existingRating > 0) {
    return (
      <div className="mt-2 flex items-center gap-1 text-sm">
        <span className="text-muted-foreground">Your rating:</span>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i <= existingRating ? "fill-amber-400 text-amber-400" : "text-muted"}`}
          />
        ))}
        {existingComment && (
          <span className="ml-2 text-muted-foreground">&ldquo;{existingComment}&rdquo;</span>
        )}
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) return;
    setLoading(true);
    try {
      const res = await fetch("/api/school/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, rating }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Rate {teacherName}:</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            className="p-0.5"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(i)}
            aria-label={`${i} star${i > 1 ? "s" : ""}`}
          >
            <Star
              className={`h-5 w-5 ${
                i <= (hover || rating) ? "fill-amber-400 text-amber-400" : "text-muted"
              }`}
            />
          </button>
        ))}
      </div>
      <Button type="submit" size="sm" disabled={rating < 1 || loading}>
        {loading ? "Saving..." : "Submit"}
      </Button>
    </form>
  );
}
