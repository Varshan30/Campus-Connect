import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ItemCard } from "@/components/ItemCard";
import { sampleFoundItems } from "@/data/sampleItems";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export function ItemCarousel() {
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", checkScroll);
      return () => scrollContainer.removeEventListener("scroll", checkScroll);
    }
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 340; // Card width + gap
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const availableItems = sampleFoundItems.filter(item => item.status !== "claimed").slice(0, 8);

  return (
    <section className="py-16 bg-muted/30">
      <div className="container px-4">
        {/* Section header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              Recently Found Items
            </h2>
            <p className="text-muted-foreground">
              Browse through items found around campus
            </p>
          </div>
          
          {/* Navigation buttons - desktop only */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="rounded-full"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="rounded-full"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Gradient overlays for scroll indication */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-muted/80 to-transparent z-10 pointer-events-none hidden md:block" />
          )}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-muted/80 to-transparent z-10 pointer-events-none hidden md:block" />
          )}

          {/* Scrollable container */}
          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x snap-mandatory md:snap-none"
          >
            {availableItems.map((item, index) => (
              <div 
                key={item.id} 
                className="snap-start animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <ItemCard item={item} />
              </div>
            ))}
          </div>
        </div>

        {/* View all link */}
        <div className="text-center mt-8">
          <Button asChild variant="ghost" className="gap-2">
            <Link to="/browse">
              View All Found Items
              <ChevronRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
