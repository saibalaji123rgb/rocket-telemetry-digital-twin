import React, { useState } from 'react';
import { TelemetryFrame } from '../types/telemetry';
import { Database, Search, Download, Trash2, Filter } from 'lucide-react';

interface TelemetryLogProps {
  history: TelemetryFrame[];
  onClearLog: () => void;
}

export default function TelemetryLog({ history, onClearLog }: TelemetryLogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'VIBRATION' | 'ALTITUDE_HIGH'>('ALL');

  const filteredLogs = history.filter((f) => {
    // Search filter
    const searchMatch =
      String(f.packetId).includes(searchTerm) ||
      f.timestamp.includes(searchTerm) ||
      String(f.altitude).includes(searchTerm);

    if (!searchMatch) return false;

    if (filterMode === 'VIBRATION') return f.vibration === 1;
    if (filterMode === 'ALTITUDE_HIGH') return f.altitude > 100;
    return true;
  });

  const exportCSV = () => {
    if (history.length === 0) return;

    const headers = [
      'Time', 'PacketID', 'Latitude', 'Longitude', 'Roll', 'Pitch',
      'Speed', 'Temperature', 'Pressure', 'Altitude', 'Vibration', 'Satellites', 'RSSI', 'SNR'
    ];

    const rows = history.map((f) => [
      f.timestamp, f.packetId, f.latitude, f.longitude, f.roll, f.pitch,
      f.speed, f.temperature, f.pressure, f.altitude, f.vibration, f.satellites, f.rssi, f.snr
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Telemetry_Log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="panel-glass rounded-xl p-4.5 shadow-xl font-sans space-y-3.5">
      {/* Header controls */}
      <div className="flex flex-wrap justify-between items-center gap-3 border-b border-[#1e2d4a] pb-3.5">
        <div className="flex items-center gap-2.5">
          <Database className="w-5 h-5 text-[#00F0FF] animate-pulse" />
          <h2 className="text-sm md:text-base font-orbitron font-extrabold text-white tracking-widest uppercase glow-text-cyan">
            LIVE TELEMETRY DATA STREAM LOG
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-rajdhani font-bold">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-300 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Packet / Time / Alt..."
              className="pl-9 pr-3.5 py-2 rounded-lg bg-[#050814] border border-[#1e2d4a] text-xs font-bold text-white w-52 focus:outline-none focus:border-[#00F0FF] shadow-inner"
            />
          </div>

          {/* Filter dropdown */}
          <div className="flex items-center gap-2 bg-[#050814] border border-[#1e2d4a] px-3 py-2 rounded-lg text-xs font-bold text-slate-200">
            <Filter className="w-4 h-4 text-[#00F0FF]" />
            <select
              value={filterMode}
              onChange={(e: any) => setFilterMode(e.target.value)}
              className="bg-transparent text-white outline-none cursor-pointer font-bold"
            >
              <option value="ALL" className="bg-[#0b1429]">ALL PACKETS</option>
              <option value="VIBRATION" className="bg-[#0b1429]">VIBRATION ALERTS ONLY</option>
              <option value="ALTITUDE_HIGH" className="bg-[#0b1429]">ALTITUDE &gt; 100m</option>
            </select>
          </div>

          {/* Export CSV button */}
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#00E676]/15 text-[#00E676] border border-[#00E676]/40 text-xs font-bold hover:bg-[#00E676]/25 transition-all cursor-pointer shadow-sm hover:shadow-[0_0_12px_rgba(0,230,118,0.25)]"
          >
            <Download className="w-4 h-4" />
            EXPORT CSV
          </button>

          {/* Clear Log button */}
          <button
            onClick={onClearLog}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FF2E93]/15 text-[#FF2E93] border border-[#FF2E93]/40 text-xs font-bold hover:bg-[#FF2E93]/25 transition-all cursor-pointer shadow-sm hover:shadow-[0_0_12px_rgba(255,46,147,0.25)]"
          >
            <Trash2 className="w-4 h-4" />
            CLEAR LOG
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="max-h-72 overflow-y-auto border border-[#1e2d4a] rounded-xl shadow-inner bg-[#050814]/80">
        <table className="w-full text-left text-xs font-rajdhani">
          <thead className="sticky top-0 bg-[#0b1429] text-[#00F0FF] text-xs uppercase font-orbitron font-extrabold border-b border-[#1e2d4a] shadow-sm">
            <tr>
              <th className="p-3">TIME</th>
              <th className="p-3">PKT ID</th>
              <th className="p-3">LAT</th>
              <th className="p-3">LON</th>
              <th className="p-3">ROLL</th>
              <th className="p-3">PITCH</th>
              <th className="p-3">SPEED</th>
              <th className="p-3">TEMP</th>
              <th className="p-3">PRESS</th>
              <th className="p-3">ALT</th>
              <th className="p-3">VIB</th>
              <th className="p-3">SATS</th>
              <th className="p-3">RSSI</th>
              <th className="p-3">SNR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2d4a]/60 font-mono-num text-xs font-bold">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={14} className="p-6 text-center text-slate-300 font-rajdhani font-bold text-sm">
                  NO TELEMETRY PACKETS IN BUFFER
                </td>
              </tr>
            ) : (
              filteredLogs.map((f, idx) => (
                <tr key={idx} className="odd:bg-[#050814]/50 even:bg-[#0b1429]/40 hover:bg-[#00F0FF]/15 transition-colors">
                  <td className="p-3 text-slate-300 font-mono">{f.timestamp}</td>
                  <td className="p-3 text-[#00F0FF] font-orbitron font-extrabold glow-text-cyan">#{f.packetId}</td>
                  <td className="p-3 text-slate-200">{f.latitude?.toFixed(6)}</td>
                  <td className="p-3 text-slate-200">{f.longitude?.toFixed(6)}</td>
                  <td className="p-3 text-[#38BDF8] font-bold">{f.roll?.toFixed(1)}°</td>
                  <td className="p-3 text-[#A855F7] font-bold">{f.pitch?.toFixed(1)}°</td>
                  <td className="p-3 text-[#00F0FF] font-bold">{f.speed?.toFixed(1)} m/s</td>
                  <td className="p-3 text-[#FFB703] font-bold">{f.temperature?.toFixed(1)}°C</td>
                  <td className="p-3 text-[#A855F7]">{f.pressure?.toFixed(1)}</td>
                  <td className="p-3 text-[#00E676] font-extrabold glow-text-emerald">{f.altitude?.toFixed(1)} m</td>
                  <td className="p-3">
                    {f.vibration === 1 ? (
                      <span className="text-[#FF2E93] font-extrabold bg-[#FF2E93]/20 px-2.5 py-0.5 rounded-full border border-[#FF2E93]/40 text-xs animate-pulse">HIGH</span>
                    ) : (
                      <span className="text-slate-300 font-bold">NORM</span>
                    )}
                  </td>
                  <td className="p-3 text-slate-100">{f.satellites}</td>
                  <td className="p-3 text-[#00E676] font-bold">{f.rssi}</td>
                  <td className="p-3 text-[#00F0FF] font-bold">{f.snr}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
