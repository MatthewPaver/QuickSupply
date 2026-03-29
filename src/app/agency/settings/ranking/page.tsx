"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

interface RankingWeights {
  preferred: number;
  rating: number;
  review: number;
  distance: number;
  drive: number;
  familiarity: number;
  subjectMatch: number;
}

const WEIGHT_DESCRIPTIONS: Record<keyof RankingWeights, string> = {
  preferred: "Bonus points when a school requests a specific teacher",
  rating: "Multiplied by the teacher's agency rating (0-5)",
  review: "Multiplied by the school's average review score for this teacher (0-5)",
  distance: "Max points for proximity — closer teachers score higher",
  drive: "Bonus points if the teacher can drive to the school",
  familiarity: "Bonus if the teacher has previously worked at this school",
  subjectMatch: "Bonus if the teacher's subject specializations match the request",
};

const WEIGHT_LABELS: Record<keyof RankingWeights, string> = {
  preferred: "Preferred Teacher Bonus",
  rating: "Agency Rating Weight",
  review: "School Review Weight",
  distance: "Distance Score (max)",
  drive: "Can Drive Bonus",
  familiarity: "School Familiarity Bonus",
  subjectMatch: "Subject Match Bonus",
};

export default function RankingWeightsPage() {
  const [weights, setWeights] = useState<RankingWeights>({
    preferred: 200,
    rating: 20,
    review: 10,
    distance: 30,
    drive: 25,
    familiarity: 15,
    subjectMatch: 30,
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetch("/api/agency/settings/ranking-weights", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.weights) setWeights(data.weights);
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  function setWeight(key: keyof RankingWeights, value: number) {
    setWeights((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch("/api/agency/settings/ranking-weights", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(weights),
      });
      if (res.ok) {
        toast.success("Ranking weights saved");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || "Failed to save ranking weights");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const weightKeys: (keyof RankingWeights)[] = [
    "preferred",
    "rating",
    "review",
    "distance",
    "drive",
    "familiarity",
    "subjectMatch",
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link href="/agency/settings" className="hover:underline">Settings</Link>
          <span>/</span>
          <span>Ranking Weights</span>
        </div>
        <h1 className="text-2xl font-bold">Ranking Weights</h1>
        <p className="text-muted-foreground">
          Configure how teachers are scored and ranked when matching them to cover requests.
          Higher weights mean that factor has more influence on the final ranking.
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <SlidersHorizontal className="h-4 w-4" />
            Weight Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {fetching ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {weightKeys.map((key) => (
                <div key={key} className="space-y-1.5">
                  <Label htmlFor={key}>{WEIGHT_LABELS[key]}</Label>
                  <Input
                    id={key}
                    type="number"
                    min={0}
                    max={1000}
                    value={weights[key]}
                    onChange={(e) => setWeight(key, Number(e.target.value))}
                    className="w-32"
                  />
                  <p className="text-xs text-muted-foreground">
                    {WEIGHT_DESCRIPTIONS[key]}
                  </p>
                </div>
              ))}

              <Button onClick={handleSave} disabled={loading} className="w-full">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Weights
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
