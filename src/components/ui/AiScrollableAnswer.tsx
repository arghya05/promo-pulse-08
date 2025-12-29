import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AiScrollableAnswerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Universal wrapper for AI-generated answers.
 * Shows a horizontal scrollbar when content overflows.
 * Use this for ALL AI answer text to ensure nothing gets cut off.
 */
export function AiScrollableAnswer({ children, className }: AiScrollableAnswerProps) {
  return (
    <div className={cn("overflow-x-auto scrollbar-visible", className)}>
      <div className="inline-block min-w-max whitespace-nowrap">
        {children}
      </div>
    </div>
  );
}

export default AiScrollableAnswer;
