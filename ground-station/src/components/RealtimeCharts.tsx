import React, { useState, useRef, useEffect } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import { TelemetryFrame, PacketStatistics } from '../types/telemetry';
import {
  BarChart3, Download, Maximize2, RefreshCw, X, Table,
  LineChart, TrendingUp, TrendingDown, Layers, Activity
} from 'lucide-react';
import html2canvas from 'html2canvas';

interface RealtimeChartsProps {
  history: TelemetryFrame[];
  stats: PacketStatistics;
  onResetPacketStats?: () => void;
}

export type MetricKey = 'altitude' | 'speed' | 'pressure' | 'temperature' | 'roll' | 'pitch' | 'rssi' | 'snr';

interface MetricDef {
  key: MetricKey;
  title: string;
  unit: string;
  color: string;
  stroke: string;
  gradientId: string;
  domain?: [number | string, number | string];
}

const METRICS: MetricDef[] = [
  { key: 'altitude', title: 'ALTITUDE vs TIME', unit: 'm', color: 'text-[#00E676] glow-text-emerald', stroke: '#00E676', gradientId: 'colorAlt', domain: ['auto', 'auto'] },
  { key: 'speed', title: 'SPEED vs TIME', unit: 'm/s', color: 'text-[#00F0FF] glow-text-cyan', stroke: '#00F0FF', gradientId: 'colorSpd', domain: ['auto', 'auto'] },
  { key: 'pressure', title: 'PRESSURE vs TIME', unit: 'hPa', color: 'text-[#A855F7]', stroke: '#A855F7', gradientId: 'colorPress', domain: ['auto', 'auto'] },
  { key: 'temperature', title: 'TEMPERATURE vs TIME', unit: '°C', color: 'text-[#FFB703] glow-text-amber', stroke: '#FFB703', gradientId: 'colorTemp', domain: ['auto', 'auto'] },
  { key: 'roll', title: 'ROLL vs TIME', unit: '°', color: 'text-[#38BDF8]', stroke: '#38BDF8', gradientId: 'colorRoll', domain: [-180, 180] },
  { key: 'pitch', title: 'PITCH vs TIME', unit: '°', color: 'text-[#A855F7]', stroke: '#A855F7', gradientId: 'colorPitch', domain: [-90, 90] },
  { key: 'rssi', title: 'RSSI vs TIME', unit: 'dBm', color: 'text-[#00E676]', stroke: '#00E676', gradientId: 'colorRssi', domain: [-120, -40] },
  { key: 'snr', title: 'SNR vs TIME', unit: 'dB', color: 'text-[#00F0FF]', stroke: '#00F0FF', gradientId: 'colorSnr', domain: [-10, 20] },
];

export default function RealtimeCharts({ history, stats, onResetPacketStats }: RealtimeChartsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [expandedMetricKey, setExpandedMetricKey] = useState<MetricKey | null>(null);
  const [expandedViewMode, setExpandedViewMode] = useState<'combined' | 'graph' | 'table'>('combined');

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpandedMetricKey(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Take the last 30 frames in chronological order (left to right)
  const chartData = history.slice(0, 30).reverse().map((f) => ({
    time: f.timestamp ? f.timestamp.split('.')[0] : '',
    fullTime: f.timestamp || '',
    packetId: f.packetId || 0,
    altitude: f.altitude,
    pressure: f.pressure,
    speed: f.speed,
    temperature: f.temperature,
    roll: f.roll,
    pitch: f.pitch,
    rssi: f.rssi,
    snr: f.snr
  }));

  // Packet Loss Donut Data
  const pieData = [
    { name: 'Received', value: Math.max(1, stats.packetsReceived), color: '#00E676' },
    { name: 'Lost', value: stats.packetsLost, color: '#FF2E93' }
  ];

  const exportChartsImage = async () => {
    if (!containerRef.current) return;
    try {
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: '#050814',
        scale: 2
      });
      const link = document.createElement('a');
      link.download = `GCS_Telemetry_Charts_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to export charts image:', err);
    }
  };

  const activeMetric = METRICS.find((m) => m.key === expandedMetricKey);

  // Compute summary stats for active modal metric
  let latestVal: number | undefined;
  let maxVal: number | undefined;
  let minVal: number | undefined;
  let avgVal: number | undefined;

  if (activeMetric && chartData.length > 0) {
    const vals = chartData.map((d) => Number(d[activeMetric.key]) || 0);
    latestVal = vals[vals.length - 1];
    maxVal = Math.max(...vals);
    minVal = Math.min(...vals);
    avgVal = vals.reduce((a, b) => a + b, 0) / vals.length;
  }

  return (
    <div ref={containerRef} className="panel-glass rounded-xl p-4.5 shadow-xl space-y-4 font-sans">
      {/* Header & Controls */}
      <div className="flex flex-wrap justify-between items-center border-b border-[#1e2d4a] pb-3.5">
        <div className="flex items-center gap-2.5">
          <BarChart3 className="w-5 h-5 text-[#00F0FF] animate-pulse" />
          <h2 className="text-sm md:text-base font-orbitron font-extrabold text-white tracking-widest uppercase glow-text-cyan">
            REAL-TIME TELEMETRY ANALYTICS & GRAPH ARRAYS
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-orbitron font-bold text-[#00F0FF] bg-[#00F0FF]/15 px-3 py-1 rounded-full border border-[#00F0FF]/40">30 SAMPLES BUFFER</span>
          <button
            onClick={exportChartsImage}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0f1933] text-slate-100 border border-[#1e2d4a] text-xs font-rajdhani font-bold hover:border-[#00F0FF]/50 hover:text-[#00F0FF] transition-all cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" />
            EXPORT CHARTS PNG
          </button>
        </div>
      </div>

      {/* 8 Metric Area Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {METRICS.map((m) => (
          <div key={m.key} className="p-3.5 rounded-xl bg-[#0b1429]/80 border border-[#1e2d4a] hover:border-[#00F0FF]/50 transition-all duration-200 shadow-sm hover:shadow-[0_0_15px_rgba(0,240,255,0.15)]">
            <div className="flex justify-between items-center mb-2">
              <span className={`text-xs md:text-sm font-rajdhani font-extrabold tracking-wider ${m.color}`}>{m.title}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-rajdhani font-bold text-slate-300">{m.unit}</span>
                <button
                  onClick={() => setExpandedMetricKey(m.key)}
                  className="p-1.5 rounded-lg bg-[#050814] border border-[#1e2d4a] text-slate-300 hover:text-[#00F0FF] hover:border-[#00F0FF]/40 transition-colors cursor-pointer"
                  title={`Expand ${m.title}`}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="h-32 w-full cursor-pointer" onClick={() => setExpandedMetricKey(m.key)}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id={m.gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={m.stroke} stopOpacity={0.45} />
                      <stop offset="95%" stopColor={m.stroke} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} domain={m.domain || ['auto', 'auto']} />
                  <Tooltip contentStyle={{ background: '#0b1429', borderColor: '#00F0FF', fontSize: 12, borderRadius: 8, color: '#fff', fontWeight: 600 }} />
                  <Area type="monotone" dataKey={m.key} stroke={m.stroke} strokeWidth={2.2} fillOpacity={1} fill={`url(#${m.gradientId})`} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {/* Packet Loss Donut & Status Bar Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1 font-rajdhani">
        <div className="p-4 rounded-xl bg-[#0b1429]/80 border border-[#1e2d4a] flex items-center justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <span className="text-xs md:text-sm font-orbitron font-extrabold text-white tracking-wider">TELEMETRY PACKET LOSS</span>
              {onResetPacketStats && (
                <button
                  onClick={onResetPacketStats}
                  className="flex items-center gap-1 text-xs font-bold text-[#00F0FF] bg-[#00F0FF]/15 px-2.5 py-1 rounded-full border border-[#00F0FF]/40 hover:bg-[#00F0FF]/30 transition-colors cursor-pointer"
                  title="Reset packet counters manually"
                >
                  <RefreshCw className="w-3 h-3" />
                  RESET COUNTERS
                </button>
              )}
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl font-orbitron font-extrabold text-white font-mono-num glow-text-cyan">
                {stats.packetLossPercentage}%
              </span>
              <span className="text-xs font-extrabold text-slate-300">LOSS RATE</span>
            </div>
            <div className="text-xs text-slate-300 mt-2 space-x-4 font-mono font-bold">
              <span>RECEIVED: <strong className="text-[#00E676]">{stats.packetsReceived}</strong></span>
              <span>LOST: <strong className="text-[#FF2E93]">{stats.packetsLost}</strong></span>
            </div>
          </div>
          <div className="w-28 h-28">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={26} outerRadius={42} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0b1429]/80 border border-[#1e2d4a] flex flex-col justify-between shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs md:text-sm font-orbitron font-extrabold text-white tracking-wider">PACKET RECEPTION Hz RATE</span>
            <span className="text-sm text-[#00E676] font-orbitron font-extrabold font-mono-num glow-text-emerald">{stats.packetRateHz} Hz</span>
          </div>
          <div className="w-full bg-[#050814] rounded-full h-3.5 p-0.5 border border-[#1e2d4a] overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#00F0FF] to-[#00E676] h-full rounded-full transition-all duration-300 shadow-[0_0_10px_#00F0FF]"
              style={{ width: `${Math.min(100, (stats.packetRateHz / 10) * 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-300 mt-2 font-mono font-bold">
            STABLE RECEPTION BANDWIDTH • LOW-LATENCY REALTIME EMITTER
          </p>
        </div>
      </div>

      {/* FULLSCREEN EXPANDED PLOT & DATA MODAL */}
      {expandedMetricKey && activeMetric && (
        <div className="fixed inset-0 z-50 bg-[#050814]/95 backdrop-blur-md p-4 md:p-6 flex flex-col font-sans text-white overflow-hidden">
          {/* Modal Header */}
          <div className="flex flex-wrap justify-between items-center border-b border-[#1e2d4a] pb-4 mb-4 gap-3">
            <div className="flex items-center gap-3.5">
              <div className={`p-3 rounded-xl bg-[#050814] border border-[#1e2d4a] ${activeMetric.color}`}>
                <BarChart3 className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-base md:text-lg font-orbitron font-extrabold text-white uppercase tracking-wider glow-text-cyan">
                    {activeMetric.title} — EXPANDED ANALYTICS
                  </h2>
                  <span className={`text-xs px-3 py-1 rounded-xl font-orbitron font-extrabold bg-[#050814] border border-[#1e2d4a] ${activeMetric.color}`}>
                    {latestVal !== undefined ? `${latestVal.toFixed(1)} ${activeMetric.unit}` : 'N/A'}
                  </span>
                </div>
                <p className="text-xs md:text-sm font-rajdhani font-bold text-slate-200 tracking-wider mt-0.5">HIGH RESOLUTION TELEMETRY BUFFER • 30 SAMPLES</p>
              </div>
            </div>

            {/* View Mode Controls */}
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-[#050814] border border-[#1e2d4a] p-1 rounded-xl text-xs font-orbitron font-extrabold">
                <button
                  onClick={() => setExpandedViewMode('combined')}
                  className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    expandedViewMode === 'combined' ? 'bg-gradient-to-r from-[#00F0FF] to-[#2563EB] text-black shadow-[0_0_10px_rgba(0,240,255,0.4)]' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  DUAL VIEW
                </button>
                <button
                  onClick={() => setExpandedViewMode('graph')}
                  className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    expandedViewMode === 'graph' ? 'bg-gradient-to-r from-[#00F0FF] to-[#2563EB] text-black shadow-[0_0_10px_rgba(0,240,255,0.4)]' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <LineChart className="w-4 h-4" />
                  FULL GRAPH
                </button>
                <button
                  onClick={() => setExpandedViewMode('table')}
                  className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    expandedViewMode === 'table' ? 'bg-gradient-to-r from-[#00F0FF] to-[#2563EB] text-black shadow-[0_0_10px_rgba(0,240,255,0.4)]' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Table className="w-4 h-4" />
                  DATA VALUES
                </button>
              </div>

              <button
                onClick={() => setExpandedMetricKey(null)}
                className="p-2.5 rounded-xl bg-[#050814] border border-[#1e2d4a] text-slate-300 hover:text-[#FF2E93] hover:border-[#FF2E93]/40 transition-all cursor-pointer"
                title="Close (Esc)"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="p-3.5 rounded-xl bg-[#0b1429]/90 border border-[#1e2d4a] flex justify-between items-center shadow-md">
              <div>
                <span className="text-xs font-rajdhani font-extrabold text-slate-200 block uppercase tracking-wider">CURRENT VALUE</span>
                <span className={`text-xl md:text-2xl font-orbitron font-extrabold ${activeMetric.color} font-mono-num`}>
                  {latestVal !== undefined ? `${latestVal.toFixed(2)} ${activeMetric.unit}` : '--'}
                </span>
              </div>
              <Activity className={`w-6 h-6 ${activeMetric.color}`} />
            </div>

            <div className="p-3.5 rounded-xl bg-[#0b1429]/90 border border-[#1e2d4a] flex justify-between items-center shadow-md">
              <div>
                <span className="text-xs font-rajdhani font-extrabold text-slate-200 block uppercase tracking-wider">PEAK (MAX)</span>
                <span className="text-xl md:text-2xl font-orbitron font-extrabold text-[#00E676] font-mono-num glow-text-emerald">
                  {maxVal !== undefined ? `${maxVal.toFixed(2)} ${activeMetric.unit}` : '--'}
                </span>
              </div>
              <TrendingUp className="w-6 h-6 text-[#00E676]" />
            </div>

            <div className="p-3.5 rounded-xl bg-[#0b1429]/90 border border-[#1e2d4a] flex justify-between items-center shadow-md">
              <div>
                <span className="text-xs font-rajdhani font-extrabold text-slate-200 block uppercase tracking-wider">MINIMUM</span>
                <span className="text-xl md:text-2xl font-orbitron font-extrabold text-[#FFB703] font-mono-num glow-text-amber">
                  {minVal !== undefined ? `${minVal.toFixed(2)} ${activeMetric.unit}` : '--'}
                </span>
              </div>
              <TrendingDown className="w-6 h-6 text-[#FFB703]" />
            </div>

            <div className="p-3.5 rounded-xl bg-[#0b1429]/90 border border-[#1e2d4a] flex justify-between items-center shadow-md">
              <div>
                <span className="text-xs font-rajdhani font-extrabold text-slate-200 block uppercase tracking-wider">BUFFER AVERAGE</span>
                <span className="text-xl md:text-2xl font-orbitron font-extrabold text-[#A855F7] font-mono-num">
                  {avgVal !== undefined ? `${avgVal.toFixed(2)} ${activeMetric.unit}` : '--'}
                </span>
              </div>
              <BarChart3 className="w-6 h-6 text-[#A855F7]" />
            </div>
          </div>

          {/* Main Workspace */}
          <div className="flex-1 min-h-0 grid gap-4 overflow-hidden" style={{
            gridTemplateColumns: expandedViewMode === 'combined' ? '1fr 380px' : '1fr'
          }}>
            {/* Expanded Chart Panel */}
            {(expandedViewMode === 'combined' || expandedViewMode === 'graph') && (
              <div className="bg-[#0b1429]/90 rounded-2xl p-4 border border-[#1e2d4a] flex flex-col h-full shadow-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs md:text-sm font-orbitron font-extrabold text-[#00F0FF] flex items-center gap-2 glow-text-cyan">
                    <LineChart className="w-4.5 h-4.5" />
                    HIGH-RESOLUTION PLOT — {activeMetric.title}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#00E676] glow-text-emerald">EMISSION RATE: 10Hz</span>
                </div>
                <div className="flex-1 w-full min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                      <defs>
                        <linearGradient id={`modal_${activeMetric.gradientId}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={activeMetric.stroke} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={activeMetric.stroke} stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
                      <XAxis dataKey="time" tick={{ fill: '#e2e8f0', fontSize: 12, fontWeight: 700 }} label={{ value: 'TIMESTAMP (HH:MM:SS)', position: 'insideBottom', offset: -10, fill: '#00F0FF', fontSize: 11, fontWeight: 800 }} />
                      <YAxis tick={{ fill: '#e2e8f0', fontSize: 12, fontWeight: 700 }} domain={activeMetric.domain || ['auto', 'auto']} label={{ value: activeMetric.unit, angle: -90, position: 'insideLeft', fill: '#00F0FF', fontSize: 11, fontWeight: 800 }} />
                      <Tooltip
                        contentStyle={{ background: '#050814', borderColor: '#1e2d4a', borderRadius: 12, fontSize: 13, fontWeight: 700, color: '#ffffff' }}
                        formatter={(val: any) => [`${Number(val).toFixed(2)} ${activeMetric.unit}`, activeMetric.title]}
                      />
                      <Area type="monotone" dataKey={activeMetric.key} stroke={activeMetric.stroke} strokeWidth={2.5} fillOpacity={1} fill={`url(#modal_${activeMetric.gradientId})`} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Data Table Panel */}
            {(expandedViewMode === 'combined' || expandedViewMode === 'table') && (
              <div className="bg-[#0b1429]/90 rounded-2xl p-4 border border-[#1e2d4a] flex flex-col h-full overflow-hidden shadow-xl">
                <div className="flex justify-between items-center border-b border-[#1e2d4a] pb-2.5 mb-2.5">
                  <span className="text-xs md:text-sm font-orbitron font-extrabold text-white flex items-center gap-2 glow-text-cyan">
                    <Table className="w-4.5 h-4.5 text-[#00F0FF]" />
                    BUFFER DATA POINTS ({chartData.length})
                  </span>
                  <span className="text-xs font-mono font-bold text-[#00F0FF]">UNIT: {activeMetric.unit}</span>
                </div>
                <div className="flex-1 overflow-y-auto pr-1">
                  <table className="w-full text-left text-xs font-rajdhani">
                    <thead className="sticky top-0 bg-[#050814] text-[#00F0FF] text-xs uppercase font-orbitron font-extrabold border-b border-[#1e2d4a]">
                      <tr>
                        <th className="p-2.5">PKT ID</th>
                        <th className="p-2.5">TIME</th>
                        <th className="p-2.5 text-right">VALUE ({activeMetric.unit})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#334155]/60 font-mono-num text-[11px]">
                      {chartData.slice().reverse().map((item, i) => {
                        const val = item[activeMetric.key] as number;
                        return (
                          <tr key={i} className="hover:bg-[#1E293B]/60 transition-colors">
                            <td className="p-2 text-[#3B82F6] font-semibold">#{item.packetId}</td>
                            <td className="p-2 text-[#94A3B8]">{item.fullTime}</td>
                            <td className={`p-2 text-right font-semibold ${activeMetric.color}`}>
                              {val !== undefined ? val.toFixed(2) : '--'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
