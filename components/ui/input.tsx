import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

// Styled by the element rules in styles/tokens.css (48 px, 2 px warm border, green focus). Those rules match on
// [type], so the type defaults to text.
function Input({ type = "text", ...props }: React.ComponentProps<"input">) {
  return <InputPrimitive type={type} data-slot="input" {...props} />
}

export { Input }
