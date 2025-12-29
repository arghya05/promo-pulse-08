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
    <div 
      className={cn("ai-answer-scroll", className)}
      style={{ 
        overflowX: 'auto', 
        overflowY: 'visible',
        maxWidth: '100%'
      }}
    >
      <div 
        style={{ 
          display: 'inline-block', 
          minWidth: 'max-content',
          whiteSpace: 'nowrap'
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default AiScrollableAnswer;
