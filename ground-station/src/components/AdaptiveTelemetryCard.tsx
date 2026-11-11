import React, { useState, useEffect } from 'react';
import { TelemetryFrame, PacketStatistics } from '../types/telemetry';
import { adaptiveTelemetryModule, AdaptiveModeInfo, AdaptiveTelemetrySummary, AdaptiveEventLogEntry, AdaptiveHistoryPoint } from '../services/AdaptiveTelemetry';
import { Radio, Signal, Activity, Clock, ShieldCheck, Bell, X, Info, Zap, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface AdaptiveTelemetryCardProps {
  telemetry: TelemetryFrame;
  stats: PacketStatistics;
  showFullModule?: boolean;
}

export default function AdaptiveTelemetryCard({ telemetry, stats, showFullModule = true }: AdaptiveTelemetryCardProps) {
  const [modeInfo, setModeInfo] = useState<AdaptiveModeInfo>(
    adaptiveTelemetryModule.calculateAdaptiveMode(telemetry.rssi || -85, telemetry.snr || 8, stats?.packetLossPercentage || 0)
  );
  const [healthInfo, setHealthInfo] = useState(
    adaptiveTelemetryModule.calculateCommunicationHealth(telemetry.rssi || -85, telemetry.snr || 8)
  );
  const [history, setHistory] = useState<AdaptiveHistoryPoint[]>([]);
  const [eventLog, setEventLog] = useState<AdaptiveEventLogEntry[]>([]);
  const [summary, setSummary] = useState<AdaptiveTelemetrySummary>(adaptiveTelemetryModule.generateAdaptiveSummary(stats));
  const [activeToast, setActiveToast] = useState<{ id: string; title: string; quality: string; interval: string } | null>(null);

  useEffect(() => {
    // Process frame in adaptive module
    const { modeInfo: newModeInfo, modeChanged } = adaptiveTelemetryModule.updateFrame(telemetry, stats);
    setModeInfo(newModeInfo);
    
    const hInfo = adaptiveTelemetryModule.calculateCommunicationHealth(telemetry.rssi, telemetry.snr);
    setHealthInfo(hInfo);

    setHistory([...adaptiveTelemetryModule.updateAdaptiveHistory()]);
    setEventLog([...adaptiveTelemetryModule.getEventLog()]);
    setSummary(adaptiveTelemetryModule.generateAdaptiveSummary(stats));

    if (modeChanged) {
      const notifs = adaptiveTelemetryModule.getNotifications();
      if (notifs.length > 0) {
        setActiveToast({ ...notifs[0] });
        const timer = setTimeout(() => setActiveToast(null), 6000);
        return () => clearTimeout(timer);
      }
    }
  }, [telemetry.packetId, telemetry.rssi, telemetry.snr, stats.packetsReceived]);

  // Compute Circular Health Gauge SVG DashOffset
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (healthInfo.healthPct / 100) * circumference;

  return (
    <div className="space-y-4 font-sans text-white">
      {/* ADAPTIVE NOTIFICATION POPUP OVERLAY */}
      {activeToast && (
        <div className="fixed top-20 right-6 z-50 animate-bounce-short max-w-md bg-[#0b1429] border-2 border-[#00F0FF] rounded-2xl p-4 shadow-[0_0_30px_rgba(0,240,255,0.4)] backdrop-blur-xl flex items-start gap-3 text-white font-sans">
          <div className="p-2.5 rounded-xl bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 shrink-0 mt-0.5">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <span className="text-xs font-orbitron font-extrabold text-[#00F0FF] uppercase tracking-wider glow-text-cyan">
                {activeToast.title}
              </span>
              <button onClick={() => setActiveToast(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm font-rajdhani font-extrabold text-white mt-0.5">
              {activeToast.quality}
            </p>
            <div className="flex items-center gap-2 mt-1.5 text-xs font-mono">
              <span className="text-slate-300">RECOMMENDED TX INTERVAL:</span>
              <span className="px-2 py-0.5 rounded-md bg-[#00E676]/20 border border-[#00E676]/40 text-[#00E676] font-extrabold font-orbitron">
                {activeToast.interval}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TOP ROW: ADAPTIVE TELEMETRY CARD & COMMUNICATION HEALTH GAUGE */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Adaptive Telemetry Dashboard Card */}
        <div className="md:col-span-7 bg-[#0b1429]/90 backdrop-blur-md rounded-2xl p-4.5 border border-[#1e2d4a] hover:border-[#00F0FF]/40 transition-all shadow-xl flex flex-col justify-between space-y-4">
          {/* Card Header */}
          <div className="flex justify-between items-center border-b border-[#1e2d4a] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm md:text-base font-orbitron font-extrabold text-white tracking-widest uppercase glow-text-cyan">
                  ADAPTIVE TELEMETRY
                </h3>
                <p className="text-xs font-rajdhani font-bold text-slate-300">AUTOMATIC TRANSMISSION RATE OPTIMIZATION</p>
              </div>
            </div>

            {/* Current Mode Badge */}
            <div className={`px-3 py-1.5 rounded-xl border font-orbitron font-extrabold text-xs tracking-wider flex items-center gap-2 ${modeInfo.badgeBg} ${modeInfo.badgeBorder} shadow-sm`}>
              <span className="h-2 w-2 rounded-full animate-ping" style={{ backgroundColor: modeInfo.color }}></span>
              <span>MODE: {modeInfo.mode}</span>
            </div>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Communication Quality */}
            <div className="p-3 rounded-xl bg-[#050814] border border-[#1e2d4a] flex flex-col justify-between">
              <span className="text-[11px] font-rajdhani font-extrabold text-slate-300 uppercase tracking-wider block">
                COMM. QUALITY
              </span>
              <span className="text-base font-orbitron font-extrabold mt-1" style={{ color: modeInfo.color }}>
                {modeInfo.quality}
              </span>
            </div>

            {/* Recommended TX Interval */}
            <div className="p-3 rounded-xl bg-[#050814] border border-[#1e2d4a] flex flex-col justify-between">
              <span className="text-[11px] font-rajdhani font-extrabold text-slate-300 uppercase tracking-wider block">
                RECOMMENDED TX INTERVAL
              </span>
              <span className="text-base font-orbitron font-extrabold text-[#00F0FF] font-mono-num mt-1 glow-text-cyan">
                {modeInfo.intervalStr}
              </span>
            </div>

            {/* Packet Loss % */}
            <div className="p-3 rounded-xl bg-[#050814] border border-[#1e2d4a] flex flex-col justify-between">
              <span className="text-[11px] font-rajdhani font-extrabold text-slate-300 uppercase tracking-wider block">
                PACKET LOSS %
              </span>
              <span className={`text-base font-orbitron font-extrabold font-mono-num mt-1 ${stats.packetLossPercentage > 5 ? 'text-[#FF2E93]' : 'text-[#00E676]'}`}>
                {stats.packetLossPercentage}%
              </span>
            </div>

            {/* Current RSSI */}
            <div className="p-3 rounded-xl bg-[#050814] border border-[#1e2d4a] flex flex-col justify-between">
              <span className="text-[11px] font-rajdhani font-extrabold text-slate-300 uppercase tracking-wider block">
                CURRENT RSSI
              </span>
              <span className="text-base font-orbitron font-extrabold text-[#38BDF8] font-mono-num mt-1">
                {telemetry.rssi || -85} dBm
              </span>
            </div>

            {/* Current SNR */}
            <div className="p-3 rounded-xl bg-[#050814] border border-[#1e2d4a] flex flex-col justify-between">
              <span className="text-[11px] font-rajdhani font-extrabold text-slate-300 uppercase tracking-wider block">
                CURRENT SNR
              </span>
              <span className="text-base font-orbitron font-extrabold text-[#00F0FF] font-mono-num mt-1">
                {telemetry.snr || 8.5} dB
              </span>
            </div>

            {/* Mode Value Indicator */}
            <div className="p-3 rounded-xl bg-[#050814] border border-[#1e2d4a] flex flex-col justify-between">
              <span className="text-[11px] font-rajdhani font-extrabold text-slate-300 uppercase tracking-wider block">
                ADAPTIVE VALUE
              </span>
              <span className="text-base font-orbitron font-extrabold text-white font-mono-num mt-1">
                {modeInfo.numericVal} / 2
              </span>
            </div>
          </div>
        </div>

        {/* Communication Health Gauge */}
        <div className="md:col-span-5 bg-[#0b1429]/90 backdrop-blur-md rounded-2xl p-4.5 border border-[#1e2d4a] hover:border-[#00F0FF]/40 transition-all shadow-xl flex flex-col justify-between items-center text-center">
          <div className="w-full flex justify-between items-center border-b border-[#1e2d4a] pb-2.5">
            <h3 className="text-xs md:text-sm font-orbitron font-extrabold text-white uppercase tracking-wider glow-text-cyan flex items-center gap-2">
              <Signal className="w-4 h-4 text-[#00F0FF]" />
              COMMUNICATION HEALTH
            </h3>
            <span className="text-xs font-mono font-bold text-slate-300">0 – 100%</span>
          </div>

          <div className="relative my-2 flex items-center justify-center">
            <svg className="w-36 h-36 transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r={radius}
                stroke="#1e2d4a"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r={radius}
                stroke={healthInfo.color}
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-orbitron font-extrabold font-mono-num text-white glow-text-cyan">
                {healthInfo.healthPct}%
              </span>
              <span className="text-xs font-rajdhani font-extrabold uppercase mt-0.5" style={{ color: healthInfo.color }}>
                {healthInfo.rating}
              </span>
            </div>
          </div>

          <div className="w-full grid grid-cols-3 gap-1.5 text-[11px] font-mono text-center border-t border-[#1e2d4a] pt-2.5">
            <div className="bg-[#050814] p-1.5 rounded-lg border border-[#1e2d4a]">
              <span className="block text-slate-400 font-rajdhani font-bold">&gt; -80 dBm</span>
              <span className="text-[#00E676] font-bold">Excellent</span>
            </div>
            <div className="bg-[#050814] p-1.5 rounded-lg border border-[#1e2d4a]">
              <span className="block text-slate-400 font-rajdhani font-bold">-80 to -90</span>
              <span className="text-[#FF9100] font-bold">Good</span>
            </div>
            <div className="bg-[#050814] p-1.5 rounded-lg border border-[#1e2d4a]">
              <span className="block text-slate-400 font-rajdhani font-bold">&lt; -90 dBm</span>
              <span className="text-[#FF1744] font-bold">Poor</span>
            </div>
          </div>
        </div>
      </div>

      {/* FULL MODULE SECTIONS (MODE HISTORY, EVENT LOG, ADAPTIVE SUMMARY) */}
      {showFullModule && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Adaptive Mode History Line Graph */}
            <div className="lg:col-span-7 bg-[#0b1429]/90 backdrop-blur-md rounded-2xl p-4.5 border border-[#1e2d4a] shadow-xl flex flex-col">
              <div className="flex justify-between items-center mb-3 border-b border-[#1e2d4a] pb-2.5">
                <span className="text-xs md:text-sm font-orbitron font-extrabold text-white flex items-center gap-2 glow-text-cyan">
                  <Activity className="w-4.5 h-4.5 text-[#00F0FF]" />
                  ADAPTIVE MODE HISTORY
                </span>
                <span className="text-xs font-mono font-bold text-slate-300">Y-AXIS: GOOD=2, MEDIUM=1, POOR=0</span>
              </div>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history.length > 0 ? history : [{ time: '00:00:00', numericMode: 2 }]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
                    <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} />
                    <YAxis
                      domain={[0, 2]}
                      ticks={[0, 1, 2]}
                      tickFormatter={(v) => (v === 2 ? 'GOOD' : v === 1 ? 'MED' : 'POOR')}
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                    />
                    <Tooltip
                      contentStyle={{ background: '#0b1429', borderColor: '#00F0FF', borderRadius: 8, fontSize: 12, color: '#fff' }}
                      formatter={(val: any) => [val === 2 ? 'GOOD (500ms)' : val === 1 ? 'MEDIUM (1000ms)' : 'POOR (2000ms)', 'Mode']}
                    />
                    <Line
                      type="stepAfter"
                      dataKey="numericMode"
                      stroke="#00F0FF"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#00F0FF' }}
                      activeDot={{ r: 6, fill: '#00E676' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Adaptive Event Log */}
            <div className="lg:col-span-5 bg-[#0b1429]/90 backdrop-blur-md rounded-2xl p-4.5 border border-[#1e2d4a] shadow-xl flex flex-col h-full min-h-[260px]">
              <div className="flex justify-between items-center border-b border-[#1e2d4a] pb-2.5 mb-2.5">
                <span className="text-xs md:text-sm font-orbitron font-extrabold text-white flex items-center gap-2 glow-text-cyan">
                  <Clock className="w-4.5 h-4.5 text-[#00F0FF]" />
                  ADAPTIVE EVENT LOG
                </span>
                <span className="text-xs font-mono text-[#00E676] font-bold">{eventLog.length} EVENTS</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin max-h-[190px]">
                {eventLog.length === 0 ? (
                  <div className="text-center text-xs font-rajdhani text-slate-400 py-8 italic">
                    No adaptive mode transitions recorded yet. Log updates when communication mode changes.
                  </div>
                ) : (
                  eventLog.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-2.5 rounded-xl bg-[#050814] border border-[#1e2d4a] hover:border-[#00F0FF]/30 transition-all text-xs font-mono font-bold"
                    >
                      <div className="flex justify-between items-center text-[#00F0FF]">
                        <span className="font-mono-num">{evt.timestamp}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-orbitron ${
                          evt.mode === 'GOOD' ? 'bg-[#00E676]/20 text-[#00E676]' : evt.mode === 'MEDIUM' ? 'bg-[#FF9100]/20 text-[#FF9100]' : 'bg-[#FF1744]/20 text-[#FF1744]'
                        }`}>
                          MODE : {evt.mode}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-1.5 text-slate-300 text-[11px] font-rajdhani font-semibold">
                        <span>INTERVAL: <strong className="text-white">{evt.recommendedInterval}</strong></span>
                        <span>RSSI: <strong className="text-[#38BDF8]">{evt.rssi} dBm</strong></span>
                        <span>SNR: <strong className="text-[#00F0FF]">{evt.snr} dB</strong></span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Adaptive Telemetry Summary Card */}
          <div className="bg-[#0b1429]/90 backdrop-blur-md rounded-2xl p-4.5 border border-[#1e2d4a] shadow-xl">
            <div className="flex justify-between items-center border-b border-[#1e2d4a] pb-3 mb-3.5">
              <span className="text-xs md:text-sm font-orbitron font-extrabold text-white flex items-center gap-2 glow-text-cyan">
                <ShieldCheck className="w-5 h-5 text-[#00E676]" />
                ADAPTIVE TELEMETRY SUMMARY
              </span>
              <span className="text-xs font-orbitron font-bold text-[#00F0FF] bg-[#00F0FF]/15 px-3 py-1 rounded-full border border-[#00F0FF]/40">
                MISSION COMPREHENSIVE
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              <div className="p-3 rounded-xl bg-[#050814] border border-[#1e2d4a]">
                <span className="text-[11px] font-rajdhani font-extrabold text-slate-300 uppercase block">GOOD DURATION</span>
                <span className="text-base font-orbitron font-extrabold text-[#00E676] font-mono-num mt-1 block">
                  {summary.goodDurationFormatted}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#050814] border border-[#1e2d4a]">
                <span className="text-[11px] font-rajdhani font-extrabold text-slate-300 uppercase block">MEDIUM DURATION</span>
                <span className="text-base font-orbitron font-extrabold text-[#FF9100] font-mono-num mt-1 block">
                  {summary.mediumDurationFormatted}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#050814] border border-[#1e2d4a]">
                <span className="text-[11px] font-rajdhani font-extrabold text-slate-300 uppercase block">POOR DURATION</span>
                <span className="text-base font-orbitron font-extrabold text-[#FF1744] font-mono-num mt-1 block">
                  {summary.poorDurationFormatted}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#050814] border border-[#1e2d4a]">
                <span className="text-[11px] font-rajdhani font-extrabold text-slate-300 uppercase block">AVG RSSI</span>
                <span className="text-base font-orbitron font-extrabold text-[#38BDF8] font-mono-num mt-1 block">
                  {summary.avgRssi} dBm
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#050814] border border-[#1e2d4a]">
                <span className="text-[11px] font-rajdhani font-extrabold text-slate-300 uppercase block">MIN / MAX RSSI</span>
                <span className="text-base font-orbitron font-extrabold text-[#38BDF8] font-mono-num mt-1 block">
                  {summary.minRssi} / {summary.maxRssi}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#050814] border border-[#1e2d4a]">
                <span className="text-[11px] font-rajdhani font-extrabold text-slate-300 uppercase block">AVERAGE SNR</span>
                <span className="text-base font-orbitron font-extrabold text-[#00F0FF] font-mono-num mt-1 block">
                  {summary.avgSnr} dB
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#050814] border border-[#1e2d4a]">
                <span className="text-[11px] font-rajdhani font-extrabold text-slate-300 uppercase block">AVG RECOMMENDED TX</span>
                <span className="text-base font-orbitron font-extrabold text-[#00E676] font-mono-num mt-1 block">
                  {summary.avgRecommendedIntervalStr}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#050814] border border-[#1e2d4a]">
                <span className="text-[11px] font-rajdhani font-extrabold text-slate-300 uppercase block">PACKET LOSS %</span>
                <span className="text-base font-orbitron font-extrabold text-[#FF2E93] font-mono-num mt-1 block">
                  {summary.packetLossPercentage}%
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
