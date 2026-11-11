import React from 'react';
import { TelemetryFrame, PacketStatistics } from '../../types/telemetry';
import MissionReliabilityCard from '../MissionReliabilityCard';
import { ShieldCheck } from 'lucide-react';

interface MissionReliabilityViewProps {
  telemetry: TelemetryFrame;
  stats: PacketStatistics;
}

export default function MissionReliabilityView({ telemetry, stats }: MissionReliabilityViewProps) {
  return (
    <div className="space-y-4 font-sans">
      {/* View Header */}
      <div className="panel-glass p-5 rounded-2xl flex flex-wrap justify-between items-center shadow-xl gap-3">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_15px_rgba(0,240,255,0.25)]">
            <ShieldCheck className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-orbitron font-extrabold text-white tracking-widest uppercase glow-text-cyan">
              MISSION RELIABILITY SCORE (MRS)
            </h1>
            <p className="text-xs md:text-sm font-rajdhani font-bold text-slate-200 tracking-wider mt-0.5">
              COMPOSITE EVALUATION METRIC FOR ESP32 + LORA ROCKET TELEMETRY
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs md:text-sm font-mono font-bold">
          <div className="bg-[#050814] border border-[#1e2d4a] px-3.5 py-2 rounded-xl">
            <span className="text-slate-300 font-rajdhani font-bold mr-1">PACKETS RECEIVED:</span>
            <span className="text-[#00E676] font-mono-num">{stats.packetsReceived}</span>
          </div>
          <div className="bg-[#050814] border border-[#1e2d4a] px-3.5 py-2 rounded-xl">
            <span className="text-slate-300 font-rajdhani font-bold mr-1">LOSS RATE:</span>
            <span className="text-[#FF2E93] font-mono-num">{stats.packetLossPercentage}%</span>
          </div>
        </div>
      </div>

      {/* Mission Reliability Full Card & Analytics */}
      <MissionReliabilityCard telemetry={telemetry} stats={stats} showFullModule={true} />
    </div>
  );
}
