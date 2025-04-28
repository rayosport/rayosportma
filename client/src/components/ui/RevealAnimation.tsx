import { useEffect, useRef, ReactNode } from "react";

interface RevealAnimationProps {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
}

const RevealAnimation = ({
  children,
  delay = 0,
  direction = "up"
}: RevealAnimationProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            if (entry.target) {
              entry.target.classList.add("animate-reveal");
            }
          }, delay * 1000);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.1,
        root: null,
        rootMargin: "0px 0px -50px 0px"
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [delay]);

  const getTransform = () => {
    switch (direction) {
      case "up":
        return "translateY(20px)";
      case "down":
        return "translateY(-20px)";
      case "left":
        return "translateX(20px)";
      case "right":
        return "translateX(-20px)";
      default:
        return "translateY(20px)";
    }
  };

  return (
    <div
      ref={ref}
      className="transition-all duration-700 ease-out opacity-0"
      style={{ transform: getTransform() }}
    >
      {children}
    </div>
  );
};

export default RevealAnimation;