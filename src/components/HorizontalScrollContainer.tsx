import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HorizontalScrollContainerProps {
  children: React.ReactNode;
  className?: string;
  showArrows?: boolean;
}

const HorizontalScrollContainer: React.FC<HorizontalScrollContainerProps> = ({
  children,
  className,
  showArrows = true
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [children]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className={cn("relative group", className)}>
      {/* Scroll Arrows */}
      {showArrows && canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 border rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      {showArrows && canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 border rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
      
      {/* Scrollable Content with always-visible thick scrollbar */}
      <div
        ref={scrollRef}
        className="overflow-x-scroll pb-3 horizontal-scroll-visible"
      >
        <div className="min-w-max">
          {children}
        </div>
      </div>
      
      {/* Custom scrollbar styles */}
      <style>{`
        .horizontal-scroll-visible {
          scrollbar-width: auto;
          scrollbar-color: hsl(var(--primary)) hsl(var(--muted));
        }
        .horizontal-scroll-visible::-webkit-scrollbar {
          height: 12px;
          display: block;
        }
        .horizontal-scroll-visible::-webkit-scrollbar-track {
          background: hsl(var(--muted));
          border-radius: 6px;
          margin: 0 4px;
        }
        .horizontal-scroll-visible::-webkit-scrollbar-thumb {
          background: hsl(var(--primary));
          border-radius: 6px;
          border: 2px solid hsl(var(--muted));
        }
        .horizontal-scroll-visible::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--primary) / 0.8);
        }
      `}</style>
    </div>
  );
};

export default HorizontalScrollContainer;
