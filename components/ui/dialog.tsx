"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cn } from "cn"

import { usePortalContainer } from "@/components/scope"

// The static site's <dialog class="sfb-dialog">: flour card, 18 px corners, a body and a wash-coloured action bar,
// green-tinted backdrop with no blur. Title and text pick up the h3 and p rules from styles/tokens.css.
// Open and close fade in 200 ms, and not at all under reduced motion (tokens.css).

function Dialog(props: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger(props: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal(props: DialogPrimitive.Portal.Props) {
  const container = usePortalContainer()
  return <DialogPrimitive.Portal data-slot="dialog-portal" container={container} {...props} />
}

function DialogClose(props: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 z-[90] bg-[rgba(18,63,34,.5)] transition-opacity duration-200 ease-out data-ending-style:opacity-0 data-starting-style:opacity-0",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({ className, children, ...props }: DialogPrimitive.Popup.Props) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-[90] max-h-[calc(100dvh-2*var(--s4))] w-[min(100%-2*var(--s4),520px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[var(--r-lg)] bg-[var(--flour)] text-[var(--ink)] shadow-[var(--shadow-lift)] outline-none transition-opacity duration-200 ease-out data-ending-style:opacity-0 data-starting-style:opacity-0",
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="dialog-body" className={cn("p-[var(--s6)]", className)} {...props} />
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-wrap justify-end gap-[var(--s3)] border-t border-[var(--line)] bg-[var(--wash)] px-[var(--s6)] py-[var(--s4)]",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({ render = <h3 />, ...props }: DialogPrimitive.Title.Props) {
  return <DialogPrimitive.Title data-slot="dialog-title" render={render} {...props} />
}

function DialogDescription(props: DialogPrimitive.Description.Props) {
  return <DialogPrimitive.Description data-slot="dialog-description" {...props} />
}

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
