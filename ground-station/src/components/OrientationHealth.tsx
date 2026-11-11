import React from 'react';
import { TelemetryFrame, SystemHealth, AlertItem } from '../types/telemetry';
import ArtificialHorizon from './ArtificialHorizon';
import { ShieldCheck, Cpu, Radio, Usb, Satellite, Activity, AlertTriangle } from 'lucide-react';

interface OrientationHealthProps {
  telemetry: TelemetryFrame;
  health: SystemHealth;
  alerts: AlertItem[];
}

export default function OrientationHealth({ telemetry, health, alerts }: OrientationHealthProps) {
  const getHealthBadge = (status: 'NOMINAL' | 'WARNING' | 'CRITICAL') => {
    switch (status) {
      case 'NOMINAL':
        return (
          <span className="flex items-center gap-1.5 text-xs font-orbitron font-extrabold text-[#00E676] bg-[#00E676]/15 px-3 py-1 rounded-full border border-[#00E676]/40 glow-text-emerald">
            <span className="h-2 w-2 rounded-full bg-[#00E676] animate-pulse"></span>
            NOMINAL
          </span>
        );
      case 'WARNING':
        return (
          <span className="flex items-center gap-1.5 text-xs font-orbitron font-extrabold text-[#FFB703] bg-[#FFB703]/15 px-3 py-1 rounded-full border border-[#FFB703]/40 glow-text-amber">
            <span className="h-2 w-2 rounded-full bg-[#FFB703] animate-pulse"></span>
            WARNING
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-xs font-orbitron font-extrabold text-[#FF2E93] bg-[#FF2E93]/15 px-3 py-1 rounded-full border border-[#FF2E93]/40 glow-text-red">
            <span className="h-2 w-2 rounded-full bg-[#FF2E93] animate-ping"></span>
            CRITICAL
          </span>
        );
    }
  };

  const criticalCount = alerts.filter((a) => a.type === 'CRITICAL').length;
  const warningCount = alerts.filter((a) => a.type === 'WARNING').length;

  return (
    <div className="space-y-3.5 h-full flex flex-col font-sans">
      {/* Top Artificial Horizon */}
      <ArtificialHorizon roll={telemetry.roll} pitch={telemetry.pitch} />

      {/* Subsystem Health Panel */}
      <div className="panel-glass rounded-xl p-4 space-y-2.5 flex-1 shadow-lg">
        <div className="flex items-center justify-between border-b border-[#1e2d4a] pb-2.5 px-0.5">
          <span className="text-sm font-orbitron font-extrabold text-white tracking-widest uppercase flex items-center gap-2 glow-text-cyan">
            <ShieldCheck className="w-5 h-5 text-[#00F0FF]" />
            SYSTEM HEALTH
          </span>
          <span className="text-xs font-rajdhani font-bold text-[#00E676] bg-[#00E676]/15 px-2.5 py-1 rounded-full border border-[#00E676]/40">
            ALL NOMINAL
          </span>
        </div>

        <div className="space-y-2 text-xs pt-1">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0b1429]/80 border border-[#1e2d4a] hover:border-[#00F0FF]/40 transition-all">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-[#00F0FF]" />
              <span className="text-white font-rajdhani font-bold text-sm">ESP32 MCU</span>
            </div>
            {getHealthBadge(health.esp32)}
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0b1429]/80 border border-[#1e2d4a] hover:border-[#00F0FF]/40 transition-all">
            <div className="flex items-center gap-2.5">
              <Satellite className="w-4 h-4 text-[#38BDF8]" />
              <span className="text-white font-rajdhani font-bold text-sm">GPS SENSOR</span>
            </div>
            {getHealthBadge(health.gps)}
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0b1429]/80 border border-[#1e2d4a] hover:border-[#00F0FF]/40 transition-all">
            <div className="flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-[#00E676]" />
              <span className="text-white font-rajdhani font-bold text-sm">BMP280 PRESS/TEMP</span>
            </div>
            {getHealthBadge(health.bmp280)}
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0b1429]/80 border border-[#1e2d4a] hover:border-[#00F0FF]/40 transition-all">
            <div className="flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-[#A855F7]" />
              <span className="text-white font-rajdhani font-bold text-sm">MPU6050 IMU</span>
            </div>
            {getHealthBadge(health.mpu6050)}
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0b1429]/80 border border-[#1e2d4a] hover:border-[#00F0FF]/40 transition-all">
            <div className="flex items-center gap-2.5">
              <Radio className="w-4 h-4 text-[#38BDF8]" />
              <span className="text-white font-rajdhani font-bold text-sm">LoRa RF TRANSCEIVER</span>
            </div>
            {getHealthBadge(health.lora)}
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0b1429]/80 border border-[#1e2d4a] hover:border-[#00F0FF]/40 transition-all">
            <div className="flex items-center gap-2.5">
              <Usb className="w-4 h-4 text-[#00F0FF]" />
              <span className="text-white font-rajdhani font-bold text-sm">UART COM PORT</span>
            </div>
            {getHealthBadge(health.uart)}
          </div>
        </div>
      </div>

      {/* Safety Alerts Summary */}
      <div className="panel-glass rounded-xl p-3.5 space-y-2.5 shadow-lg">
        <div className="flex items-center justify-between border-b border-[#1e2d4a] pb-2">
          <span className="text-sm font-orbitron font-extrabold text-white tracking-widest uppercase flex items-center gap-2 glow-text-amber">
            <AlertTriangle className="w-5 h-5 text-[#FFB703]" />
            SAFETY ALERTS
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5 text-center font-rajdhani">
          <div className="p-2.5 rounded-xl bg-[#FF2E93]/15 border border-[#FF2E93]/40">
            <span className="text-[#FF2E93] font-orbitron font-extrabold text-xl block font-mono-num glow-text-red">{criticalCount}</span>
            <span className="text-xs font-bold text-slate-200 tracking-wider">CRITICAL</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#FFB703]/15 border border-[#FFB703]/40">
            <span className="text-[#FFB703] font-orbitron font-extrabold text-xl block font-mono-num glow-text-amber">{warningCount}</span>
            <span className="text-xs font-bold text-slate-200 tracking-wider">WARNING</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#00E676]/15 border border-[#00E676]/40">
            <span className="text-[#00E676] font-orbitron font-extrabold text-xl block font-mono-num glow-text-emerald">
              {alerts.length === 0 ? '5' : 'NOM'}
            </span>
            <span className="text-xs font-bold text-slate-200 tracking-wider">NORMAL</span>
          </div>
        </div>
      </div>
    </div>
  );
}
