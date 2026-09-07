'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

// Triggers fade-up animation when element enters viewport.
// Works without IntersectionObserver polyfills (uses fallback).
export function Reveal({ children, delay = 0, className = '' }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Check if user prefers reduced motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true);
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setTimeout(() => setShown(true), delay);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  const style: React.CSSProperties = {
    opacity: shown ? 1 : 0,
    transform: shown ? 'translateY(0)' : 'translateY(20px)',
    transition: `opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
    willChange: 'opacity, transform',
  };

  return (
    <div ref={ref} style={style} className={className}>
      {children}
    </div>
  );
}
