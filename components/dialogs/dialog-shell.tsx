"use client";

import type { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface DialogShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  // Merged over the dialog's default classes, e.g. `sm:max-w-3xl` for a dialog that needs more
  // room than the default width.
  className?: string;
}

export function DialogShell({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: DialogShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-h-[calc(100dvh-2rem)] gap-5 overflow-y-auto rounded-3xl border border-surface-border bg-surface/95 p-6 text-copy-primary ring-0 backdrop-blur-xl sm:max-w-md",
          className,
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-base text-copy-primary">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="wrap-anywhere text-copy-muted">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        {children}
        {footer && (
          <DialogFooter className="-mx-6 -mb-6 rounded-b-3xl border-surface-border bg-elevated/60 px-6 py-4">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
