import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function useEntrance(options = {}) {
  const elementRef = useRef(null);

  useEffect(() => {
    // Check for prefers-reduced-motion media query
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      // Instantly show the elements
      if (elementRef.current) {
        gsap.set(elementRef.current, { opacity: 1, y: 0, x: 0, scale: 1 });
      }
      return;
    }

    const {
      y = 30,
      x = 0,
      opacity = 0,
      duration = 0.8,
      delay = 0,
      ease = 'power3.out',
      stagger = 0,
      scale = 1
    } = options;

    if (elementRef.current) {
      // Find direct children to stagger, or animate the element itself
      const targets = stagger > 0 
        ? elementRef.current.children 
        : elementRef.current;

      gsap.fromTo(
        targets,
        { opacity: 0, y, x, scale: scale !== 1 ? scale : undefined },
        { 
          opacity: 1, 
          y: 0, 
          x: 0, 
          scale: 1,
          duration, 
          delay, 
          ease, 
          stagger: stagger > 0 ? stagger : undefined 
        }
      );
    }
  }, [options.delay]);

  return elementRef;
}
