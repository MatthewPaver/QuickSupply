"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BookmarkPlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  roleNeeded: string;
  subject: string | null;
  keyStage: string | null;
  startTime: string;
  endTime: string;
  notes: string | null;
}

interface TemplateSelectorProps {
  onSelect: (template: Template) => void;
  currentValues: {
    roleNeeded: string;
    keyStage: string;
    startTime: string;
    endTime: string;
    notes: string;
  };
}

export function TemplateSelector({ onSelect, currentValues }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/school/templates", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates);
      }
    } catch {
      // Silently fail — templates are optional
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  async function handleSave() {
    if (!templateName.trim()) {
      toast.error("Please enter a template name.");
      return;
    }
    if (!currentValues.roleNeeded) {
      toast.error("Please select a role before saving a template.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/school/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: templateName.trim(),
          roleNeeded: currentValues.roleNeeded,
          subject: null,
          keyStage: currentValues.keyStage || null,
          startTime: currentValues.startTime,
          endTime: currentValues.endTime,
          notes: currentValues.notes || null,
        }),
      });

      if (res.ok) {
        toast.success("Template saved");
        setTemplateName("");
        setDialogOpen(false);
        await fetchTemplates();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || "Failed to save template.");
      }
    } catch {
      toast.error("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/school/templates/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Template deleted");
        setTemplates((prev) => prev.filter((t) => t.id !== id));
      } else {
        toast.error("Failed to delete template.");
      }
    } catch {
      toast.error("Couldn't reach the server. Check your connection and try again.");
    }
  }

  if (loading) return null;

  return (
    <div className="flex flex-wrap items-end gap-3">
      {templates.length > 0 && (
        <div className="flex-1 min-w-[200px] space-y-1.5">
          <Label className="text-xs text-muted-foreground">Load from template</Label>
          <Select
            onValueChange={(value) => {
              const t = templates.find((tpl) => tpl.id === value);
              if (t) onSelect(t);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a template..." />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <div key={t.id} className="flex items-center">
                  <SelectItem value={t.id} className="flex-1">
                    {t.name}
                  </SelectItem>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(t.id);
                    }}
                    className="mr-2 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    aria-label={`Delete template ${t.name}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="gap-1.5">
            <BookmarkPlus className="h-4 w-4" />
            Save as Template
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Give this template a name so you can quickly reuse these settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              placeholder="e.g. Year 3 Full Day"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSave();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving || !templateName.trim()}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Template"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
