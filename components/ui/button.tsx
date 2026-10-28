import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// The look lives in styles/tokens.css (.btn: sturdy, labelled, 48 px tall); this keeps Base UI's behaviour.
// Variants follow DESIGN.md's button meanings: sign = act or join (public), primary = main action (staff tools).
const buttonVariants = cva("btn", {
  variants: {
    variant: {
      primary: "btn-primary",
      sign: "btn-sign",
      outline: "btn-outline",
      ghost: "btn-ghost",
      danger: "btn-danger",
    },
    size: {
      md: "",
      sm: "btn-sm",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
})

function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
