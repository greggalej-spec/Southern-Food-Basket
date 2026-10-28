"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cn } from "cn"

// Base UI supplies the roving focus, arrow keys and aria wiring; the look is .tabs in styles/app.css
// (an underline in pink ink under the selected tab), so these only work inside an app page Scope.
function Tabs(props: TabsPrimitive.Root.Props) {
  return <TabsPrimitive.Root data-slot="tabs" {...props} />
}

function TabsList({ className, ...props }: TabsPrimitive.List.Props) {
  return <TabsPrimitive.List data-slot="tabs-list" className={cn("tabs", className)} {...props} />
}

function TabsTrigger(props: TabsPrimitive.Tab.Props) {
  return <TabsPrimitive.Tab data-slot="tabs-trigger" {...props} />
}

function TabsContent(props: TabsPrimitive.Panel.Props) {
  return <TabsPrimitive.Panel data-slot="tabs-content" {...props} />
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
