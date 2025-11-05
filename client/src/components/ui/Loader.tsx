const Loader = () => {
  return (
    <div className="fixed inset-0 bg-jetblack flex flex-col items-center justify-center z-50">
      {/* Inline keyframes scoped to the loader */}
      <style>{`
        @keyframes handSweep { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes tick { 0%, 90% { opacity: .25; } 95% { opacity: 1; } 100% { opacity: .25; } }
        @keyframes buttonPulse { 0% { transform: scale(1); opacity: .4; } 50% { transform: scale(1.15); opacity: .9; } 100% { transform: scale(1); opacity: .4; } }
        @keyframes dialGlow { 0%, 100% { opacity: .16; } 50% { opacity: .28; } }
      `}</style>
      {/* Sport stopwatch loader */}
      <div className="relative w-[164px] h-[164px] mb-4">
        <svg viewBox="0 0 164 164" className="w-full h-full">
          <defs>
            <radialGradient id="dialBg" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#0f0f0f" />
              <stop offset="100%" stopColor="#0b0b0b" />
            </radialGradient>
          </defs>
          {/* Body */}
          <circle cx="82" cy="88" r="64" fill="url(#dialBg)" stroke="#1f2937" strokeWidth="2" />
          {/* Crown */}
          <rect x="74" y="18" width="16" height="10" rx="2" fill="#1f2937" />
          <rect x="70" y="10" width="24" height="10" rx="3" fill="#ffffff" opacity=".1" />
          {/* Buttons */}
          <circle cx="130" cy="50" r="6" fill="#ffffff" opacity=".5" style={{ animation: 'buttonPulse 1.8s .2s ease-in-out infinite' }} />
          <circle cx="34" cy="50" r="6" fill="#ffffff" opacity=".35" style={{ animation: 'buttonPulse 1.8s .6s ease-in-out infinite' }} />

          {/* Dial ticks */}
          {Array.from({length:12}).map((_,i)=>{
            const angle = (i/12)*2*Math.PI;
            const x1 = 82 + Math.cos(angle)*50;
            const y1 = 88 + Math.sin(angle)*50;
            const x2 = 82 + Math.cos(angle)*58;
            const y2 = 88 + Math.sin(angle)*58;
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ffffff" strokeOpacity="0.3" strokeWidth={i%3===0?2:1} />
            );
          })}

          {/* Inner glow ring */}
          <circle cx="82" cy="88" r="44" fill="none" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="2" style={{ animation: 'dialGlow 2.2s ease-in-out infinite' }} />

          {/* Hand */}
          <g style={{ transformOrigin: '82px 88px', animation: 'handSweep 1.2s cubic-bezier(.4,.1,.2,1) infinite' }}>
            <line x1="82" y1="88" x2="82" y2="34" stroke="#ffffff" strokeWidth="2" />
            <circle cx="82" cy="88" r="3" fill="#ffffff" />
            {/* tip marker */}
            <circle cx="82" cy="34" r="4" fill="#ffffff" />
          </g>

          {/* Second ticks pulse at 12, 3, 6, 9 */}
          <circle cx="82" cy="30" r="3" fill="#ffffff" style={{ animation: 'tick 1.2s .0s linear infinite' }} />
          <circle cx="136" cy="88" r="3" fill="#ffffff" style={{ animation: 'tick 1.2s .3s linear infinite' }} />
          <circle cx="82" cy="146" r="3" fill="#ffffff" style={{ animation: 'tick 1.2s .6s linear infinite' }} />
          <circle cx="28" cy="88" r="3" fill="#ffffff" style={{ animation: 'tick 1.2s .9s linear infinite' }} />
        </svg>
      </div>

      <h2 className="text-xl md:text-2xl font-bold text-white">RAYO SPORT</h2>
      <p className="text-white mt-1">Préparation du terrain...</p>
    </div>
  );
};

export default Loader;