import React from 'react';
import { TelemetryFrame } from '../../types/telemetry';
import { MapPin, Navigation, Satellite, Mountain } from 'lucide-react';

interface MapTrackingViewProps {
  telemetry: TelemetryFrame;
}

export default function MapTrackingView({ telemetry }: MapTrackingViewProps) {
  const launchPadLat = 13.082700;
  const launchPadLon = 80.270700;

  const currentLat = telemetry.latitude || launchPadLat;
  const currentLon = telemetry.longitude || launchPadLon;

  // Approximate Haversine distance in meters from launch pad
  const latDiff = (currentLat - launchPadLat) * 111000;
  const lonDiff = (currentLon - launchPadLon) * 111000 * Math.cos((launchPadLat * Math.PI) / 180);
  const distanceTravelled = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);

  return (
    <div className="space-y-4 font-sans">
      {/* Top Header Bar */}
      <div className="panel-glass p-5 rounded-2xl flex justify-between items-center shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_15px_rgba(0,240,255,0.25)]">
            <MapPin className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-orbitron font-extrabold text-white tracking-widest uppercase glow-text-cyan">
              GPS MAP & TRAJECTORY TRACKING SYSTEM
            </h1>
            <p className="text-xs md:text-sm font-rajdhani font-bold text-slate-200 tracking-wider mt-0.5">
              WGS-84 REALTIME GEOSPATIAL LOCATION & SATELLITE FIX CONSTELLATION
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs md:text-sm font-mono font-bold">
          <div className="bg-[#050814] border border-[#1e2d4a] px-4 py-2 rounded-xl">
            <span className="text-slate-300 font-rajdhani font-bold mr-1">SAT FIX:</span>
            <span className={`font-orbitron font-extrabold ${telemetry.satellites >= 6 ? 'text-[#00E676] glow-text-emerald' : 'text-[#FFB703] glow-text-amber'}`}>
              {telemetry.satellites || 0} SATS ({telemetry.satellites >= 4 ? '3D FIX' : 'NO FIX'})
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Map Canvas left, Position Stats right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Radar / Geospatial Map Simulation Viewport (8 cols) */}
        <div className="lg:col-span-8 bg-[#0b1429]/90 backdrop-blur-md rounded-2xl p-5 border border-[#1e2d4a] relative min-h-[460px] flex flex-col justify-between shadow-xl overflow-hidden">
          {/* Map Grid SVG Background */}
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00F0FF" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#gridPattern)" />
              <circle cx="50%" cy="50%" r="120" fill="none" stroke="#00F0FF" strokeWidth="1" strokeDasharray="4 4" />
              <circle cx="50%" cy="50%" r="220" fill="none" stroke="#00F0FF" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#00F0FF" strokeWidth="1" opacity="0.4" />
              <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#00F0FF" strokeWidth="1" opacity="0.4" />
            </svg>
          </div>

          {/* Map Top Banner */}
          <div className="relative z-10 flex flex-wrap justify-between items-center bg-[#050814]/90 p-3 rounded-xl border border-[#1e2d4a] gap-2">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#00E676] animate-pulse"></span>
              <span className="text-xs md:text-sm font-rajdhani font-extrabold text-white tracking-wider">LIVE SATELLITE TRACKING CANVAS</span>
            </div>
            <span className="text-xs text-[#00F0FF] font-mono font-bold">ORIGIN: SHAR LAUNCH PAD (13.0827°N, 80.2707°E)</span>
          </div>

          {/* Center Target Pointer Visual */}
          <div className="relative z-10 my-auto flex flex-col items-center justify-center space-y-3 py-12">
            <div className="relative flex items-center justify-center">
              <div className="p-4 rounded-full bg-gradient-to-r from-[#00F0FF] to-[#2563EB] text-black shadow-[0_0_25px_rgba(0,240,255,0.6)] z-10">
                <Navigation className="w-8 h-8 transform rotate-45" />
              </div>
            </div>
            <div className="bg-[#050814]/90 border border-[#00F0FF]/40 px-4 py-2.5 rounded-xl text-center shadow-xl backdrop-blur-md">
              <span className="text-sm md:text-base font-orbitron font-extrabold text-white block font-mono-num glow-text-cyan">
                {currentLat.toFixed(6)}° N, {currentLon.toFixed(6)}° E
              </span>
              <span className="text-xs font-rajdhani font-bold text-slate-300 tracking-wider">ROCKET CURRENT GEOSPATIAL FIX</span>
            </div>
          </div>

          {/* Map Bottom Status Bar */}
          <div className="relative z-10 grid grid-cols-3 gap-3 text-center bg-[#050814]/90 p-3 rounded-xl border border-[#1e2d4a]">
            <div className="flex flex-col items-center">
              <span className="text-xs font-rajdhani font-extrabold text-slate-300 block tracking-wider">LATITUDE</span>
              <div className="flex items-baseline gap-1">
                <span className="text-sm md:text-base font-orbitron font-extrabold text-white font-mono-num">{currentLat.toFixed(6)}</span>
                <span className="text-xs font-rajdhani font-bold text-slate-300">° N</span>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs font-rajdhani font-extrabold text-slate-300 block tracking-wider">LONGITUDE</span>
              <div className="flex items-baseline gap-1">
                <span className="text-sm md:text-base font-orbitron font-extrabold text-white font-mono-num">{currentLon.toFixed(6)}</span>
                <span className="text-xs font-rajdhani font-bold text-slate-300">° E</span>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs font-rajdhani font-extrabold text-slate-300 block tracking-wider">ALTITUDE</span>
              <div className="flex items-baseline gap-1">
                <span className="text-sm md:text-base font-orbitron font-extrabold text-[#00E676] font-mono-num glow-text-emerald">{telemetry.altitude?.toFixed(1) || '0.0'}</span>
                <span className="text-xs font-rajdhani font-bold text-slate-300">m</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Info Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: Distance Travelled */}
          <div className="bg-[#0b1429]/90 backdrop-blur-md p-4.5 rounded-2xl border border-[#1e2d4a] shadow-xl space-y-3">
            <div className="flex justify-between items-center border-b border-[#1e2d4a] pb-2.5">
              <span className="text-xs font-orbitron font-extrabold text-white uppercase tracking-wider flex items-center gap-2 glow-text-cyan">
                <Navigation className="w-4 h-4 text-[#00F0FF]" />
                DISTANCE FROM LAUNCH PAD
              </span>
            </div>
            <div className="pt-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl md:text-3xl font-orbitron font-extrabold text-white font-mono-num block glow-text-cyan">
                  {distanceTravelled > 1000
                    ? (distanceTravelled / 1000).toFixed(2)
                    : distanceTravelled.toFixed(1)}
                </span>
                <span className="text-sm font-rajdhani font-bold text-slate-300">
                  {distanceTravelled > 1000 ? 'km' : 'm'}
                </span>
              </div>
              <span className="text-xs font-rajdhani font-bold text-slate-300 mt-1 block">Calculated ground displacement vector</span>
            </div>
          </div>

          {/* Card 2: GPS Constellation Info */}
          <div className="bg-[#0b1429]/90 backdrop-blur-md p-4.5 rounded-2xl border border-[#1e2d4a] shadow-xl space-y-3">
            <div className="flex justify-between items-center border-b border-[#1e2d4a] pb-2.5">
              <span className="text-xs font-orbitron font-extrabold text-white uppercase tracking-wider flex items-center gap-2 glow-text-cyan">
                <Satellite className="w-4 h-4 text-[#00F0FF]" />
                GPS CONSTELLATION STATUS
              </span>
            </div>
            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-[#050814] border border-[#1e2d4a]">
                <span className="text-slate-300 font-rajdhani font-bold text-xs">SATELLITES TRACKED:</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-[#00E676] font-orbitron font-extrabold text-xs glow-text-emerald">{telemetry.satellites || 0}</span>
                  <span className="text-slate-300 font-rajdhani font-bold text-xs">SATS</span>
                </div>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-[#050814] border border-[#1e2d4a]">
                <span className="text-slate-300 font-rajdhani font-bold text-xs">FIX TYPE:</span>
                <span className="text-white font-orbitron font-extrabold text-xs">
                  {telemetry.satellites >= 6 ? '3D FIX (NOMINAL)' : '2D / SEARCHING'}
                </span>
              </div>
              <div className="flex justify-between items-center p-2.5 rounded-xl bg-[#050814] border border-[#1e2d4a]">
                <span className="text-slate-300 font-rajdhani font-bold text-xs">DATUM MODEL:</span>
                <span className="text-[#00F0FF] font-orbitron font-extrabold text-xs">WGS-84</span>
              </div>
            </div>
          </div>

          {/* Card 3: Altitude & Position Vector */}
          <div className="bg-[#0b1429]/90 backdrop-blur-md p-4.5 rounded-2xl border border-[#1e2d4a] shadow-xl space-y-3">
            <div className="flex justify-between items-center border-b border-[#1e2d4a] pb-2.5">
              <span className="text-xs font-orbitron font-extrabold text-white uppercase tracking-wider flex items-center gap-2 glow-text-emerald">
                <Mountain className="w-4 h-4 text-[#00E676]" />
                VERTICAL SPATIAL ALTITUDE
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl md:text-3xl font-orbitron font-extrabold text-[#00E676] font-mono-num block glow-text-emerald">
                  {telemetry.altitude?.toFixed(1) || '0.0'}
                </span>
                <span className="text-sm font-rajdhani font-bold text-slate-300">m</span>
              </div>
              <span className="text-xs font-rajdhani font-bold text-slate-300 mt-1 block">MSL Elevation above sea level</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

