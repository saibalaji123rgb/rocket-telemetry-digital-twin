import React, { useState } from 'react';
import { ConnectionState } from '../../types/telemetry';
import { Settings, Usb, Sliders, ShieldAlert } from 'lucide-react';

interface SettingsViewProps {
  uartState: ConnectionState;
  onConnectSerial: () => void;
  isSimulating: boolean;
  onToggleDemoMode: (enable: boolean) => void;
  onResetStore: () => void;
}

export default function SettingsView({
  uartState,
  onConnectSerial,
  isSimulating,
  onToggleDemoMode,
  onResetStore
}: SettingsViewProps) {
  const [selectedPort, setSelectedPort] = useState('COM3 (ESP32 UART Bridge)');
  const [baudRate, setBaudRate] = useState('115200');
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [bufferSize, setBufferSize] = useState(2000);
  const [refreshRate, setRefreshRate] = useState('10Hz (100ms)');

  return (
    <div className="space-y-4 font-sans max-w-5xl">
      {/* Header */}
      <div className="panel-glass p-5 rounded-2xl flex justify-between items-center shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_15px_rgba(0,240,255,0.25)]">
            <Settings className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-orbitron font-extrabold text-white tracking-widest uppercase glow-text-cyan">
              APPLICATION & HARDWARE CONFIGURATION
            </h1>
            <p className="text-xs md:text-sm font-rajdhani font-bold text-slate-200 tracking-wider mt-0.5">
              SERIAL UART SETUP • BUFFER LIMITS • DISPLAY PREFERENCES
            </p>
          </div>
        </div>
      </div>

      {/* Main Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Section 1: UART Hardware Connection */}
        <div className="bg-[#0b1429]/90 backdrop-blur-md rounded-2xl p-5 border border-[#1e2d4a] shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#1e2d4a] pb-3">
            <Usb className="w-5 h-5 text-[#00F0FF]" />
            <h2 className="text-xs md:text-sm font-orbitron font-extrabold text-white uppercase tracking-wider glow-text-cyan">
              1. UART COM PORT & HARDWARE
            </h2>
          </div>

          <div className="space-y-4 text-xs md:text-sm font-rajdhani font-bold">
            <div>
              <label className="text-slate-200 block mb-1.5 uppercase tracking-wider">SELECT TARGET COM PORT:</label>
              <select
                value={selectedPort}
                onChange={(e) => setSelectedPort(e.target.value)}
                className="w-full bg-[#050814] border border-[#1e2d4a] rounded-xl p-3 text-white font-mono focus:outline-none focus:border-[#00F0FF] cursor-pointer shadow-inner"
              >
                <option value="COM3 (ESP32 UART Bridge)" className="bg-[#0b1429]">COM3 — Silicon Labs CP210x USB to UART</option>
                <option value="COM4 (CH340 Serial)" className="bg-[#0b1429]">COM4 — CH340 USB Serial Converter</option>
                <option value="COM7 (FTDI RS232)" className="bg-[#0b1429]">COM7 — FTDI FT232R USB UART</option>
                <option value="/dev/ttyUSB0" className="bg-[#0b1429]">/dev/ttyUSB0 — Linux ESP32 Node</option>
              </select>
            </div>

            <div>
              <label className="text-slate-200 block mb-1.5 uppercase tracking-wider">BAUD RATE (DEFAULT 115200):</label>
              <select
                value={baudRate}
                onChange={(e) => setBaudRate(e.target.value)}
                className="w-full bg-[#050814] border border-[#1e2d4a] rounded-xl p-3 text-white font-mono focus:outline-none focus:border-[#00F0FF] cursor-pointer shadow-inner"
              >
                <option value="9600" className="bg-[#0b1429]">9600 Baud</option>
                <option value="57600" className="bg-[#0b1429]">57600 Baud</option>
                <option value="115200" className="bg-[#0b1429]">115200 Baud (Recommended Standard)</option>
                <option value="230400" className="bg-[#0b1429]">230400 Baud (High Speed)</option>
              </select>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-slate-200 uppercase tracking-wider">HARDWARE AUTO-RECONNECT:</span>
              <button
                onClick={() => setAutoReconnect(!autoReconnect)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  autoReconnect ? 'bg-[#00E676]' : 'bg-[#1e2d4a]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-black transition-transform ${
                    autoReconnect ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="pt-3 border-t border-[#1e2d4a] flex flex-wrap gap-2.5">
              <button
                onClick={onConnectSerial}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#2563EB] text-black font-orbitron font-extrabold text-xs uppercase hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.3)] cursor-pointer"
              >
                <Usb className="w-4 h-4" />
                {uartState === 'Connected' ? 'RE-CONNECT UART' : 'CONNECT UART PORT'}
              </button>

              <button
                onClick={() => onToggleDemoMode(!isSimulating)}
                className={`px-4 py-3 rounded-xl border text-xs font-orbitron font-bold uppercase transition-all cursor-pointer ${
                  isSimulating
                    ? 'bg-[#FFB703]/20 text-[#FFB703] border-[#FFB703]/40 glow-text-amber'
                    : 'bg-[#050814] text-slate-200 border-[#1e2d4a] hover:text-white'
                }`}
              >
                {isSimulating ? 'DEMO MODE ACTIVE' : 'ENABLE DEMO MODE'}
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Display & Telemetry Store Limits */}
        <div className="bg-[#0b1429]/90 backdrop-blur-md rounded-2xl p-5 border border-[#1e2d4a] shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#1e2d4a] pb-3">
            <Sliders className="w-5 h-5 text-[#00F0FF]" />
            <h2 className="text-xs md:text-sm font-orbitron font-extrabold text-white uppercase tracking-wider glow-text-cyan">
              2. TELEMETRY BUFFER & DISPLAY
            </h2>
          </div>

          <div className="space-y-4 text-xs md:text-sm font-rajdhani font-bold">
            <div>
              <label className="text-slate-200 block mb-1.5 uppercase tracking-wider">TELEMETRY BUFFER SIZE (MAX FRAMES):</label>
              <select
                value={bufferSize}
                onChange={(e) => setBufferSize(Number(e.target.value))}
                className="w-full bg-[#050814] border border-[#1e2d4a] rounded-xl p-3 text-white font-mono focus:outline-none focus:border-[#00F0FF] cursor-pointer shadow-inner"
              >
                <option value={500} className="bg-[#0b1429]">500 Frames (Lightweight)</option>
                <option value={1000} className="bg-[#0b1429]">1000 Frames (Standard)</option>
                <option value={2000} className="bg-[#0b1429]">2000 Frames (Recommended High Retention)</option>
                <option value={5000} className="bg-[#0b1429]">5000 Frames (Extended Mission Analysis)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-200 block mb-1.5 uppercase tracking-wider">DASHBOARD REFRESH RATE:</label>
              <select
                value={refreshRate}
                onChange={(e) => setRefreshRate(e.target.value)}
                className="w-full bg-[#050814] border border-[#1e2d4a] rounded-xl p-3 text-white font-mono focus:outline-none focus:border-[#00F0FF] cursor-pointer shadow-inner"
              >
                <option value="60Hz (16ms)" className="bg-[#0b1429]">60Hz High Frame Rate (16ms rendering)</option>
                <option value="10Hz (100ms)" className="bg-[#0b1429]">10Hz Standard Mission Emission (100ms)</option>
                <option value="5Hz (200ms)" className="bg-[#0b1429]">5Hz Reduced Bandwidth (200ms)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-200 block mb-1.5 uppercase tracking-wider">CSV EXPORT DESTINATION FOLDER:</label>
              <input
                type="text"
                readOnly
                value="./exports/telemetry_logs/"
                className="w-full bg-[#050814] border border-[#1e2d4a] rounded-xl p-3 text-[#00F0FF] font-mono font-bold"
              />
            </div>

            <div className="pt-3 border-t border-[#1e2d4a]">
              <button
                onClick={onResetStore}
                className="w-full py-3 rounded-xl bg-[#FF2E93]/15 text-[#FF2E93] border border-[#FF2E93]/40 hover:bg-[#FF2E93]/25 transition-all font-orbitron font-extrabold text-xs uppercase flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-[0_0_12px_rgba(255,46,147,0.25)]"
              >
                <ShieldAlert className="w-4 h-4" />
                RESET TELEMETRY STORE & CLEAR LOGS
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

