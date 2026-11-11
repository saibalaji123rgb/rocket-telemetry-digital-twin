import React from 'react';
import { Compass } from 'lucide-react';

interface ArtificialHorizonProps {
  roll: number;
  pitch: number;
}

export default function ArtificialHorizon({ roll, pitch }: ArtificialHorizonProps) {
  // Clamped pitch offset for visualization (-90 to +90 deg maps to Y offset -40 to +40 px)
  const pitchOffset = Math.max(-40, Math.min(40, pitch * 0.8));

  return (
    <div className="flex flex-col items-center justify-center p-3.5 panel-glass rounded-xl shadow-lg space-y-2.5 font-sans">
      <div className="flex items-center justify-between w-full border-b border-[#1e2d4a] pb-2">
        <span className="text-xs md:text-sm font-orbitron font-extrabold text-white tracking-widest uppercase flex items-center gap-2 glow-text-cyan">
          <Compass className="w-4 h-4 text-[#00F0FF] animate-spin" style={{ animationDuration: '12s' }} />
          ARTIFICIAL HORIZON
        </span>
        <span className="text-xs font-rajdhani font-bold text-[#00F0FF] bg-[#00F0FF]/15 px-2.5 py-0.5 rounded-full border border-[#00F0FF]/40 tracking-wider">
          ATTITUDE IND
        </span>
      </div>

      <div className="relative w-40 h-40 rounded-full overflow-hidden border-2 border-[#00F0FF]/40 bg-[#050814] flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.25)]">
        {/* Pitch & Roll Rotating Sphere Background */}
        <div
          className="absolute inset-[-50%] transition-transform duration-300 ease-out flex flex-col"
          style={{
            transform: `rotate(${roll}deg) translateY(${pitchOffset}px)`
          }}
        >
          {/* Sky (Blue to Cyan) */}
          <div className="w-full h-1/2 bg-gradient-to-b from-[#1e40af] via-[#2563eb] to-[#0284c7] flex items-end justify-center pb-2">
            <div className="w-full h-[1px] bg-cyan-200/50"></div>
          </div>
          {/* Horizon Line */}
          <div className="w-full h-[2px] bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]"></div>
          {/* Ground (Dark Amber/Slate) */}
          <div className="w-full h-1/2 bg-gradient-to-b from-[#1e293b] via-[#0f172a] to-[#050814] flex items-start justify-center pt-2">
            <div className="w-full h-[1px] bg-slate-700/50"></div>
          </div>
        </div>

        {/* Pitch Scale Lines */}
        <div
          className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center space-y-3 z-10"
          style={{ transform: `rotate(${roll}deg)` }}
        >
          <div className="w-8 h-[1px] bg-white/70"></div>
          <div className="w-12 h-[1.5px] bg-white/90"></div>
          <div className="w-16 h-[2px] bg-[#00F0FF]"></div>
          <div className="w-12 h-[1.5px] bg-white/90"></div>
          <div className="w-8 h-[1px] bg-white/70"></div>
        </div>

        {/* Aircraft Reference Crosshair (Fixed Foreground) */}
        <div className="absolute z-20 pointer-events-none flex items-center justify-center">
          <div className="w-14 h-[2.5px] bg-[#FFB703] rounded shadow-[0_0_8px_#FFB703]"></div>
          <div className="w-3.5 h-3.5 rounded-full border-2 border-[#FFB703] bg-[#FFB703]/30 absolute shadow-[0_0_10px_#FFB703]"></div>
          <div className="w-[2.5px] h-7 bg-[#FFB703] rounded absolute shadow-[0_0_8px_#FFB703]"></div>
        </div>
      </div>

      {/* Numerical Roll & Pitch Values */}
      <div className="flex justify-around w-full pt-1.5 font-rajdhani">
        <div className="text-center">
          <span className="text-xs font-extrabold text-slate-300 block tracking-widest">ROLL</span>
          <span className="text-sm md:text-base text-[#00F0FF] font-orbitron font-extrabold font-mono-num glow-text-cyan">
            {roll > 0 ? `+${roll.toFixed(1)}` : (roll ? roll.toFixed(1) : '0.0')}°
          </span>
        </div>
        <div className="h-7 w-[1px] bg-[#1e2d4a]"></div>
        <div className="text-center">
          <span className="text-xs font-extrabold text-slate-300 block tracking-widest">PITCH</span>
          <span className="text-sm md:text-base text-[#00E676] font-orbitron font-extrabold font-mono-num glow-text-emerald">
            {pitch > 0 ? `+${pitch.toFixed(1)}` : (pitch ? pitch.toFixed(1) : '0.0')}°
          </span>
        </div>
      </div>
    </div>
  );
}
