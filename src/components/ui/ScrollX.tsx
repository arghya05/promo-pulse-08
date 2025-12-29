import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ScrollXProps {
  children: ReactNode;
  className?: string;
}

/**
 * Horizontal scroll wrapper - shows scrollbar when content overflows.
 * Use for long single-line content that shouldn't be clipped.
 */
export function ScrollX({ children, className }: ScrollXProps) {
  return (
    <div className={cn("overflow-x-auto scrollbar-visible", className)}>
      <div className="inline-block min-w-max">
        {children}
      </div>
    </div>
  );
}

export default ScrollX;
