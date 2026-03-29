"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, School, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface SearchResult {
  id: string;
  label: string;
}

interface SearchResults {
  teachers: SearchResult[];
  schools: SearchResult[];
  requests: SearchResult[];
}

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  // Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      // Small delay to let the dialog render
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    } else {
      setQuery("");
      setResults(null);
    }
  }, [open]);

  // Debounced search
  const performSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/agency/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults({
          teachers: data.teachers,
          schools: data.schools,
          requests: data.requests,
        });
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setLoading(false);
    }
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(value), 300);
  }

  function navigateTo(path: string) {
    setOpen(false);
    router.push(path);
  }

  const hasResults =
    results &&
    (results.teachers.length > 0 ||
      results.schools.length > 0 ||
      results.requests.length > 0);

  const noResults = results && !hasResults && query.length >= 2;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="hidden gap-2 md:inline-flex"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" />
        <span className="text-muted-foreground">Search...</span>
        <kbd className="pointer-events-none ml-2 inline-flex h-5 items-center gap-0.5 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">&#8984;</span>K
        </kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="top-[20%] translate-y-0 gap-0 p-0 sm:max-w-lg"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">Search</DialogTitle>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search teachers, schools, requests..."
              className="h-11 border-0 shadow-none focus-visible:ring-0"
            />
            {loading && (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
            )}
          </div>

          <div className="max-h-72 overflow-y-auto p-2" aria-live="polite">
            {noResults && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No results found.
              </p>
            )}

            {hasResults && (
              <>
                {results.teachers.length > 0 && (
                  <ResultGroup
                    label="Teachers"
                    icon={<Users className="h-4 w-4" />}
                    items={results.teachers}
                    onSelect={(id) => navigateTo(`/agency/teachers/${id}`)}
                  />
                )}
                {results.schools.length > 0 && (
                  <ResultGroup
                    label="Schools"
                    icon={<School className="h-4 w-4" />}
                    items={results.schools}
                    onSelect={(id) => navigateTo(`/agency/schools/${id}`)}
                  />
                )}
                {results.requests.length > 0 && (
                  <ResultGroup
                    label="Requests"
                    icon={<FileText className="h-4 w-4" />}
                    items={results.requests}
                    onSelect={(id) => navigateTo(`/agency/requests/${id}`)}
                  />
                )}
              </>
            )}

            {!results && query.length < 2 && query.length > 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ResultGroup({
  label,
  icon,
  items,
  onSelect,
}: {
  label: string;
  icon: React.ReactNode;
  items: SearchResult[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="mb-2">
      <div className="mb-1 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onSelect(item.id)}
          className="flex w-full items-center rounded-md px-2 py-1.5 text-sm hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none transition-colors"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
