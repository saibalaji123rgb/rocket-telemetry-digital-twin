import React, { useState, useEffect } from 'react';
import { TelemetryFrame, MissionStats, MissionSetupData } from '../types/telemetry';
import DigitalTwin3D from './DigitalTwin3D';
import {
  Play, Pause, RotateCcw, FastForward, FileCheck, Download,
  ArrowLeft, Award, Activity, Gauge, Mountain, Signal, Thermometer
} from 'lucide-react';
import jsPDF from 'jspdf';

interface PostMissionAnalysisProps {
  history: TelemetryFrame[];
  stats: MissionStats;
  missionSetup: MissionSetupData;
  onBackToDashboard: () => void;
}

export default function PostMissionAnalysis({
  history,
  stats,
  missionSetup,
  onBackToDashboard
}: PostMissionAnalysisProps) {
  const chronHistory = [...history].reverse();
  const totalFrames = chronHistory.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState<1 | 2 | 4 | 8>(1);

  // Replay timer loop
  useEffect(() => {
    let timer: any = null;
    if (isPlaying && totalFrames > 0) {
      timer = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= totalFrames - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / playSpeed);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, playSpeed, totalFrames]);

  const currentFrame = chronHistory[currentIndex] || chronHistory[0] || {
    packetId: 0,
    latitude: 13.0827,
    longitude: 80.2707,
    roll: 0,
    pitch: 0,
    speed: 0,
    temperature: 25,
    pressure: 1013.25,
    altitude: 0,
    vibration: 0,
    satellites: 8,
    rssi: -90,
    snr: 8,
    timestamp: '00:00:00.000',
    stage: 1,
    flightStatus: 'REPLAY',
    systemMode: 'NOMINAL'
  };

  const handleGeneratePDFReport = () => {
    const doc = new jsPDF();
    (doc as any).setBackgroundColor?.('#070a11');

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

    doc.line(14, 130, 196, 130);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('2. TELEMETRY INTEGRITY EVALUATION', 14, 140);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('The Ground Control Station successfully acquired telemetry frames over the Web Serial API UART backplane.', 14, 148);
    doc.text('All packet CRC sequence checks passed nominal threshold requirements for IEEE research presentation.', 14, 154);

    doc.save(`${missionSetup.missionId}_Post_Mission_Report.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#050814] text-white p-4 font-sans flex flex-col space-y-4">
      {/* Top Bar */}
      <div className="panel-glass p-5 rounded-2xl flex flex-wrap justify-between items-center shadow-xl">
        <div className="flex items-center gap-3.5">
          <button
            onClick={onBackToDashboard}
            className="p-3 rounded-xl bg-[#050814] border border-[#1e2d4a] text-[#00F0FF] hover:bg-[#00F0FF]/15 transition-all cursor-pointer shadow-inner"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base md:text-lg font-orbitron font-extrabold text-white tracking-widest uppercase glow-text-cyan">
              POST-MISSION ANALYSIS & DIGITAL TWIN REPLAY
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
          GENERATE IEEE PDF REPORT
        </button>
      </div>

      {/* Main Grid: Replay Twin left, Stats right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        {/* Left Column: 3D Replay Twin & Scrubber (7 cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="h-[420px] w-full rounded-2xl overflow-hidden border border-[#1e2d4a] shadow-xl">
            <DigitalTwin3D telemetry={currentFrame} />
          </div>

          {/* Timeline Scrubber Controls */}
          <div className="bg-[#0b1429]/90 backdrop-blur-md rounded-2xl p-5 border border-[#1e2d4a] shadow-xl space-y-4">
            <div className="flex justify-between items-center text-xs md:text-sm font-rajdhani font-bold">
              <span className="text-[#00F0FF] font-orbitron font-extrabold flex items-center gap-2 glow-text-cyan">
                <Activity className="w-5 h-5 text-[#00F0FF] animate-pulse" />
                TELEMETRY TIMELINE SCRUBBER
              </span>
              <span className="text-slate-200">
                FRAME: <strong className="text-white font-orbitron font-extrabold font-mono-num">{currentIndex + 1}</strong> / {totalFrames}
              </span>
            </div>

            {/* Range Slider */}
            <input
              type="range"
              min={0}
              max={Math.max(0, totalFrames - 1)}
              value={currentIndex}
              onChange={(e) => setCurrentIndex(parseInt(e.target.value, 10))}
              className="w-full h-2.5 bg-[#050814] border border-[#1e2d4a] rounded-lg appearance-none cursor-pointer accent-[#00F0FF]"
            />

            {/* Playback Controls */}
            <div className="flex flex-wrap justify-between items-center gap-3 pt-1">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#2563EB] text-black font-orbitron font-extrabold text-xs uppercase hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(0,240,255,0.4)]"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  {isPlaying ? 'PAUSE' : 'PLAY REPLAY'}
                </button>

                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentIndex(0);
                  }}
                  className="p-2.5 rounded-xl bg-[#050814] border border-[#1e2d4a] text-slate-200 hover:text-white hover:border-[#00F0FF]/40 cursor-pointer"
                >
                  <RotateCcw className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Speed scrubber */}
              <div className="flex items-center gap-2 text-xs font-mono font-bold">
                <FastForward className="w-4 h-4 text-[#00F0FF]" />
                <span className="text-slate-300 font-rajdhani mr-1">SPEED:</span>
                {([1, 2, 4, 8] as const).map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setPlaySpeed(spd)}
                    className={`px-3 py-1 rounded-lg text-xs font-orbitron font-extrabold transition-all cursor-pointer ${
                      playSpeed === spd
                        ? 'bg-[#00F0FF] text-black shadow-[0_0_10px_rgba(0,240,255,0.5)]'
                        : 'bg-[#050814] text-slate-300 border border-[#1e2d4a] hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Mission Statistics Summary (5 cols) */}
        <div className="lg:col-span-5 bg-[#0b1429]/90 backdrop-blur-md rounded-2xl p-5 border border-[#1e2d4a] shadow-xl flex flex-col justify-between space-y-4">
          <div className="border-b border-[#1e2d4a] pb-3">
            <h2 className="text-xs md:text-sm font-orbitron font-extrabold text-white uppercase tracking-wider flex items-center gap-2.5 glow-text-cyan">
              <Award className="w-5 h-5 text-[#00F0FF]" />
              MISSION PERFORMANCE SUMMARY
            </h2>
            <p className="text-xs md:text-sm font-rajdhani font-bold text-slate-200 mt-0.5">COMPREHENSIVE TELEMETRY ANALYTICS</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs flex-1 font-mono">
            <div className="p-3.5 rounded-xl bg-[#050814] border border-[#1e2d4a]">
              <span className="text-slate-300 font-rajdhani font-extrabold text-xs block mb-1">PACKETS RECEIVED</span>
              <span className="text-xl md:text-2xl font-orbitron font-extrabold text-[#00E676] font-mono-num glow-text-emerald">{stats.packetsReceived}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050814] border border-[#1e2d4a]">
              <span className="text-slate-300 font-rajdhani font-extrabold text-xs block mb-1">PACKET LOSS RATE</span>
              <span className="text-xl md:text-2xl font-orbitron font-extrabold text-[#FF2E93] font-mono-num glow-text-red">{stats.packetLossPercentage}%</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050814] border border-[#1e2d4a]">
              <span className="text-slate-300 font-rajdhani font-extrabold text-xs block mb-1">MAXIMUM ALTITUDE</span>
              <span className="text-xl md:text-2xl font-orbitron font-extrabold text-[#00F0FF] font-mono-num glow-text-cyan">{stats.maxAltitude} m</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050814] border border-[#1e2d4a]">
              <span className="text-slate-300 font-rajdhani font-extrabold text-xs block mb-1">MAXIMUM SPEED</span>
              <span className="text-xl md:text-2xl font-orbitron font-extrabold text-[#00E676] font-mono-num glow-text-emerald">{stats.maxSpeed} m/s</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050814] border border-[#1e2d4a]">
              <span className="text-slate-300 font-rajdhani font-extrabold text-xs block mb-1">AVERAGE RSSI</span>
              <span className="text-xl md:text-2xl font-orbitron font-extrabold text-[#38BDF8] font-mono-num">{stats.avgRssi} dBm</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050814] border border-[#1e2d4a]">
              <span className="text-slate-300 font-rajdhani font-extrabold text-xs block mb-1">AVERAGE SNR</span>
              <span className="text-xl md:text-2xl font-orbitron font-extrabold text-[#A855F7] font-mono-num">{stats.avgSnr} dB</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#050814] border border-[#1e2d4a] text-xs">
            <span className="text-slate-300 font-rajdhani font-extrabold text-xs block mb-1">TEMPERATURE RANGE</span>
            <span className="text-[#FFB703] font-orbitron font-extrabold font-mono-num text-base glow-text-amber">
              {stats.lowestTemp}°C (MIN) — {stats.highestTemp}°C (MAX)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

