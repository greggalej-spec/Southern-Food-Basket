import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// styles/tokens.css .badge. DESIGN.md: a status always carries its text label, never colour alone.
const badgeVariants = cva("badge", {
  variants: {
    variant: {
      neutral: "",
      ok: "badge-ok",
      warn: "badge-warn",
      bad: "badge-bad",
      info: "badge-info",
      clay: "badge-clay",
      green: "badge-green",
    },
    plain: {
      true: "badge-plain",
      false: "",
    },
  },
  defaultVariants: {
    variant: "neutral",
    plain: false,
  },
})

function Badge({
  className,
  variant = "neutral",
  plain = false,
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant, plain }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
