"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";

interface Props {
  bookingId: string;
  teacherName: string;
  existingRating?: number | null;
  existingComment?: string | null;
  existingWouldRebook?: boolean | null;
}

export function ReviewForm({ bookingId, teacherName, existingRating, existingComment, existingWouldRebook }: Props) {
  const router = useRouter();
  const [rating, setRating] = useState(existingRating ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [wouldRebook, setWouldRebook] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  if (existingRating != null && existingRating > 0) {
    return (
      <div className="mt-2 flex items-center gap-1 text-sm flex-wrap">
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
        {existingWouldRebook != null && (
          <span className="ml-2 text-xs text-muted-foreground">
            Would rebook: {existingWouldRebook ? "Yes" : "No"}
          </span>
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
        body: JSON.stringify({ bookingId, rating, comment: comment.trim() || null, wouldRebook: wouldRebook ?? false }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        toast.success("Review submitted");
        router.refresh();
      } else {
        toast.error("Failed to submit review. Please try again.");
      }
    } catch {
      toast.error("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2">
      <div className="flex items-center gap-2">
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
      </div>

      {/* Comment textarea */}
      <div className="w-full mt-2">
        <Textarea
          placeholder="Optional comment (max 500 characters)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          rows={3}
          className="resize-none"
        />
        <p className="mt-1 text-xs text-muted-foreground text-right">{comment.length}/500</p>
      </div>

      {/* Would rebook toggle */}
      <div className="mt-2 flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Would rebook?</span>
        <button
          type="button"
          onClick={() => setWouldRebook(true)}
          className={`rounded px-3 py-1 border text-xs font-medium ${wouldRebook === true ? "bg-primary text-primary-foreground border-primary" : "border-input hover:bg-accent"}`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => setWouldRebook(false)}
          className={`rounded px-3 py-1 border text-xs font-medium ${wouldRebook === false ? "bg-destructive text-white border-destructive" : "border-input hover:bg-accent"}`}
        >
          No
        </button>
      </div>

      <Button type="submit" size="sm" disabled={rating < 1 || loading}>
        {loading ? "Saving..." : "Submit"}
      </Button>
    </form>
  );
}
