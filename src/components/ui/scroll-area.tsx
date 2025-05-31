// Simple ScrollArea component without Radix UI dependency

import * as React from "react"
import { cn } from "../../lib/utils"

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "vertical" | "horizontal" | "both"
  scrollHideDelay?: number
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, orientation = "vertical", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-auto",
          orientation === "horizontal" ? "overflow-y-hidden" : "",
          orientation === "vertical" ? "overflow-x-hidden" : "",
          className
        )}
        {...props}
      >
        <div className="h-full w-full">{children}</div>
      </div>
    )
  }
)

ScrollArea.displayName = "ScrollArea"

export { ScrollArea }
