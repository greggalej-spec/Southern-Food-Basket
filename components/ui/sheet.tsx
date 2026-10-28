"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"
import { cn } from "cn"

import { usePortalContainer } from "@/components/scope"

// The HR and admin drawer from styles/app.css (.drawer, .drawer-head/-body/-foot): a flour panel up to 560 px
// wide sliding in from the right over a green-tinted backdrop. Base UI adds the focus trap, Escape and the
// inert page behind it. Only use inside an app page Scope, which is where those classes are loaded.

function Sheet(props: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger(props: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose(props: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal(props: SheetPrimitive.Portal.Props) {
  const container = usePortalContainer()
  return <SheetPrimitive.Portal data-slot="sheet-portal" container={container} {...props} />
}

function SheetContent({ className, children, ...props }: SheetPrimitive.Popup.Props) {
  return (
    <SheetPortal>
      <SheetPrimitive.Backdrop
        data-slot="sheet-overlay"
        className="drawer-backdrop is-open data-ending-style:opacity-0 data-starting-style:opacity-0"
      />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          "drawer is-open outline-none transition-[translate] duration-[var(--t)] ease-[var(--ease)] data-ending-style:translate-x-full data-starting-style:translate-x-full",
          className
        )}
        {...props}
      >
        {children}
      </SheetPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sheet-header" className={cn("drawer-head", className)} {...props} />
}

function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sheet-body" className={cn("drawer-body", className)} {...props} />
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sheet-footer" className={cn("drawer-foot", className)} {...props} />
}

function SheetTitle({ render = <h2 />, ...props }: SheetPrimitive.Title.Props) {
  return <SheetPrimitive.Title data-slot="sheet-title" render={render} {...props} />
}

function SheetDescription(props: SheetPrimitive.Description.Props) {
  return <SheetPrimitive.Description data-slot="sheet-description" {...props} />
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetBody, SheetFooter, SheetTitle, SheetDescription }
