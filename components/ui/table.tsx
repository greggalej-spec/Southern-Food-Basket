import * as React from "react"
import { cn } from "cn"

// Tables are styled by styles/tokens.css (table, th, td, .table-wrap scrolls sideways on phones). Use the
// "num" class on numeric cells so they right-align with tabular figures.
function Table({ className, wrap = true, ...props }: React.ComponentProps<"table"> & { wrap?: boolean }) {
  const table = <table data-slot="table" className={className} {...props} />
  return wrap ? <div data-slot="table-container" className="table-wrap">{table}</div> : table
}

function TableHeader(props: React.ComponentProps<"thead">) {
  return <thead data-slot="table-header" {...props} />
}

function TableBody(props: React.ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" {...props} />
}

function TableFooter(props: React.ComponentProps<"tfoot">) {
  return <tfoot data-slot="table-footer" {...props} />
}

function TableRow(props: React.ComponentProps<"tr">) {
  return <tr data-slot="table-row" {...props} />
}

function TableHead({ className, num, ...props }: React.ComponentProps<"th"> & { num?: boolean }) {
  return <th data-slot="table-head" className={cn(num && "num", className)} {...props} />
}

function TableCell({ className, num, ...props }: React.ComponentProps<"td"> & { num?: boolean }) {
  return <td data-slot="table-cell" className={cn(num && "num", className)} {...props} />
}

function TableCaption(props: React.ComponentProps<"caption">) {
  return <caption data-slot="table-caption" {...props} />
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption }
