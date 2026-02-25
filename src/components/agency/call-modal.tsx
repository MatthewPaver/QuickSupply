"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherName: string;
  phone: string;
}

export function CallModal({ open, onOpenChange, teacherName, phone }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="sr-only">Call {teacherName}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 animate-pulse">
            <Phone className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-medium">Calling {teacherName}...</p>
            <p className="text-sm text-muted-foreground mt-1">Simulated call</p>
          </div>
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1"
              asChild
            >
              <a href={`tel:${phone}`}>Open phone</a>
            </Button>
            <Button
              variant="destructive"
              className="flex-1 gap-2"
              onClick={() => onOpenChange(false)}
            >
              <PhoneOff className="h-4 w-4" />
              End call
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
