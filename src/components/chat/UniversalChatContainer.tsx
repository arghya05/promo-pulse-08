import React, { forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface UniversalChatContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Universal chat container that provides proper scrolling behavior
 * without clipping text. Uses flex layout with min-h-0 pattern.
 */
export const UniversalChatContainer = forwardRef<HTMLDivElement, UniversalChatContainerProps>(
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
          <div className="space-y-4 w-full p-4">
            {children}
          </div>
        </div>
      </div>
    );
  }
);

UniversalChatContainer.displayName = 'UniversalChatContainer';

export default UniversalChatContainer;
