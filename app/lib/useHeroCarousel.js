"use client";

import { useEffect, useState } from "react";

export default function useHeroCarousel(slides) {
  const [index, setIndex] = useState(0);
  const slideCount = slides.length;
  const activeIndex = slideCount ? index % slideCount : 0;

  useEffect(() => {
    if (slideCount < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slideCount);
    }, 10000);

    return () => window.clearInterval(timer);
  }, [slideCount]);

  return {
    activeIndex,
    activeSlide: slides[activeIndex] || {},
    goTo(indexToShow) {
      if (slideCount) setIndex(indexToShow % slideCount);
    },
    previous() {
      if (slideCount) setIndex((current) => (current + slideCount - 1) % slideCount);
    },
    next() {
      if (slideCount) setIndex((current) => (current + 1) % slideCount);
    },
  };
}
