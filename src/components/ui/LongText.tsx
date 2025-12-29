import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LongTextProps {
  children: ReactNode;
  className?: string;
}

/**
 * Universal wrapper for long text that ensures proper wrapping
 * and prevents horizontal overflow or clipping.
 */
export function LongText({ children, className }: LongTextProps) {
  return (
    <div
      className={cn(
        "whitespace-pre-wrap break-words max-w-full overflow-x-hidden",
        className
      )}
      style={{ overflowWrap: "anywhere" }}
    >
      {children}
    </div>
  );
}

export default LongText;
