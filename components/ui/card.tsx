import * as React from "react"
import { cn } from "cn"

// DESIGN.md: a 1 px warm border and almost no shadow. The look is .card (styles/tokens.css) and .panel
// (styles/app.css, app pages only).
function Card({ className, flush = false, ...props }: React.ComponentProps<"div"> & { flush?: boolean }) {
  return <div data-slot="card" className={cn("card", flush && "card-flush", className)} {...props} />
}

function Panel({ className, ...props }: React.ComponentProps<"section">) {
  return <section data-slot="panel" className={cn("panel", className)} {...props} />
}

function PanelHead({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="panel-head" className={cn("panel-head", className)} {...props} />
}

function PanelBody({ className, flush = false, ...props }: React.ComponentProps<"div"> & { flush?: boolean }) {
  return <div data-slot="panel-body" className={cn("panel-body", flush && "flush", className)} {...props} />
}

export { Card, Panel, PanelHead, PanelBody }
