import { useState, useEffect } from "react";

interface AnimatedLineProps {
  className?: string;
  height?: number;
  bg?: string;
}

const AnimatedLine = ({
  className = "",
  height = 200,
  bg = "bg-white",
}: AnimatedLineProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div 
      className={`${className} overflow-hidden h-[${height}px] w-1 ${bg} opacity-20`}
      style={{ 
        height: `${height}px`,
        transform: mounted ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 1.2s cubic-bezier(0.19, 1, 0.22, 1) 0.5s'
      }}
    >
      <div 
        className="absolute inset-0 animate-pulse"
        style={{
          animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
        }}
      />
    </div>
  );
};

export default AnimatedLine;