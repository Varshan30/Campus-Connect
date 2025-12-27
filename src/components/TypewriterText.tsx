import { useState, useEffect, useMemo } from 'react';

interface TypewriterTextProps {
  phrases: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
}

const TypewriterText = ({
  phrases,
  typingSpeed = 100,
  deletingSpeed = 50,
  pauseDuration = 2000,
}: TypewriterTextProps) => {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Calculate the longest phrase to reserve space and prevent layout shifts
  const longestPhrase = useMemo(() => {
    return phrases.reduce((a, b) => (a.length > b.length ? a : b), '');
  }, [phrases]);

  useEffect(() => {
    const currentPhrase = phrases[currentPhraseIndex];

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (currentText.length < currentPhrase.length) {
          setCurrentText(currentPhrase.slice(0, currentText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), pauseDuration);
        }
      } else {
        if (currentText.length > 0) {
          setCurrentText(currentText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
        }
      }
    }, isDeleting ? deletingSpeed : typingSpeed);

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentPhraseIndex, phrases, typingSpeed, deletingSpeed, pauseDuration]);

  return (
    <span className="relative inline-block">
      {/* Invisible placeholder to reserve space */}
      <span className="invisible" aria-hidden="true">
        {longestPhrase}
      </span>
      {/* Actual visible text positioned absolutely */}
      <span className="absolute left-0 top-0 inline-flex items-center whitespace-nowrap">
        <span className="text-gradient">{currentText}</span>
        <span className="cursor-blink ml-0.5 inline-block w-[3px] h-[0.85em] bg-primary rounded-sm" />
      </span>
    </span>
  );
};

export default TypewriterText;
