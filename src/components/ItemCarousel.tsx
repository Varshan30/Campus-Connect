import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FoundItem } from '@/lib/data';
import ItemCard from './ItemCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ItemCarouselProps {
  items: FoundItem[];
  title?: string;
  onItemClick?: (item: FoundItem) => void;
}

const ItemCarousel = ({ items, title, onItemClick }: ItemCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollPosition = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollPosition();
    window.addEventListener('resize', checkScrollPosition);
    return () => window.removeEventListener('resize', checkScrollPosition);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320; // Card width + gap
      const newScrollLeft =
        direction === 'left'
          ? scrollRef.current.scrollLeft - scrollAmount
          : scrollRef.current.scrollLeft + scrollAmount;

      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="relative">
      {title && (
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
            {title}
          </h2>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="h-10 w-10 rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="h-10 w-10 rounded-full"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Carousel container */}
      <div className="relative -mx-4 px-4 md:-mx-0 md:px-0">
        {/* Gradient fade edges */}
        <div
          className={cn(
            'absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none transition-opacity',
            canScrollLeft ? 'opacity-100' : 'opacity-0'
          )}
        />
        <div
          className={cn(
            'absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none transition-opacity',
            canScrollRight ? 'opacity-100' : 'opacity-0'
          )}
        />

        {/* Scrollable area */}
        <div
          ref={scrollRef}
          onScroll={checkScrollPosition}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory md:snap-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="flex-shrink-0 w-[280px] md:w-[300px] snap-start"
            >
              <ItemCard item={item} onClick={() => onItemClick?.(item)} />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile scroll indicator */}
      <div className="mt-4 flex justify-center gap-1 md:hidden">
        {items.slice(0, 5).map((_, idx) => (
          <div
            key={idx}
            className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30"
          />
        ))}
      </div>
    </section>
  );
};

export default ItemCarousel;
