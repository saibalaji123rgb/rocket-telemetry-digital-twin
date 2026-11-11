import React from 'react';
import { TelemetryFrame } from '../../types/telemetry';
import DigitalTwin3D from '../DigitalTwin3D';
import { Rocket } from 'lucide-react';

interface DigitalTwinViewProps {
  telemetry: TelemetryFrame;
}

export default function DigitalTwinView({ telemetry }: DigitalTwinViewProps) {
  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col space-y-3 font-sans">
      {/* Top Controls Header */}
      <div className="panel-glass p-4 rounded-2xl flex justify-between items-center shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_15px_rgba(0,240,255,0.25)]">
            <Rocket className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm md:text-base font-orbitron font-extrabold text-white tracking-widest uppercase glow-text-cyan">
              DIGITAL TWIN • 3D SPATIAL ROCKET ENVIRONMENT
            </h1>
            <p className="text-xs font-rajdhani font-bold text-slate-200 tracking-wider mt-0.5">
              REALTIME THREE.JS ATTITUDE & POSITIONING KINEMATICS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs md:text-sm font-mono font-bold">
          <div className="bg-[#050814] border border-[#1e2d4a] px-3.5 py-1.5 rounded-xl text-slate-200 font-rajdhani">
            ROLL: <strong className="text-[#00F0FF] font-orbitron font-extrabold font-mono-num glow-text-cyan">{telemetry.roll?.toFixed(1) || '0.0'}°</strong>
          </div>
          <div className="bg-[#050814] border border-[#1e2d4a] px-3.5 py-1.5 rounded-xl text-slate-200 font-rajdhani">
            PITCH: <strong className="text-[#A855F7] font-orbitron font-extrabold font-mono-num">{telemetry.pitch?.toFixed(1) || '0.0'}°</strong>
          </div>
          <div className="bg-[#050814] border border-[#1e2d4a] px-3.5 py-1.5 rounded-xl text-slate-200 font-rajdhani">
            ALTITUDE: <strong className="text-[#00E676] font-orbitron font-extrabold font-mono-num glow-text-emerald">{telemetry.altitude?.toFixed(1) || '0.0'} m</strong>
          </div>
        </div>
      </div>

      {/* Main 3D Canvas Viewport */}
      <div className="flex-1 w-full relative rounded-2xl overflow-hidden shadow-xl border border-[#1e2d4a]">
        <DigitalTwin3D telemetry={telemetry} />
      </div>
    </div>
  );
}

