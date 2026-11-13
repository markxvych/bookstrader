"use client";

import type { ReactElement, ReactNode } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { Button } from "./button";

export function Dialog({
  trigger,
  title,
  description,
  children,
}: {
  trigger: ReactElement;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger render={trigger} />
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-40 bg-black/50" />
        <DialogPrimitive.Viewport className="fixed inset-0 z-50 grid items-center justify-items-center overflow-y-auto p-4">
          <DialogPrimitive.Popup className="relative my-auto w-full max-w-lg border bg-background p-6 shadow-lg">
            <DialogPrimitive.Title className="pr-9 font-heading text-xl font-semibold tracking-wide uppercase">
              {title}
            </DialogPrimitive.Title>
            {description && (
              <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
                {description}
              </DialogPrimitive.Description>
            )}
            <DialogPrimitive.Close
              render={
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Закрити"
                  className="absolute top-3 right-3"
                >
                  <X aria-hidden="true" />
                </Button>
              }
            />
            <div className="mt-5">{children}</div>
          </DialogPrimitive.Popup>
        </DialogPrimitive.Viewport>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
