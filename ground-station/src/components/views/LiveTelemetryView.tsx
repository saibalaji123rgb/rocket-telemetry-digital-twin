import React from 'react';
import { TelemetryFrame, PacketStatistics } from '../../types/telemetry';
import {
  Activity, Hash, MapPin, Navigation, Mountain, Gauge,
  Thermometer, Compass, Satellite, Zap, ShieldAlert, Radio, Signal, CheckCircle2
} from 'lucide-react';

interface LiveTelemetryViewProps {
  telemetry: TelemetryFrame;
  stats: PacketStatistics;
}

export default function LiveTelemetryView({ telemetry, stats }: LiveTelemetryViewProps) {
  const fields = [
    { label: 'LATITUDE', valNum: `${telemetry.latitude ? telemetry.latitude.toFixed(6) : '0.000000'}`, unit: '° N', icon: MapPin, color: 'text-[#38BDF8]', desc: 'WGS84 Latitude positioning coordinate' },
    { label: 'LONGITUDE', valNum: `${telemetry.longitude ? telemetry.longitude.toFixed(6) : '0.000000'}`, unit: '° E', icon: Navigation, color: 'text-[#38BDF8]', desc: 'WGS84 Longitude positioning coordinate' },
    { label: 'ROLL ATTITUDE', valNum: `${telemetry.roll > 0 ? '+' : ''}${telemetry.roll?.toFixed(1) || '0.0'}`, unit: '°', icon: Compass, color: 'text-[#38BDF8]', desc: 'Lateral roll rotation angle' },
    { label: 'PITCH ATTITUDE', valNum: `${telemetry.pitch > 0 ? '+' : ''}${telemetry.pitch?.toFixed(1) || '0.0'}`, unit: '°', icon: Compass, color: 'text-[#A855F7]', desc: 'Longitudinal pitch angle' },
    { label: 'SPEED', valNum: `${telemetry.speed?.toFixed(1) || '0.0'}`, unit: 'm/s', icon: Gauge, color: 'text-[#00E676] glow-text-emerald', desc: 'Estimated ground speed velocity' },
    { label: 'TEMPERATURE', valNum: `${telemetry.temperature?.toFixed(1) || '0.0'}`, unit: '°C', icon: Thermometer, color: telemetry.temperature > 40 ? 'text-[#FF2E93] glow-text-red' : 'text-[#FFB703] glow-text-amber', desc: 'BMP280 sensor ambient temperature' },
    { label: 'PRESSURE', valNum: `${telemetry.pressure?.toFixed(1) || '0.0'}`, unit: 'hPa', icon: Activity, color: 'text-[#A855F7]', desc: 'BMP280 barometric pressure' },
    { label: 'ALTITUDE', valNum: `${telemetry.altitude?.toFixed(1) || '0.0'}`, unit: 'm', icon: Mountain, color: 'text-[#00E676] glow-text-emerald', desc: 'Barometric / GPS spatial altitude' },
    { label: 'VIBRATION STATUS', valNum: telemetry.vibration === 1 ? 'HIGH ALERT' : 'NOMINAL', unit: '', icon: telemetry.vibration === 1 ? ShieldAlert : Zap, color: telemetry.vibration === 1 ? 'text-[#FF2E93] glow-text-red' : 'text-[#00E676] glow-text-emerald', desc: 'Structural vibration sensor state' },
    { label: 'GPS SATELLITES', valNum: `${telemetry.satellites || 0}`, unit: 'SATS', icon: Satellite, color: telemetry.satellites >= 6 ? 'text-[#00E676] glow-text-emerald' : 'text-[#FFB703]', desc: 'Active satellite constellation fix' },
    { label: 'LORA RSSI', valNum: `${telemetry.rssi || -100}`, unit: 'dBm', icon: Radio, color: 'text-[#38BDF8]', desc: 'Received Signal Strength Indicator' },
    { label: 'LORA SNR', valNum: `${telemetry.snr || 0}`, unit: 'dB', icon: Signal, color: 'text-[#00F0FF] glow-text-cyan', desc: 'Signal-to-Noise Ratio' },
  ];

  return (
    <div className="space-y-4 font-sans">
      {/* View Header */}
      <div className="panel-glass p-5 rounded-2xl flex flex-wrap justify-between items-center shadow-xl gap-3">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_15px_rgba(0,240,255,0.25)]">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-orbitron font-extrabold text-white tracking-widest uppercase glow-text-cyan">
              LIVE TELEMETRY STREAM MONITOR
            </h1>
            <p className="text-xs md:text-sm font-rajdhani font-bold text-slate-200 tracking-wider mt-0.5">
              REAL-TIME UART/LORA PARAMETER STREAM • 13 ACTIVE TELEMETRY METRICS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs md:text-sm font-mono font-bold">
          <div className="bg-[#050814] border border-[#1e2d4a] px-3.5 py-2 rounded-xl">
            <span className="text-slate-300 font-rajdhani font-bold mr-1">TIMESTAMP:</span>
            <span className="text-white font-mono-num">{telemetry.timestamp}</span>
          </div>
          <div className="bg-[#050814] border border-[#1e2d4a] px-3.5 py-2 rounded-xl">
            <span className="text-slate-300 font-rajdhani font-bold mr-1">RATE:</span>
            <span className="text-[#00E676] font-orbitron font-extrabold glow-text-emerald">{stats.packetRateHz} Hz</span>
          </div>
        </div>
      </div>

      {/* Grid: 1 Full-Width Top Feature Banner + 12 Parameter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Featured Packet ID & Telemetry Stream Banner Card */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4 bg-[#0b1429]/90 backdrop-blur-md rounded-2xl p-4.5 border border-[#00F0FF]/40 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 shrink-0">
              <Hash className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-rajdhani font-extrabold text-slate-300 uppercase tracking-wider">
                  ACTIVE PACKET IDENTIFIER
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#00E676]/15 border border-[#00E676]/40 text-xs font-orbitron font-extrabold text-[#00E676] flex items-center gap-1.5 glow-text-emerald">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00E676]" />
                  CRC VERIFIED
                </span>
              </div>
              <span className="text-2xl md:text-3xl font-orbitron font-extrabold text-[#00F0FF] font-mono-num glow-text-cyan block mt-0.5">
                #{telemetry.packetId || 0}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm font-mono font-bold">
            <div className="bg-[#050814] border border-[#1e2d4a] px-4 py-2 rounded-xl flex items-center gap-2">
              <span className="text-slate-300 font-rajdhani font-bold">FLIGHT STATUS:</span>
              <span className="text-[#00F0FF] font-orbitron font-extrabold glow-text-cyan">{telemetry.flightStatus || 'NOMINAL'}</span>
            </div>
            <div className="bg-[#050814] border border-[#1e2d4a] px-4 py-2 rounded-xl flex items-center gap-2">
              <span className="text-slate-300 font-rajdhani font-bold">SYSTEM MODE:</span>
              <span className="text-[#00E676] font-orbitron font-extrabold glow-text-emerald">{telemetry.systemMode || 'ACTIVE'}</span>
            </div>
          </div>
        </div>

        {/* 12 Parameter Cards (3 rows of 4 cols) */}
        {fields.map((f, i) => {
          const IconComp = f.icon;
          return (
            <div key={i} className="bg-[#0b1429]/90 backdrop-blur-md rounded-2xl p-4.5 border border-[#1e2d4a] hover:border-[#00F0FF]/50 transition-all duration-200 shadow-xl flex flex-col justify-between space-y-4">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <span className="text-xs font-rajdhani font-extrabold text-white uppercase tracking-wider block">
                    {f.label}
                  </span>
                  <span className="text-xs font-rajdhani font-bold text-slate-300 block mt-1 leading-snug">
                    {f.desc}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#050814] border border-[#1e2d4a] shrink-0">
                  <IconComp className={`w-5 h-5 ${f.color}`} />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#1e2d4a]">
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-xl md:text-2xl font-orbitron font-extrabold font-mono-num ${f.color}`}>
                    {f.valNum}
                  </span>
                  {f.unit && (
                    <span className="text-xs md:text-sm font-rajdhani font-bold text-slate-300">
                      {f.unit}
                    </span>
                  )}
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#00E676]/15 border border-[#00E676]/40 text-xs font-orbitron font-extrabold text-[#00E676] flex items-center gap-1.5 glow-text-emerald">
                  <span className="h-2 w-2 rounded-full bg-[#00E676] animate-pulse"></span>
                  LIVE
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


