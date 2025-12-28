import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern';
import { GradientLinkButton } from '@/components/ui/gradient-button';
import { cn } from '@/lib/utils';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
      <AnimatedGridPattern
        numSquares={40}
        maxOpacity={0.02}
        duration={4}
        className={cn(
          "[mask-image:radial-gradient(500px_circle_at_center,white,transparent)]",
        )}
      />
      <div className="text-center relative z-10">
        <h1 className="mb-4 text-6xl font-display font-bold text-primary">404</h1>
        <p className="mb-6 text-xl text-muted-foreground">Oops! Page not found</p>
        <Link to="/">
          <GradientLinkButton>Return to Home</GradientLinkButton>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
