import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LongTextProps {
  children: ReactNode;
  className?: string;
  /** Use horizontal scroll instead of wrapping */
  scroll?: boolean;
}

/**
 * Universal wrapper for long text.
 * - Default: wraps text and prevents clipping
 * - scroll=true: horizontal scrollbar, no wrapping
 */
export function LongText({ children, className, scroll = false }: LongTextProps) {
  if (scroll) {
    return (
      <div className={cn("overflow-x-auto scrollbar-visible", className)}>
        <div className="inline-block min-w-max whitespace-nowrap">
          {children}
        </div>
      </div>
    );
  }

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
