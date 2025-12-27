import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TypewriterText } from "@/components/TypewriterText";
import { Search, Plus, ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
      
      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium">Campus Lost & Found System</span>
          </div>

          {/* Main heading */}
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Where students{" "}
            <span className="block mt-2">
              <TypewriterText />
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Lost something on campus? Found an item that isn't yours? 
            Our platform connects students to reunite lost belongings quickly and easily.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Button asChild size="lg" className="gap-2 text-base px-8 shadow-glow">
              <Link to="/browse">
                <Search className="w-5 h-5" />
                Browse Found Items
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2 text-base px-8">
              <Link to="/report-lost">
                <Plus className="w-5 h-5" />
                Report Lost Item
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-border/50 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold font-display text-foreground">250+</p>
              <p className="text-sm text-muted-foreground mt-1">Items Returned</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold font-display text-foreground">95%</p>
              <p className="text-sm text-muted-foreground mt-1">Success Rate</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold font-display text-foreground">24h</p>
              <p className="text-sm text-muted-foreground mt-1">Avg. Return Time</p>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <ArrowRight className="w-6 h-6 text-muted-foreground rotate-90" />
          </div>
        </div>
      </div>
    </section>
  );
}
