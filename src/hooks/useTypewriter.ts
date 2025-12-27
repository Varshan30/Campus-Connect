import { useState, useEffect, useCallback } from "react";

interface UseTypewriterOptions {
  phrases: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
}

export function useTypewriter({
  phrases,
  typingSpeed = 100,
  deletingSpeed = 50,
  pauseDuration = 2000,
}: UseTypewriterOptions) {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const currentPhrase = phrases[currentPhraseIndex];

  const type = useCallback(() => {
    if (isDeleting) {
      if (currentText.length === 0) {
        setIsDeleting(false);
        setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
      } else {
        setCurrentText((prev) => prev.slice(0, -1));
      }
    } else {
      if (currentText.length === currentPhrase.length) {
        setTimeout(() => setIsDeleting(true), pauseDuration);
        return;
      }
      setCurrentText((prev) => currentPhrase.slice(0, prev.length + 1));
    }
  }, [currentText, currentPhrase, isDeleting, phrases.length, pauseDuration]);

  useEffect(() => {
    const speed = isDeleting ? deletingSpeed : typingSpeed;
    const timer = setTimeout(type, speed);
    return () => clearTimeout(timer);
  }, [type, isDeleting, typingSpeed, deletingSpeed]);

  return { currentText, isDeleting };
}
