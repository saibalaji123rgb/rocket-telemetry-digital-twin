import React from 'react';
import { SystemHealth, PacketStatistics, ConnectionState } from '../../types/telemetry';
import { ShieldCheck, Cpu, Satellite, Activity, Radio, Usb, Wifi } from 'lucide-react';

interface SystemStatusViewProps {
  health: SystemHealth;
  stats: PacketStatistics;
  uartState: ConnectionState;
}

export default function SystemStatusView({ health, stats, uartState }: SystemStatusViewProps) {
  const getBadge = (status: 'NOMINAL' | 'WARNING' | 'CRITICAL') => {
    switch (status) {
      case 'NOMINAL':
        return (
          <span className="flex items-center gap-1.5 text-xs font-orbitron font-extrabold text-[#00E676] bg-[#00E676]/15 px-3 py-1 rounded-full border border-[#00E676]/40 glow-text-emerald">
            <span className="h-2 w-2 rounded-full bg-[#00E676] animate-pulse"></span>
            HEALTHY (NOMINAL)
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
            ERROR (CRITICAL)
          </span>
        );
    }
  };

  const subsystems = [
    { title: 'ESP32 MAIN MCU', status: health.esp32, icon: Cpu, desc: '32-bit Dual Core Microcontroller Unit' },
    { title: 'GPS SENSOR (NEO-6M)', status: health.gps, icon: Satellite, desc: 'Geospatial Location Constellation Receiver' },
    { title: 'BMP280 PRESS & TEMP', status: health.bmp280, icon: Activity, desc: 'High-Precision Atmospheric Barometric Sensor' },
    { title: 'MPU6050 6-DOF IMU', status: health.mpu6050, icon: Activity, desc: '3-Axis Gyroscope & Accelerometer Module' },
    { title: 'SX1278 LORA RF TRANSCEIVER', status: health.lora, icon: Radio, desc: 'Long Range 433MHz Wireless Telemetry Link' },
    { title: 'UART COM PORT BACKPLANE', status: health.uart, icon: Usb, desc: 'High-Speed Web Serial API Data Bridge' },
  ];

  return (
    <div className="space-y-4 font-sans">
      {/* Header */}
      <div className="panel-glass p-5 rounded-2xl flex justify-between items-center shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-[#00E676]/15 text-[#00E676] border border-[#00E676]/40 shadow-[0_0_15px_rgba(0,230,118,0.25)]">
            <ShieldCheck className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-orbitron font-extrabold text-white tracking-widest uppercase glow-text-cyan">
              SUBSYSTEM HEALTH & HARDWARE DIAGNOSTICS
            </h1>
            <p className="text-xs md:text-sm font-rajdhani font-bold text-slate-200 tracking-wider mt-0.5">
              HARDWARE STATUS • TELEMETRY LINK QUALITY • RECEPTION METRICS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs md:text-sm font-orbitron font-extrabold text-[#00E676] bg-[#00E676]/15 px-4 py-2 rounded-full border border-[#00E676]/40 glow-text-emerald">
            SYSTEM STATUS: OPERATIONAL
          </span>
        </div>
      </div>

      {/* Subsystem Health Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subsystems.map((sub, i) => {
          const IconComp = sub.icon;
          return (
            <div key={i} className="bg-[#0b1429]/90 backdrop-blur-md p-4.5 rounded-2xl border border-[#1e2d4a] hover:border-[#00F0FF]/50 transition-all duration-200 shadow-xl flex flex-col justify-between space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#050814] border border-[#00F0FF]/30 text-[#00F0FF] shrink-0">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs md:text-sm font-orbitron font-extrabold text-white uppercase tracking-wider glow-text-cyan">{sub.title}</h3>
                    <span className="text-xs font-rajdhani font-bold text-slate-200 block mt-1 leading-snug">{sub.desc}</span>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-[#1e2d4a] flex justify-between items-center font-rajdhani">
                <span className="text-xs font-extrabold text-slate-300 tracking-widest">STATUS:</span>
                {getBadge(sub.status)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Link Quality & Telemetry Metrics Panel */}
      <div className="panel-glass rounded-2xl p-5 shadow-xl space-y-4">
        <div className="border-b border-[#1e2d4a] pb-3">
          <h2 className="text-sm md:text-base font-orbitron font-extrabold text-white uppercase tracking-wider flex items-center gap-2.5 glow-text-cyan">
            <Wifi className="w-5 h-5 text-[#00F0FF]" />
            TELEMETRY LINK & RECEIVER PERFORMANCE METRICS
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-sans">
          <div className="p-4 rounded-xl bg-[#050814]/90 border border-[#1e2d4a]">
            <span className="text-slate-300 font-rajdhani font-extrabold text-xs block mb-1 tracking-wider uppercase">PACKET RECEPTION RATE</span>
            <span className="text-2xl md:text-3xl font-orbitron font-extrabold text-[#00E676] font-mono-num glow-text-emerald">{stats.packetRateHz} Hz</span>
          </div>

          <div className="p-4 rounded-xl bg-[#050814]/90 border border-[#1e2d4a]">
            <span className="text-slate-300 font-rajdhani font-extrabold text-xs block mb-1 tracking-wider uppercase">PACKET LOSS RATE</span>
            <span className="text-2xl md:text-3xl font-orbitron font-extrabold text-[#FF2E93] font-mono-num glow-text-red">{stats.packetLossPercentage}%</span>
          </div>

          <div className="p-4 rounded-xl bg-[#050814]/90 border border-[#1e2d4a]">
            <span className="text-slate-300 font-rajdhani font-extrabold text-xs block mb-1 tracking-wider uppercase">TOTAL PACKETS RECEIVED</span>
            <span className="text-2xl md:text-3xl font-orbitron font-extrabold text-white font-mono-num glow-text-cyan">{stats.packetsReceived}</span>
          </div>

          <div className="p-4 rounded-xl bg-[#050814]/90 border border-[#1e2d4a]">
            <span className="text-slate-300 font-rajdhani font-extrabold text-xs block mb-1 tracking-wider uppercase">TOTAL PACKETS LOST</span>
            <span className="text-2xl md:text-3xl font-orbitron font-extrabold text-[#FFB703] font-mono-num glow-text-amber">{stats.packetsLost}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
