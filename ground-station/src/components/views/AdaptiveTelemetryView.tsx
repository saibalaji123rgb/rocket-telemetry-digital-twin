import React from 'react';
import { TelemetryFrame, PacketStatistics } from '../../types/telemetry';
import AdaptiveTelemetryCard from '../AdaptiveTelemetryCard';
import { Radio } from 'lucide-react';

interface AdaptiveTelemetryViewProps {
  telemetry: TelemetryFrame;
  stats: PacketStatistics;
}

export default function AdaptiveTelemetryView({ telemetry, stats }: AdaptiveTelemetryViewProps) {
  return (
    <div className="space-y-4 font-sans">
      {/* View Header */}
      <div className="panel-glass p-5 rounded-2xl flex flex-wrap justify-between items-center shadow-xl gap-3">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_15px_rgba(0,240,255,0.25)]">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-orbitron font-extrabold text-white tracking-widest uppercase glow-text-cyan">
              ADAPTIVE TELEMETRY MONITORING
            </h1>
            <p className="text-xs md:text-sm font-rajdhani font-bold text-slate-200 tracking-wider mt-0.5">
              DYNAMIC ADAPTIVE TRANSMISSION RATE & SIGNAL QUALITY MODULE
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs md:text-sm font-mono font-bold">
          <div className="bg-[#050814] border border-[#1e2d4a] px-3.5 py-2 rounded-xl">
            <span className="text-slate-300 font-rajdhani font-bold mr-1">RSSI:</span>
            <span className="text-[#38BDF8] font-mono-num">{telemetry.rssi || -85} dBm</span>
          </div>
          <div className="bg-[#050814] border border-[#1e2d4a] px-3.5 py-2 rounded-xl">
            <span className="text-slate-300 font-rajdhani font-bold mr-1">SNR:</span>
            <span className="text-[#00F0FF] font-mono-num">{telemetry.snr || 8.5} dB</span>
          </div>
        </div>
      </div>

      {/* Adaptive Telemetry Full Card & Analytics */}
      <AdaptiveTelemetryCard telemetry={telemetry} stats={stats} showFullModule={true} />
    </div>
  );
}
