import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface SectionTransitionProps {
  children: React.ReactNode;
  delay?: number;
}

const SectionTransition = ({ children, delay = 0 }: SectionTransitionProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{
        duration: 1,
        delay: delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
};

export default SectionTransition;
