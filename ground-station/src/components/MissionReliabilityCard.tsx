import React, { useState, useEffect } from 'react';
import { TelemetryFrame, PacketStatistics } from '../types/telemetry';
import { missionReliabilityModule, MRSBreakdown, MissionReliabilitySummary, MRSEventLogEntry, MRSHistoryPoint } from '../services/MissionReliability';
import { ShieldCheck, Award, Activity, BarChart2, Clock, CheckCircle2, AlertTriangle, Cpu, Gauge, Radio, Signal } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface MissionReliabilityCardProps {
  telemetry: TelemetryFrame;
  stats: PacketStatistics;
  showFullModule?: boolean;
}

export default function MissionReliabilityCard({ telemetry, stats, showFullModule = true }: MissionReliabilityCardProps) {
  const [breakdown, setBreakdown] = useState<MRSBreakdown>(
    missionReliabilityModule.calculateMissionReliability(telemetry, stats, 8)
  );
  const [history, setHistory] = useState<MRSHistoryPoint[]>([]);
  const [eventLog, setEventLog] = useState<MRSEventLogEntry[]>([]);
  const [summary, setSummary] = useState<MissionReliabilitySummary>(missionReliabilityModule.generateMissionReliabilitySummary());

  useEffect(() => {
    // Process frame in MRS module
    const b = missionReliabilityModule.updateFrame(telemetry, stats, 8);
    setBreakdown(b);
    setHistory([...missionReliabilityModule.getMRSHistory()]);
    setEventLog([...missionReliabilityModule.getEventLog()]);
    setSummary(missionReliabilityModule.generateMissionReliabilitySummary());
  }, [telemetry.packetId, telemetry.rssi, telemetry.snr, stats.packetsReceived]);

  // SVG Gauge calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (breakdown.mrs / 100) * circumference;

  return (
    <div className="space-y-4 font-sans text-white">
      {/* TOP ROW: MISSION RELIABILITY SCORE CARD & BREAKDOWN */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Large Circular Gauge Dashboard Card */}
        <div className="md:col-span-5 bg-[#0b1429]/90 backdrop-blur-md rounded-2xl p-4.5 border border-[#1e2d4a] hover:border-[#00F0FF]/40 transition-all shadow-xl flex flex-col justify-between items-center text-center">
          <div className="w-full flex justify-between items-center border-b border-[#1e2d4a] pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30">
                <ShieldCheck className="w-5 h-5 animate-pulse" />
              </div>
              <h3 className="text-sm md:text-base font-orbitron font-extrabold text-white tracking-widest uppercase glow-text-cyan">
                MISSION RELIABILITY SCORE
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-[#00F0FF] bg-[#00F0FF]/15 px-2.5 py-0.5 rounded-full border border-[#00F0FF]/30">
              MRS METRIC
            </span>
          </div>

          {/* Large Circular Gauge */}
          <div className="relative my-3 flex items-center justify-center">
            <svg className="w-44 h-44 transform -rotate-90">
              <circle
                cx="88"
                cy="88"
                r={radius}
                stroke="#1e2d4a"
                strokeWidth="12"
                fill="transparent"
              />
              <circle
                cx="88"
                cy="88"
                r={radius}
                stroke={breakdown.color}
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl md:text-4xl font-orbitron font-extrabold font-mono-num text-white glow-text-cyan">
                {breakdown.mrs}%
              </span>
              <span className="text-xs font-rajdhani font-extrabold uppercase tracking-wider mt-1 px-2.5 py-0.5 rounded-md border bg-[#050814]/80" style={{ color: breakdown.color, borderColor: `${breakdown.color}50` }}>
                GRADE: {breakdown.grade}
              </span>
            </div>
          </div>

          <div className="w-full flex justify-around items-center text-xs font-mono border-t border-[#1e2d4a] pt-3 text-slate-300 font-bold">
            <span className="flex items-center gap-1.5 text-[#00E676]">
              <span className="h-2 w-2 rounded-full bg-[#00E676]"></span> 90-100: Excellent
            </span>
            <span className="flex items-center gap-1.5 text-[#FF9100]">
              <span className="h-2 w-2 rounded-full bg-[#FF9100]"></span> 70-89: Good
            </span>
            <span className="flex items-center gap-1.5 text-[#FF1744]">
              <span className="h-2 w-2 rounded-full bg-[#FF1744]"></span> &lt;70: Poor
            </span>
          </div>
        </div>

        {/* Mission Reliability Breakdown Panel */}
        <div className="md:col-span-7 bg-[#0b1429]/90 backdrop-blur-md rounded-2xl p-4.5 border border-[#1e2d4a] hover:border-[#00F0FF]/40 transition-all shadow-xl flex flex-col justify-between space-y-3">
          <div className="flex justify-between items-center border-b border-[#1e2d4a] pb-2.5">
            <span className="text-xs md:text-sm font-orbitron font-extrabold text-white uppercase tracking-wider glow-text-cyan flex items-center gap-2">
              <BarChart2 className="w-4.5 h-4.5 text-[#00F0FF]" />
              MISSION RELIABILITY BREAKDOWN
            </span>
            <span className="text-xs font-mono text-slate-300 font-bold">FORMULA WEIGHTED INDEX</span>
          </div>

          <div className="space-y-2.5 flex-1">
            {/* 1. Packet Delivery Ratio (35%) */}
            <div>
              <div className="flex justify-between text-xs font-rajdhani font-bold mb-1">
                <span className="text-slate-300">1. PACKET DELIVERY RATIO (35% WEIGHT)</span>
                <span className="text-[#00E676] font-mono-num font-extrabold">{breakdown.pdr}% → +{breakdown.pdrWeighted.toFixed(1)} pts</span>
              </div>
              <div className="w-full bg-[#050814] rounded-full h-2.5 border border-[#1e2d4a] overflow-hidden">
                <div className="bg-[#00E676] h-full rounded-full transition-all duration-300" style={{ width: `${breakdown.pdr}%` }}></div>
              </div>
            </div>

            {/* 2. RSSI Score (25%) */}
            <div>
              <div className="flex justify-between text-xs font-rajdhani font-bold mb-1">
                <span className="text-slate-300">2. RSSI SIGNAL SCORE (25% WEIGHT)</span>
                <span className="text-[#38BDF8] font-mono-num font-extrabold">{breakdown.rssiScore}/100 → +{breakdown.rssiWeighted.toFixed(1)} pts</span>
              </div>
              <div className="w-full bg-[#050814] rounded-full h-2.5 border border-[#1e2d4a] overflow-hidden">
                <div className="bg-[#38BDF8] h-full rounded-full transition-all duration-300" style={{ width: `${breakdown.rssiScore}%` }}></div>
              </div>
            </div>

            {/* 3. SNR Score (15%) */}
            <div>
              <div className="flex justify-between text-xs font-rajdhani font-bold mb-1">
                <span className="text-slate-300">3. SNR SIGNAL SCORE (15% WEIGHT)</span>
                <span className="text-[#00F0FF] font-mono-num font-extrabold">{breakdown.snrScore}/100 → +{breakdown.snrWeighted.toFixed(1)} pts</span>
              </div>
              <div className="w-full bg-[#050814] rounded-full h-2.5 border border-[#1e2d4a] overflow-hidden">
                <div className="bg-[#00F0FF] h-full rounded-full transition-all duration-300" style={{ width: `${breakdown.snrScore}%` }}></div>
              </div>
            </div>

            {/* 4. Sensor Availability (15%) */}
            <div>
              <div className="flex justify-between text-xs font-rajdhani font-bold mb-1">
                <span className="text-slate-300">4. SENSOR AVAILABILITY (15% WEIGHT)</span>
                <span className="text-[#A855F7] font-mono-num font-extrabold">{breakdown.sensorAvailability}% → +{breakdown.sensorWeighted.toFixed(1)} pts</span>
              </div>
              <div className="w-full bg-[#050814] rounded-full h-2.5 border border-[#1e2d4a] overflow-hidden">
                <div className="bg-[#A855F7] h-full rounded-full transition-all duration-300" style={{ width: `${breakdown.sensorAvailability}%` }}></div>
              </div>
            </div>

            {/* 5. Latency Score (10%) */}
            <div>
              <div className="flex justify-between text-xs font-rajdhani font-bold mb-1">
                <span className="text-slate-300">5. LATENCY SCORE (10% WEIGHT)</span>
                <span className="text-[#FFB703] font-mono-num font-extrabold">{breakdown.latencyMs}ms ({breakdown.latencyScore}/100) → +{breakdown.latencyWeighted.toFixed(1)} pts</span>
              </div>
              <div className="w-full bg-[#050814] rounded-full h-2.5 border border-[#1e2d4a] overflow-hidden">
                <div className="bg-[#FFB703] h-full rounded-full transition-all duration-300" style={{ width: `${breakdown.latencyScore}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FULL MODULE SECTIONS (HISTORY GRAPH, EVENT LOG, MRS SUMMARY) */}
      {showFullModule && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Mission Reliability History Live Graph */}
            <div className="lg:col-span-7 bg-[#0b1429]/90 backdrop-blur-md rounded-2xl p-4.5 border border-[#1e2d4a] shadow-xl flex flex-col">
              <div className="flex justify-between items-center mb-3 border-b border-[#1e2d4a] pb-2.5">
                <span className="text-xs md:text-sm font-orbitron font-extrabold text-white flex items-center gap-2 glow-text-cyan">
                  <Activity className="w-4.5 h-4.5 text-[#00F0FF]" />
                  MISSION RELIABILITY HISTORY
                </span>
                <span className="text-xs font-mono font-bold text-[#00E676]">CONTINUOUS LIVE TREND</span>
              </div>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history.length > 0 ? history : [{ time: '00:00:00', mrs: 94 }]}>
                    <defs>
                      <linearGradient id="mrsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={breakdown.color} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={breakdown.color} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
                    <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                    <Tooltip
                      contentStyle={{ background: '#0b1429', borderColor: '#00F0FF', borderRadius: 8, fontSize: 12, color: '#fff' }}
                      formatter={(val: any) => [`${val}%`, 'MRS Score']}
                    />
                    <Area type="monotone" dataKey="mrs" stroke={breakdown.color} strokeWidth={2.5} fillOpacity={1} fill="url(#mrsGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Mission Reliability Event Log */}
            <div className="lg:col-span-5 bg-[#0b1429]/90 backdrop-blur-md rounded-2xl p-4.5 border border-[#1e2d4a] shadow-xl flex flex-col h-full min-h-[260px]">
              <div className="flex justify-between items-center border-b border-[#1e2d4a] pb-2.5 mb-2.5">
                <span className="text-xs md:text-sm font-orbitron font-extrabold text-white flex items-center gap-2 glow-text-cyan">
                  <Clock className="w-4.5 h-4.5 text-[#00F0FF]" />
                  MRS EVENT LOG (&gt;5% DELTA)
                </span>
                <span className="text-xs font-mono text-[#00E676] font-bold">{eventLog.length} EVENTS</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin max-h-[190px]">
                {eventLog.length === 0 ? (
                  <div className="text-center text-xs font-rajdhani text-slate-400 py-8 italic">
                    No significant MRS variations (&gt;5%) detected. Mission stability remains steady.
                  </div>
                ) : (
                  eventLog.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-2.5 rounded-xl bg-[#050814] border border-[#1e2d4a] hover:border-[#00F0FF]/30 transition-all text-xs font-mono font-bold"
                    >
                      <div className="flex justify-between items-center text-[#00F0FF]">
                        <span className="font-mono-num">{evt.timestamp}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-orbitron bg-[#FF9100]/20 text-[#FF9100]">
                          DELTA: {evt.delta > 0 ? `+${evt.delta}%` : `${evt.delta}%`}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-slate-200 text-[11px] font-rajdhani">
                        <span>PREVIOUS: <strong className="text-slate-400">{evt.previousMrs}%</strong> → CURRENT: <strong className="text-white">{evt.currentMrs}%</strong></span>
                        <span className="text-[#FF2E93] font-bold">REASON: {evt.reason}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Mission Reliability Summary Card */}
          <div className="bg-[#0b1429]/90 backdrop-blur-md rounded-2xl p-4.5 border border-[#1e2d4a] shadow-xl">
            <div className="flex justify-between items-center border-b border-[#1e2d4a] pb-3 mb-3.5">
              <span className="text-xs md:text-sm font-orbitron font-extrabold text-white flex items-center gap-2 glow-text-cyan">
                <Award className="w-5 h-5 text-[#00F0FF]" />
                MISSION RELIABILITY SUMMARY
              </span>
              <span className="text-xs font-orbitron font-bold text-[#00E676] bg-[#00E676]/15 px-3 py-1 rounded-full border border-[#00E676]/40">
                FINAL GRADE: {summary.finalGrade}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              <div className="p-3 rounded-xl bg-[#050814] border border-[#1e2d4a]">
                <span className="text-[11px] font-rajdhani font-extrabold text-slate-300 uppercase block">AVERAGE MRS</span>
                <span className="text-base font-orbitron font-extrabold text-[#00E676] font-mono-num mt-1 block">
                  {summary.avgMrs}%
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#050814] border border-[#1e2d4a]">
                <span className="text-[11px] font-rajdhani font-extrabold text-slate-300 uppercase block">MAXIMUM MRS</span>
                <span className="text-base font-orbitron font-extrabold text-[#00F0FF] font-mono-num mt-1 block">
                  {summary.maxMrs}%
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#050814] border border-[#1e2d4a]">
                <span className="text-[11px] font-rajdhani font-extrabold text-slate-300 uppercase block">MINIMUM MRS</span>
                <span className="text-base font-orbitron font-extrabold text-[#FFB703] font-mono-num mt-1 block">
                  {summary.minMrs}%
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#050814] border border-[#1e2d4a]">
                <span className="text-[11px] font-rajdhani font-extrabold text-slate-300 uppercase block">AVERAGE RSSI</span>
                <span className="text-base font-orbitron font-extrabold text-[#38BDF8] font-mono-num mt-1 block">
                  {summary.avgRssi} dBm
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#050814] border border-[#1e2d4a]">
                <span className="text-[11px] font-rajdhani font-extrabold text-slate-300 uppercase block">AVERAGE SNR</span>
                <span className="text-base font-orbitron font-extrabold text-[#00F0FF] font-mono-num mt-1 block">
                  {summary.avgSnr} dB
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#050814] border border-[#1e2d4a]">
                <span className="text-[11px] font-rajdhani font-extrabold text-slate-300 uppercase block">AVERAGE PDR</span>
                <span className="text-base font-orbitron font-extrabold text-[#00E676] font-mono-num mt-1 block">
                  {summary.avgPdr}%
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#050814] border border-[#1e2d4a]">
                <span className="text-[11px] font-rajdhani font-extrabold text-slate-300 uppercase block">SENSOR AVAILABILITY</span>
                <span className="text-base font-orbitron font-extrabold text-[#A855F7] font-mono-num mt-1 block">
                  {summary.avgSensorAvailability}%
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#050814] border border-[#1e2d4a]">
                <span className="text-[11px] font-rajdhani font-extrabold text-slate-300 uppercase block">AVERAGE LATENCY</span>
                <span className="text-base font-orbitron font-extrabold text-[#FFB703] font-mono-num mt-1 block">
                  {summary.avgLatencyMs} ms
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#050814] border border-[#1e2d4a]">
                <span className="text-[11px] font-rajdhani font-extrabold text-slate-300 uppercase block">MISSION GRADE</span>
                <span className="text-base font-orbitron font-extrabold mt-1 block" style={{ color: summary.color }}>
                  {summary.finalGrade}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
