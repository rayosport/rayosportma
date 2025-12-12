import { lazy, Suspense, useEffect, useRef, useState, ReactNode } from "react";

interface LazySectionProps {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  threshold?: number;
}

/**
 * LazySection - Loads content only when it comes into viewport
 * Uses Intersection Observer for optimal performance
 */
export function LazySection({ 
  children, 
  fallback = <div className="min-h-[200px]" />,
  rootMargin = "100px",
  threshold = 0.01
}: LazySectionProps) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasLoaded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !shouldLoad) {
            setShouldLoad(true);
            setHasLoaded(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin,
        threshold,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [shouldLoad, hasLoaded, rootMargin, threshold]);

  return (
    <div ref={ref}>
      {shouldLoad ? (
        <Suspense fallback={fallback}>
          {children}
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  );
}

/**
 * Helper to create lazy-loaded components
 */
export function createLazyComponent<T = {}>(
  importFn: () => Promise<{ default: React.ComponentType<T> }>
) {
  return lazy(importFn);
}

