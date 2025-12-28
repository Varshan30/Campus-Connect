import { Link } from "react-router-dom";
import { MapPin, ArrowLeft } from "lucide-react";
import AuthForm from "../components/AuthForm";
import { AnimatedGridPattern } from '@/components/ui/animated-grid-pattern';
import { cn } from '@/lib/utils';

const Auth = () => {


  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <AnimatedGridPattern
        numSquares={40}
        maxOpacity={0.02}
        duration={4}
        className={cn(
          "[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]",
          "inset-x-0 inset-y-0 h-full"
        )}
      />
      {/* Header */}
      <header className="p-4 md:p-6 relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Home</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 relative z-10">
        <div className="w-full max-w-md animate-fade-in">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-2xl font-display font-bold text-foreground">
                Campus<span className="text-primary">Finds</span>
              </span>
            </Link>
          </div>


          {/* Firebase Auth Form */}
          <AuthForm />

          <p className="text-center text-xs text-muted-foreground mt-6">
            By continuing, you agree to our{" "}
            <a href="#" className="text-primary hover:underline">Terms of Service</a>{" "}
            and{" "}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Auth;
