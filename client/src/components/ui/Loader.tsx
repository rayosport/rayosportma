import { useState, useEffect } from "react";

const Loader = () => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 50);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="fixed inset-0 bg-jetblack flex flex-col items-center justify-center z-50">
      <div className="relative w-32 h-32 mb-8">
        <svg 
          className="w-full h-full animate-spin"
          viewBox="0 0 100 100" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle 
            cx="50" 
            cy="50" 
            r="45" 
            fill="none" 
            stroke="#1a1a1a" 
            strokeWidth="8" 
          />
          <circle 
            cx="50" 
            cy="50" 
            r="45" 
            fill="none" 
            stroke="#007BFF" 
            strokeWidth="8" 
            strokeDasharray="283" 
            strokeDashoffset={283 - ((283 * progress) / 100)}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white">
          {progress}%
        </div>
      </div>
      <h2 className="text-2xl md:text-3xl font-bold text-white">
        Rayo<span className="text-rayoblue">Sport</span>
      </h2>
      <p className="text-gray-400 mt-2">Chargement en cours...</p>
    </div>
  );
};

export default Loader;