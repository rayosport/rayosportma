import { useEffect, useState } from "react";
import { useInView } from "framer-motion";
import { useRef } from "react";

export const useCounter = (target: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      let startTime: number | null = null;
      let animationFrameId: number;

      const updateCount = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        
        const elapsedTime = timestamp - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        
        setCount(Math.floor(progress * target));
        
        if (progress < 1) {
          animationFrameId = requestAnimationFrame(updateCount);
        }
      };

      animationFrameId = requestAnimationFrame(updateCount);
      
      return () => cancelAnimationFrame(animationFrameId);
    }
  }, [isInView, target, duration]);

  return count;
};
