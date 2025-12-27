import { useTypewriter } from "@/hooks/useTypewriter";

const phrases = [
  "find your belongings",
  "help fellow students",
  "build community",
  "make campus better",
  "reunite lost items",
];

export function TypewriterText() {
  const { currentText } = useTypewriter({
    phrases,
    typingSpeed: 80,
    deletingSpeed: 40,
    pauseDuration: 2500,
  });

  return (
    <span className="inline-flex items-center">
      <span className="gradient-text">{currentText}</span>
      <span className="typewriter-cursor" />
    </span>
  );
}
