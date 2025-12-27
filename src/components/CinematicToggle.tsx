import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CinematicToggleProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
}

const CinematicToggle = ({
  checked: controlledChecked,
  onCheckedChange,
  label,
  description,
}: CinematicToggleProps) => {
  const [internalChecked, setInternalChecked] = useState(false);
  const isChecked = controlledChecked !== undefined ? controlledChecked : internalChecked;

  const handleToggle = () => {
    const newValue = !isChecked;
    if (controlledChecked === undefined) {
      setInternalChecked(newValue);
    }
    onCheckedChange?.(newValue);
  };

  return (
    <div className="flex items-center justify-between gap-4">
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-sm font-medium text-foreground">{label}</span>
          )}
          {description && (
            <span className="text-xs text-muted-foreground">{description}</span>
          )}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={isChecked}
        onClick={handleToggle}
        className={cn(
          'relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          isChecked
            ? 'bg-primary animate-pulse-glow'
            : 'bg-muted'
        )}
      >
        {/* Glow effect when on */}
        {isChecked && (
          <span className="absolute inset-0 rounded-full bg-primary/30 blur-md" />
        )}
        
        {/* Track inner glow */}
        <span
          className={cn(
            'absolute inset-0.5 rounded-full transition-colors duration-300',
            isChecked ? 'bg-primary' : 'bg-muted'
          )}
        />
        
        {/* Thumb */}
        <span
          className={cn(
            'pointer-events-none relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-background shadow-lg ring-0 transition-all duration-300 ease-out',
            isChecked ? 'translate-x-6' : 'translate-x-0'
          )}
        >
          {/* Inner glow indicator */}
          <span
            className={cn(
              'h-3 w-3 rounded-full transition-all duration-300',
              isChecked
                ? 'bg-primary shadow-[0_0_8px_hsl(var(--primary))]'
                : 'bg-muted-foreground/30'
            )}
          />
        </span>
      </button>
    </div>
  );
};

export default CinematicToggle;
