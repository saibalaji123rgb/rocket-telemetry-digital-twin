import React from 'react';
import { AlertItem } from '../../types/telemetry';
import { AlertTriangle, ShieldAlert, CheckCircle, Bell } from 'lucide-react';

interface AlertsViewProps {
  alerts: AlertItem[];
}

export default function AlertsView({ alerts }: AlertsViewProps) {
  const criticalCount = alerts.filter((a) => a.type === 'CRITICAL').length;
  const warningCount = alerts.filter((a) => a.type === 'WARNING').length;

  return (
    <div className="space-y-4 font-sans">
      {/* Header Bar */}
      <div className="panel-glass p-5 rounded-2xl flex justify-between items-center shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-[#FF2E93]/15 text-[#FF2E93] border border-[#FF2E93]/40 shadow-[0_0_15px_rgba(255,46,147,0.25)]">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-orbitron font-extrabold text-white tracking-widest uppercase glow-text-cyan">
              SAFETY ALERTS & LIMIT EXCURSION MONITOR
            </h1>
            <p className="text-xs md:text-sm font-rajdhani font-bold text-slate-200 tracking-wider mt-0.5">
              REALTIME THRESHOLD COMPLIANCE & AUTOMATED HAZARD DETECTOR
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs md:text-sm font-mono font-bold">
          <div className="bg-[#FF2E93]/15 border border-[#FF2E93]/40 px-3.5 py-2 rounded-xl text-[#FF2E93] font-orbitron font-extrabold glow-text-red">
            CRITICAL: {criticalCount}
          </div>
          <div className="bg-[#FFB703]/15 border border-[#FFB703]/40 px-3.5 py-2 rounded-xl text-[#FFB703] font-orbitron font-extrabold glow-text-amber">
            WARNINGS: {warningCount}
          </div>
        </div>
      </div>

      {/* Main Alerts List Panel */}
      <div className="bg-[#0b1429]/90 backdrop-blur-md rounded-2xl p-5 border border-[#1e2d4a] shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b border-[#1e2d4a] pb-3">
          <h2 className="text-xs md:text-sm font-orbitron font-extrabold text-white uppercase tracking-wider flex items-center gap-2.5 glow-text-cyan">
            <Bell className="w-5 h-5 text-[#00F0FF]" />
            ACTIVE SYSTEM ALERTS LOG ({alerts.length})
          </h2>
          <span className="text-xs text-[#00E676] font-mono font-bold flex items-center gap-1.5 glow-text-emerald">
            <span className="h-2 w-2 rounded-full bg-[#00E676] animate-pulse"></span>
            AUTONOMOUS MONITORING ACTIVE
          </span>
        </div>

        {alerts.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#050814] border border-[#1e2d4a] space-y-3">
            <div className="p-4 rounded-full bg-[#00E676]/15 border border-[#00E676]/40 text-[#00E676] w-14 h-14 mx-auto flex items-center justify-center glow-text-emerald">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-base font-orbitron font-extrabold text-[#00E676] uppercase tracking-wider glow-text-emerald">
              ALL SUBSYSTEMS NOMINAL — NO ACTIVE SAFETY ALERTS
            </h3>
            <p className="text-xs md:text-sm font-rajdhani font-bold text-slate-200 max-w-md mx-auto leading-relaxed">
              Telemetry frame limits (Temperature ≤ 45°C, Roll/Pitch within ±45°, Satellites ≥ 4, RSSI ≥ -110 dBm) are fully compliant.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4.5 rounded-xl border flex items-center justify-between transition-colors shadow-md ${
                  alert.type === 'CRITICAL'
                    ? 'bg-[#FF2E93]/10 border-[#FF2E93]/40 text-[#FF2E93]'
                    : 'bg-[#FFB703]/10 border-[#FFB703]/40 text-[#FFB703]'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`p-2.5 rounded-xl ${
                      alert.type === 'CRITICAL' ? 'bg-[#FF2E93]/20 text-[#FF2E93]' : 'bg-[#FFB703]/20 text-[#FFB703]'
                    }`}
                  >
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs md:text-sm font-orbitron font-extrabold uppercase tracking-wide text-white">
                        {alert.message}
                      </span>
                      {alert.parameter && (
                        <span className="text-xs px-2.5 py-0.5 rounded-md bg-[#050814] border border-[#1e2d4a] text-[#00F0FF] font-mono font-bold">
                          PARAM: {alert.parameter}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-300 block mt-1 font-mono font-bold">
                      DETECTED AT: {alert.timestamp}
                    </span>
                  </div>
                </div>

                <span
                  className={`px-3 py-1.5 rounded-lg text-xs font-orbitron font-extrabold uppercase tracking-wider font-mono ${
                    alert.type === 'CRITICAL'
                      ? 'bg-[#FF2E93]/20 text-[#FF2E93] border border-[#FF2E93]/40 glow-text-red'
                      : 'bg-[#FFB703]/20 text-[#FFB703] border border-[#FFB703]/40 glow-text-amber'
                  }`}
                >
                  {alert.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

