import React from 'react';
import { cn } from '@/lib/utils';

interface HorizontalScrollContainerProps {
  children: React.ReactNode;
  className?: string;
}

const HorizontalScrollContainer: React.FC<HorizontalScrollContainerProps> = ({
  children,
  className
}) => {
  return (
    <div className={cn("relative", className)}>
      {/* Scrollable Content with always-visible thick scrollbar */}
      <div className="scrollbar-visible pb-1">
        <div className="min-w-max pr-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default HorizontalScrollContainer;
