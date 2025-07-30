import React, { useState, useEffect } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const NextMatchCountdown: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Calculer le temps restant jusqu'au prochain dimanche à 10h
  const calculateTimeLeft = (): TimeLeft => {
    const now = new Date();
    const nextSunday = new Date();
    
    // Trouver le prochain dimanche à 10h
    const daysUntilSunday = (7 - now.getDay()) % 7; // 0 = dimanche
    
    if (daysUntilSunday === 0) {
      // On est dimanche, vérifier si c'est avant ou après 10h
      if (now.getHours() < 10) {
        // Avant 10h aujourd'hui
        nextSunday.setHours(10, 0, 0, 0);
      } else {
        // Après 10h, prochain dimanche
        nextSunday.setDate(now.getDate() + 7);
        nextSunday.setHours(10, 0, 0, 0);
      }
    } else {
      // Prochain dimanche
      nextSunday.setDate(now.getDate() + daysUntilSunday);
      nextSunday.setHours(10, 0, 0, 0);
    }

    const difference = nextSunday.getTime() - now.getTime();

    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    }

    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Initialiser immédiatement
    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, []);

  const TimeBlock: React.FC<{ value: number; label: string }> = ({ value, label }) => (
    <div className="flex flex-col items-center">
      <div className="bg-[#e6ff00] text-black font-bold text-4xl md:text-5xl lg:text-6xl w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 flex items-center justify-center rounded-lg shadow-lg border-2 border-black">
        {value.toString().padStart(2, '0')}
      </div>
      <span className="text-white font-semibold text-sm md:text-base mt-2 uppercase tracking-wide">
        {label}
      </span>
    </div>
  );

  return (
    <div className="bg-black py-16 px-4">
      <div className="max-w-6xl mx-auto text-center">
        {/* Titre du compte à rebours */}
        <h2 className="text-white text-2xl md:text-3xl lg:text-4xl font-bold mb-8 flex items-center justify-center gap-3">
          <span className="text-3xl md:text-4xl">⏳</span>
          Prochains matchs publiés dans :
        </h2>

        {/* Blocs du compte à rebours */}
        <div className="flex justify-center items-center gap-4 md:gap-6 lg:gap-8">
          <TimeBlock value={timeLeft.days} label="Days" />
          <TimeBlock value={timeLeft.hours} label="Hours" />
          <TimeBlock value={timeLeft.minutes} label="Minutes" />
          <TimeBlock value={timeLeft.seconds} label="Seconds" />
        </div>

        {/* Information supplémentaire */}
        <p className="text-gray-300 text-sm md:text-base mt-8 opacity-80">
          Les nouveaux matchs sont publiés chaque dimanche à 10h00
        </p>
      </div>
    </div>
  );
};

export default NextMatchCountdown; 