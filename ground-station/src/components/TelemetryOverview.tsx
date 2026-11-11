import React from 'react';
import { TelemetryFrame } from '../types/telemetry';
import {
  Hash, MapPin, Navigation, Mountain, Gauge, Thermometer,
  Compass, Satellite, Activity, Zap, ShieldAlert
} from 'lucide-react';

interface TelemetryOverviewProps {
  telemetry: TelemetryFrame;
}

export default function TelemetryOverview({ telemetry }: TelemetryOverviewProps) {
  const cards = [
    {
      title: 'PACKET ID',
      value: telemetry.packetId || 0,
      unit: '#',
      icon: Hash,
      color: 'text-[#00F0FF] glow-text-cyan',
      iconBg: 'bg-[#00F0FF]/10 text-[#00F0FF] border-[#00F0FF]/30'
    },
    {
      title: 'LATITUDE',
      value: telemetry.latitude ? telemetry.latitude.toFixed(6) : '0.000000',
      unit: '° N',
      icon: MapPin,
      color: 'text-[#38BDF8]',
      iconBg: 'bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/30'
    },
    {
      title: 'LONGITUDE',
      value: telemetry.longitude ? telemetry.longitude.toFixed(6) : '0.000000',
      unit: '° E',
      icon: Navigation,
      color: 'text-[#38BDF8]',
      iconBg: 'bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/30'
    },
    {
      title: 'ALTITUDE',
      value: telemetry.altitude ? telemetry.altitude.toFixed(1) : '0.0',
      unit: 'm',
      icon: Mountain,
      color: 'text-[#00E676] glow-text-emerald',
      iconBg: 'bg-[#00E676]/10 text-[#00E676] border-[#00E676]/30'
    },
    {
      title: 'SPEED',
      value: telemetry.speed ? telemetry.speed.toFixed(1) : '0.0',
      unit: 'm/s',
      icon: Gauge,
      color: 'text-[#00F0FF] glow-text-cyan',
      iconBg: 'bg-[#00F0FF]/10 text-[#00F0FF] border-[#00F0FF]/30'
    },
    {
      title: 'TEMPERATURE',
      value: telemetry.temperature ? telemetry.temperature.toFixed(1) : '0.0',
      unit: '°C',
      icon: Thermometer,
      color: telemetry.temperature > 40 ? 'text-[#FF2E93] glow-text-red' : 'text-[#FFB703] glow-text-amber',
      iconBg: telemetry.temperature > 40 ? 'bg-[#FF2E93]/10 text-[#FF2E93] border-[#FF2E93]/30' : 'bg-[#FFB703]/10 text-[#FFB703] border-[#FFB703]/30'
    },
    {
      title: 'PRESSURE',
      value: telemetry.pressure ? telemetry.pressure.toFixed(1) : '0.0',
      unit: 'hPa',
      icon: Activity,
      color: 'text-[#A855F7]',
      iconBg: 'bg-[#A855F7]/10 text-[#A855F7] border-[#A855F7]/30'
    },
    {
      title: 'ROLL ATTITUDE',
      value: telemetry.roll > 0 ? `+${telemetry.roll.toFixed(1)}` : (telemetry.roll ? telemetry.roll.toFixed(1) : '0.0'),
      unit: '°',
      icon: Compass,
      color: 'text-[#38BDF8]',
      iconBg: 'bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/30'
    },
    {
      title: 'PITCH ATTITUDE',
      value: telemetry.pitch > 0 ? `+${telemetry.pitch.toFixed(1)}` : (telemetry.pitch ? telemetry.pitch.toFixed(1) : '0.0'),
      unit: '°',
      icon: Compass,
      color: 'text-[#38BDF8]',
      iconBg: 'bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/30'
    },
    {
      title: 'GPS SATELLITES',
      value: telemetry.satellites || 0,
      unit: 'SATS',
      icon: Satellite,
      color: telemetry.satellites >= 6 ? 'text-[#00E676] glow-text-emerald' : 'text-[#FFB703]',
      iconBg: telemetry.satellites >= 6 ? 'bg-[#00E676]/10 text-[#00E676] border-[#00E676]/30' : 'bg-[#FFB703]/10 text-[#FFB703] border-[#FFB703]/30'
    },
    {
      title: 'VIBRATION SENSOR',
      value: telemetry.vibration === 1 ? 'HIGH ALERT' : 'NOMINAL',
      unit: '',
      icon: telemetry.vibration === 1 ? ShieldAlert : Zap,
      color: telemetry.vibration === 1 ? 'text-[#FF2E93] glow-text-red' : 'text-[#00E676] glow-text-emerald',
      iconBg: telemetry.vibration === 1 ? 'bg-[#FF2E93]/10 text-[#FF2E93] border-[#FF2E93]/30' : 'bg-[#00E676]/10 text-[#00E676] border-[#00E676]/30'
    }
  ];

  return (
    <div className="panel-glass rounded-xl p-4 h-full flex flex-col font-sans space-y-3.5">
      <div className="flex items-center justify-between border-b border-[#1e2d4a] pb-3 px-1">
        <h2 className="text-sm font-orbitron font-extrabold text-white tracking-widest uppercase flex items-center gap-2 glow-text-cyan">
          <Activity className="w-5 h-5 text-[#00F0FF] animate-pulse" />
          TELEMETRY OVERVIEW
        </h2>
        <span className="text-xs font-rajdhani font-bold text-[#00F0FF] bg-[#00F0FF]/15 px-2.5 py-1 rounded-full border border-[#00F0FF]/40 tracking-wider">
          11 LIVE PARAMS
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5 flex-1 overflow-y-auto pr-0.5">
        {cards.map((c, idx) => {
          const IconComp = c.icon;
          return (
            <div
              key={idx}
              className="p-3 rounded-xl bg-[#0b1429]/80 border border-[#1e2d4a] flex items-center justify-between hover:border-[#00F0FF]/50 hover:bg-[#0f1b36] transition-all duration-200 group shadow-sm hover:shadow-[0_0_15px_rgba(0,240,255,0.15)]"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${c.iconBg} group-hover:scale-105 transition-transform duration-200 shrink-0`}>
                  <IconComp className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-rajdhani font-extrabold text-slate-300 block leading-tight uppercase tracking-wider">{c.title}</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className={`text-lg lg:text-xl font-orbitron font-extrabold font-mono-num ${c.color}`}>{c.value}</span>
                    {c.unit && <span className="text-xs font-rajdhani font-bold text-slate-300">{c.unit}</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
