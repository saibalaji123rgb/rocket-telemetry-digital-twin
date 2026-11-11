import React from 'react';
import { MissionStats, MissionSetupData } from '../../types/telemetry';
import { BarChart3, FileCheck } from 'lucide-react';
import jsPDF from 'jspdf';
import AdaptiveTelemetryCard from '../AdaptiveTelemetryCard';
import MissionReliabilityCard from '../MissionReliabilityCard';
import { telemetryStore } from '../../services/TelemetryStore';

interface MissionStatsViewProps {
  stats: MissionStats;
  missionSetup: MissionSetupData;
}

export default function MissionStatsView({ stats, missionSetup }: MissionStatsViewProps) {
  const currentTelemetry = telemetryStore.getCurrentFrame();
  const currentStats = telemetryStore.getStatistics();

  const handleGeneratePDFReport = () => {
    const doc = new jsPDF();
    (doc as any).setBackgroundColor?.('#0B1120');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('POST MISSION ENGINEERING REPORT', 14, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`PROJECT: DIGITAL TWIN ENABLED ROCKET TELEMETRY SYSTEM`, 14, 28);
    doc.text(`MISSION NAME: ${missionSetup.missionName || 'DT-ROCKET MISSION'}`, 14, 34);
    doc.text(`MISSION ID: ${missionSetup.missionId}`, 14, 40);
    doc.text(`CHIEF OPERATOR: ${missionSetup.operatorName}`, 14, 46);
    doc.text(`DATE: ${new Date().toLocaleDateString()}`, 14, 52);

    doc.setLineWidth(0.5);
    doc.line(14, 56, 196, 56);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('1. MISSION STATISTICAL SUMMARY', 14, 66);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`• Total Packets Received: ${stats.packetsReceived}`, 20, 74);
    doc.text(`• Total Packets Lost: ${stats.packetsLost}`, 20, 80);
    doc.text(`• Packet Loss Rate: ${stats.packetLossPercentage}%`, 20, 86);
    doc.text(`• Mission Duration: ${stats.missionDurationSec} Seconds`, 20, 92);
    doc.text(`• Maximum Flight Altitude: ${stats.maxAltitude} m`, 20, 98);
    doc.text(`• Maximum Flight Speed: ${stats.maxSpeed} m/s`, 20, 104);
    doc.text(`• Average LoRa RSSI: ${stats.avgRssi} dBm`, 20, 110);
    doc.text(`• Average LoRa SNR: ${stats.avgSnr} dB`, 20, 116);
    doc.text(`• Temperature Range: ${stats.lowestTemp}°C to ${stats.highestTemp}°C`, 20, 122);

    doc.save(`${missionSetup.missionId}_Post_Mission_Report.pdf`);
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Header */}
      <div className="panel-glass p-5 rounded-2xl flex justify-between items-center shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_15px_rgba(0,240,255,0.25)]">
            <BarChart3 className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-orbitron font-extrabold text-white tracking-widest uppercase glow-text-cyan">
              MISSION PERFORMANCE & STATISTICAL ANALYTICS
            </h1>
            <p className="text-xs md:text-sm font-rajdhani font-bold text-slate-200 tracking-wider mt-0.5">
              MISSION ID: <span className="text-[#00F0FF] font-extrabold">{missionSetup.missionId}</span> | OPERATOR: {missionSetup.operatorName}
            </p>
          </div>
        </div>

        <button
          onClick={handleGeneratePDFReport}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#2563EB] text-black font-orbitron font-extrabold text-xs uppercase hover:brightness-110 transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] cursor-pointer tracking-wider"
        >
          <FileCheck className="w-4 h-4" />
          EXPORT IEEE PDF REPORT
        </button>
      </div>

      {/* Grid of Key Mission Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Mission Duration */}
        <div className="bg-[#0b1429]/90 backdrop-blur-md p-5 rounded-2xl border border-[#1e2d4a] shadow-xl flex flex-col justify-between min-h-[125px]">
          <span className="text-xs font-rajdhani font-extrabold text-slate-200 uppercase tracking-wider block">MISSION DURATION</span>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-2xl md:text-3xl font-orbitron font-extrabold text-[#FFB703] font-mono-num glow-text-amber">{stats.missionDurationSec}</span>
            <span className="text-sm font-rajdhani font-bold text-slate-300">seconds</span>
          </div>
          <span className="text-xs font-rajdhani font-bold text-slate-300 block">Active flight duration</span>
        </div>

        {/* Card 2: Packets Received */}
        <div className="bg-[#0b1429]/90 backdrop-blur-md p-5 rounded-2xl border border-[#1e2d4a] shadow-xl flex flex-col justify-between min-h-[125px]">
          <span className="text-xs font-rajdhani font-extrabold text-slate-200 uppercase tracking-wider block">PACKETS RECEIVED</span>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-2xl md:text-3xl font-orbitron font-extrabold text-[#00E676] font-mono-num glow-text-emerald">{stats.packetsReceived}</span>
            <span className="text-sm font-rajdhani font-bold text-slate-300">pkts</span>
          </div>
          <span className="text-xs font-rajdhani font-bold text-slate-300 block">Valid CRC telemetry frames</span>
        </div>

        {/* Card 3: Packet Loss Rate */}
        <div className="bg-[#0b1429]/90 backdrop-blur-md p-5 rounded-2xl border border-[#1e2d4a] shadow-xl flex flex-col justify-between min-h-[125px]">
          <span className="text-xs font-rajdhani font-extrabold text-slate-200 uppercase tracking-wider block">PACKET LOSS RATE</span>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-2xl md:text-3xl font-orbitron font-extrabold text-[#FF2E93] font-mono-num glow-text-red">{stats.packetLossPercentage}</span>
            <span className="text-sm font-rajdhani font-bold text-slate-300">%</span>
          </div>
          <span className="text-xs font-rajdhani font-bold text-slate-300 block">Total sequence drops</span>
        </div>

        {/* Card 4: Maximum Altitude */}
        <div className="bg-[#0b1429]/90 backdrop-blur-md p-5 rounded-2xl border border-[#1e2d4a] shadow-xl flex flex-col justify-between min-h-[125px]">
          <span className="text-xs font-rajdhani font-extrabold text-slate-200 uppercase tracking-wider block">MAXIMUM ALTITUDE</span>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-2xl md:text-3xl font-orbitron font-extrabold text-[#00F0FF] font-mono-num glow-text-cyan">{stats.maxAltitude}</span>
            <span className="text-sm font-rajdhani font-bold text-slate-300">m</span>
          </div>
          <span className="text-xs font-rajdhani font-bold text-slate-300 block">Apogee peak spatial height</span>
        </div>

        {/* Card 5: Maximum Speed */}
        <div className="bg-[#0b1429]/90 backdrop-blur-md p-5 rounded-2xl border border-[#1e2d4a] shadow-xl flex flex-col justify-between min-h-[125px]">
          <span className="text-xs font-rajdhani font-extrabold text-slate-200 uppercase tracking-wider block">MAXIMUM SPEED</span>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-2xl md:text-3xl font-orbitron font-extrabold text-[#00E676] font-mono-num glow-text-emerald">{stats.maxSpeed}</span>
            <span className="text-sm font-rajdhani font-bold text-slate-300">m/s</span>
          </div>
          <span className="text-xs font-rajdhani font-bold text-slate-300 block">Peak flight velocity</span>
        </div>

        {/* Card 6: Temperature Range */}
        <div className="bg-[#0b1429]/90 backdrop-blur-md p-5 rounded-2xl border border-[#1e2d4a] shadow-xl flex flex-col justify-between min-h-[125px]">
          <span className="text-xs font-rajdhani font-extrabold text-slate-200 uppercase tracking-wider block">TEMPERATURE RANGE</span>
          <div className="flex items-baseline gap-1.5 flex-wrap my-1">
            <span className="text-lg md:text-xl font-orbitron font-extrabold text-[#FFB703] font-mono-num glow-text-amber">{stats.lowestTemp}°C</span>
            <span className="text-xs font-rajdhani font-bold text-slate-400">to</span>
            <span className="text-lg md:text-xl font-orbitron font-extrabold text-[#FFB703] font-mono-num glow-text-amber">{stats.highestTemp}°C</span>
          </div>
          <span className="text-xs font-rajdhani font-bold text-slate-300 block">Min to max recorded</span>
        </div>

        {/* Card 7: Average LoRa RSSI */}
        <div className="bg-[#0b1429]/90 backdrop-blur-md p-5 rounded-2xl border border-[#1e2d4a] shadow-xl flex flex-col justify-between min-h-[125px]">
          <span className="text-xs font-rajdhani font-extrabold text-slate-200 uppercase tracking-wider block">AVERAGE LORA RSSI</span>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-2xl md:text-3xl font-orbitron font-extrabold text-[#38BDF8] font-mono-num">{stats.avgRssi}</span>
            <span className="text-sm font-rajdhani font-bold text-slate-300">dBm</span>
          </div>
          <span className="text-xs font-rajdhani font-bold text-slate-300 block">RF signal power mean</span>
        </div>

        {/* Card 8: Average LoRa SNR */}
        <div className="bg-[#0b1429]/90 backdrop-blur-md p-5 rounded-2xl border border-[#1e2d4a] shadow-xl flex flex-col justify-between min-h-[125px]">
          <span className="text-xs font-rajdhani font-extrabold text-slate-200 uppercase tracking-wider block">AVERAGE LORA SNR</span>
          <div className="flex items-baseline gap-1.5 my-1">
            <span className="text-2xl md:text-3xl font-orbitron font-extrabold text-[#A855F7] font-mono-num">{stats.avgSnr}</span>
            <span className="text-sm font-rajdhani font-bold text-slate-300">dB</span>
          </div>
          <span className="text-xs font-rajdhani font-bold text-slate-300 block">Signal-to-noise ratio mean</span>
        </div>
      </div>

      {/* Adaptive Telemetry Analytics & Summary */}
      <section className="w-full">
        <AdaptiveTelemetryCard telemetry={currentTelemetry} stats={currentStats} showFullModule={true} />
      </section>

      {/* Mission Reliability Score Analytics & Summary */}
      <section className="w-full">
        <MissionReliabilityCard telemetry={currentTelemetry} stats={currentStats} showFullModule={true} />
      </section>
    </div>
  );
}


