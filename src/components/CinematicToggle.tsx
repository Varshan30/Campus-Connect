import { cn } from "@/lib/utils";

interface CinematicToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function CinematicToggle({ checked, onChange, disabled }: CinematicToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "toggle-switch",
        checked && "active",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span className="toggle-thumb" />
    </button>
  );
}
