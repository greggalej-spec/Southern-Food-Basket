import * as React from "react"
import { cn } from "cn"

// The form scaffolding from styles/tokens.css: .field, .hint, .error-text, .form-row, fieldset and legend.
// Wire the ids yourself: label htmlFor, aria-describedby to the hint, aria-invalid plus the error id on failure.
function Field({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="field" className={cn("field", className)} {...props} />
}

function FieldRow({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="field-row" className={cn("form-row", className)} {...props} />
}

function FieldHint({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="field-hint" className={cn("hint", className)} {...props} />
}

function FieldError({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="field-error" role="alert" className={cn("error-text", className)} {...props} />
}

function FieldSet(props: React.ComponentProps<"fieldset">) {
  return <fieldset data-slot="field-set" {...props} />
}

function FieldLegend(props: React.ComponentProps<"legend">) {
  return <legend data-slot="field-legend" {...props} />
}

export { Field, FieldRow, FieldHint, FieldError, FieldSet, FieldLegend }
