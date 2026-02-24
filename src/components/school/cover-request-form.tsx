"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, AlertTriangle, User } from "lucide-react";
import { format, isToday, isBefore, startOfDay } from "date-fns";

interface PreviousTeacher {
  id: string;
  firstName: string;
  lastName: string;
  roleType: string;
}

interface Props {
  schoolId: string;
  previousTeachers: PreviousTeacher[];
}

const KEY_STAGES = ["EYFS", "KS1", "KS2", "KS3", "KS4", "KS5"];
const SUBJECTS = [
  "English",
  "Maths",
  "Science",
  "History",
  "Geography",
  "Art",
  "Music",
  "PE",
  "Computing",
  "PSHE",
  "RE",
  "MFL",
  "DT",
  "General Primary",
];

export function CoverRequestForm({ schoolId, previousTeachers }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [roleNeeded, setRoleNeeded] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [keyStage, setKeyStage] = useState<string>("");
  const [startTime, setStartTime] = useState("08:30");
  const [endTime, setEndTime] = useState("15:30");
  const [notes, setNotes] = useState("");
  const [preferredTeacherId, setPreferredTeacherId] = useState<string>("");

  const isEmergency = date ? isToday(date) : false;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !roleNeeded) return;

    setLoading(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId,
          date: format(date, "yyyy-MM-dd"),
          roleNeeded,
          subject: subject || null,
          keyStage: keyStage || null,
          startTime,
          endTime,
          notes: notes || null,
          preferredTeacherId: preferredTeacherId || null,
          isEmergency,
        }),
      });

      if (res.ok) {
        router.push("/school/requests");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* Date Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={(d) => isBefore(d, startOfDay(new Date())) || d.getDay() === 0 || d.getDay() === 6}
              className="rounded-md border"
            />
            {isEmergency && (
              <div className="mt-3 flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertTriangle className="h-4 w-4" />
                Same-day emergency request - shorter response window applies
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role & Subject */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Role Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Role Needed</Label>
              <Select value={roleNeeded} onValueChange={setRoleNeeded}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="ta">Teaching Assistant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Key Stage</Label>
              <Select value={keyStage} onValueChange={setKeyStage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select key stage..." />
                </SelectTrigger>
                <SelectContent>
                  {KEY_STAGES.map((ks) => (
                    <SelectItem key={ks} value={ks}>{ks}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {roleNeeded === "teacher" && (
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Times */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Times</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label>End Time</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Previous Teachers */}
        {previousTeachers.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Request Previous Teacher</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground mb-3">
                Select a teacher who has previously worked at your school
              </p>
              <div className="grid gap-2">
                {preferredTeacherId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={() => setPreferredTeacherId("")}
                  >
                    Clear selection
                  </Button>
                )}
                {previousTeachers.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setPreferredTeacherId(t.id === preferredTeacherId ? "" : t.id)}
                    className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                      t.id === preferredTeacherId
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        {t.firstName} {t.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">{t.roleType}</div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Any special requirements or information..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <Button type="submit" disabled={loading || !date || !roleNeeded} className="w-full" size="lg">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Cover Request"
          )}
        </Button>
      </div>
    </form>
  );
}
