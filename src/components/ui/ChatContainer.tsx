import { ReactNode, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ChatContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Universal chat container that provides proper vertical scrolling
 * without horizontal overflow or clipping.
 */
export const ChatContainer = forwardRef<HTMLDivElement, ChatContainerProps>(
  ({ children, className }, ref) => {
    return (
      <div className="flex flex-col flex-1 min-h-0 w-full max-w-full overflow-hidden">
        <div
          ref={ref}
          className={cn(
            "flex-1 min-h-0 w-full max-w-full overflow-y-auto overflow-x-hidden",
            className
          )}
        >
          <div className="space-y-4 w-full p-3">{children}</div>
        </div>
      </div>
    );
  }
);

ChatContainer.displayName = "ChatContainer";

export default ChatContainer;
