import { useCallback, useState } from 'react';

export function useProjector(totalSlides: number) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, totalSlides - 1));
  }, [totalSlides]);

  const reset = useCallback(() => {
    setCurrentIndex(0);
  }, []);

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= totalSlides) return;
      setCurrentIndex(index);
    },
    [totalSlides]
  );

  return {
    currentIndex,
    goPrev,
    goNext,
    goTo,
    reset,
  };
}