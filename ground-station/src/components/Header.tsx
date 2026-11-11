import React, { useState, useEffect } from 'react';
import { TelemetryFrame, ConnectionState, PacketStatistics } from '../types/telemetry';
import { Rocket, Clock, Signal, Radio, Usb, Cpu, LogOut, FileText, Camera } from 'lucide-react';
import html2canvas from 'html2canvas';

interface HeaderProps {
  telemetry: TelemetryFrame;
  stats: PacketStatistics;
  uartState: ConnectionState;
  loraState: ConnectionState;
  missionName: string;
  onLogout: () => void;
  onOpenAnalysis: () => void;
  onConnectSerial: () => Promise<void>;
}

export default function Header({
  telemetry,
  stats,
  uartState,
  loraState,
  missionName,
  onLogout,
  onOpenAnalysis,
  onConnectSerial
}: HeaderProps) {
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);

  const handleTakeIEEESnapshot = async () => {
    try {
      setIsCapturing(true);
      const rootEl = document.getElementById('dashboard-root') || document.body;
      const canvas = await html2canvas(rootEl, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        backgroundColor: '#0B1120',
        logging: false,
      });

      const image = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = image;
      downloadLink.download = 'dashboard_ieee_snapshot.png';
      downloadLink.click();
    } catch (err) {
      console.error('Failed to capture IEEE snapshot', err);
      alert('Snapshot creation failed. Try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentDateTime(now.toISOString().replace('T', ' ').slice(0, 19));

      const diffSec = Math.floor((Date.now() - startTime) / 1000);
      const hrs = String(Math.floor(diffSec / 3600)).padStart(2, '0');
      const mins = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
      const secs = String(diffSec % 60).padStart(2, '0');
      setElapsedTime(`${hrs}:${mins}:${secs}`);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getSignalColor = (rssi: number) => {
    if (rssi > -85) return 'text-[#22C55E]';
    if (rssi > -105) return 'text-[#F59E0B]';
    return 'text-[#EF4444]';
  };

  return (
    <header className="bg-[#0b1224]/90 backdrop-blur-md border-b border-[#1e2d4a] px-4 py-3 flex flex-wrap justify-between items-center z-30 font-sans shadow-lg shadow-cyan-950/20 gap-2">
      {/* Left Title & Project Info */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#00F0FF]/20 to-[#2563EB]/10 border border-[#00F0FF]/40 flex items-center justify-center text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.25)] animate-pulse-glow shrink-0">
          <Rocket className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-sm md:text-base font-orbitron font-extrabold text-white tracking-widest uppercase glow-text-cyan">
              DIGITAL TWIN TELEMETRY
            </h1>
            <span className="text-xs font-rajdhani font-bold bg-[#111c38] text-[#38BDF8] px-3 py-0.5 rounded-full border border-[#00F0FF]/40 tracking-wider shadow-sm">
              {missionName}
            </span>
          </div>
          <p className="text-xs font-rajdhani font-bold text-slate-300 tracking-wider uppercase mt-0.5">
            GROUND CONTROL STATION • MISSION CONTROL
          </p>
        </div>
      </div>

      {/* Center Mission Timer & UTC Clock */}
      <div className="flex items-center gap-5 bg-[#050918]/90 px-4 py-2 rounded-xl border border-[#1e2d4a] shadow-inner">
        <div className="flex items-center gap-2.5">
          <Clock className="w-4.5 h-4.5 text-[#00F0FF] animate-pulse" />
          <div>
            <span className="text-xs font-rajdhani font-bold text-slate-400 block leading-none tracking-widest">MISSION TIMER</span>
            <span className="text-sm font-orbitron font-bold text-[#00F0FF] font-orbitron-num glow-text-cyan">{elapsedTime}</span>
          </div>
        </div>
        <div className="h-7 w-[1px] bg-gradient-to-b from-transparent via-[#1e2d4a] to-transparent"></div>
        <div>
          <span className="text-xs font-rajdhani font-bold text-slate-400 block leading-none tracking-widest">SYSTEM UTC</span>
          <span className="text-sm font-mono font-bold text-slate-100 font-mono-num">{currentDateTime}</span>
        </div>
      </div>

      {/* Right Telemetry Badges & Action Buttons */}
      <div className="flex items-center gap-2.5 text-xs font-rajdhani font-bold">
        {/* UART Badge / Connect */}
        <button
          onClick={onConnectSerial}
          title="Click to Connect/Disconnect Serial Port"
          className="flex items-center gap-1.5 bg-[#0f1933] px-3.5 py-2 rounded-lg border border-[#1e2d4a] hover:border-[#00F0FF]/50 transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-[0_0_12px_rgba(0,240,255,0.2)]"
        >
          <Usb className="w-4 h-4 text-[#38BDF8] group-hover:scale-110 transition-transform" />
          <span className="text-slate-300 text-xs font-bold tracking-wider">UART:</span>
          <span className={`text-xs font-extrabold font-orbitron flex items-center gap-1.5 ${
            uartState === 'Connected' ? 'text-[#00E676] glow-text-emerald' : 'text-[#FF2E93]'
          }`}>
            <span className={`w-2 h-2 rounded-full ${uartState === 'Connected' ? 'bg-[#00E676] animate-ping' : 'bg-[#FF2E93]'}`}></span>
            {uartState.toUpperCase()}
          </span>
        </button>

        {/* LoRa Badge */}
        <div className="flex items-center gap-1.5 bg-[#0f1933] px-3.5 py-2 rounded-lg border border-[#1e2d4a] shadow-sm">
          <Radio className="w-4 h-4 text-[#38BDF8]" />
          <span className="text-slate-300 text-xs font-bold tracking-wider">LoRa:</span>
          <span className={`text-xs font-extrabold font-orbitron flex items-center gap-1.5 ${
            loraState === 'Connected' ? 'text-[#00E676] glow-text-emerald' : 'text-[#FF2E93]'
          }`}>
            <span className={`w-2 h-2 rounded-full ${loraState === 'Connected' ? 'bg-[#00E676] animate-pulse' : 'bg-[#FF2E93]'}`}></span>
            {loraState.toUpperCase()}
          </span>
        </div>

        {/* Packet Count */}
        <div className="flex items-center gap-1.5 bg-[#0f1933] px-3.5 py-2 rounded-lg border border-[#1e2d4a] shadow-sm">
          <Cpu className="w-4 h-4 text-[#00F0FF]" />
          <span className="text-slate-300 text-xs font-bold tracking-wider">PKTS:</span>
          <span className="text-xs font-extrabold text-white font-mono-num">{stats.packetsReceived}</span>
        </div>

        {/* RSSI & SNR */}
        <div className="flex items-center gap-2 bg-[#0f1933] px-3.5 py-2 rounded-lg border border-[#1e2d4a] text-xs shadow-sm">
          <Signal className={`w-4 h-4 ${getSignalColor(telemetry.rssi)}`} />
          <span className="text-slate-300 font-bold tracking-wider">RSSI:</span>
          <span className={`font-extrabold font-mono-num ${getSignalColor(telemetry.rssi)}`}>
            {telemetry.rssi} dBm
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300 font-bold tracking-wider">SNR:</span>
          <span className="font-extrabold font-mono-num text-white">{telemetry.snr} dB</span>
        </div>

        {/* IEEE Snapshot button */}
        <button
          onClick={handleTakeIEEESnapshot}
          disabled={isCapturing}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#00E676]/15 text-[#00E676] border border-[#00E676]/40 font-bold hover:bg-[#00E676]/25 transition-all duration-200 cursor-pointer text-xs tracking-wider hover:shadow-[0_0_12px_rgba(0,230,118,0.25)]"
        >
          <Camera className="w-4 h-4" />
          {isCapturing ? 'CAPTURING...' : 'IEEE SNAPSHOT'}
        </button>

        {/* Post Mission Analysis button */}
        <button
          onClick={onOpenAnalysis}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-[#00F0FF] to-[#2563EB] text-black font-orbitron font-extrabold hover:brightness-110 transition-all duration-200 text-xs tracking-wider shadow-[0_0_15px_rgba(0,240,255,0.3)] cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          POST MISSION
        </button>

        {/* Exit button */}
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 p-2 rounded-lg bg-[#0f1933] border border-[#1e2d4a] text-slate-400 hover:text-[#FF2E93] hover:border-[#FF2E93]/50 transition-colors"
          title="Exit GCS"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
