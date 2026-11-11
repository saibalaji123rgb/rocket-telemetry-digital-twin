import React, { useState } from 'react';
import { MissionSetupData, ConnectionState } from '../types/telemetry';
import { Sliders, Activity, Play, MonitorPlay, Usb, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface MissionSetupProps {
  onStartMission: (setup: MissionSetupData, isDemo: boolean) => void;
  onConnectSerial: () => Promise<void>;
  uartState: ConnectionState;
  loraState: ConnectionState;
  telemetryState: ConnectionState;
  isSimulating: boolean;
  onToggleDemoMode: (enable: boolean) => void;
}

export default function MissionSetup({
  onStartMission,
  onConnectSerial,
  uartState,
  loraState,
  telemetryState,
  isSimulating,
  onToggleDemoMode
}: MissionSetupProps) {
  const [missionName, setMissionName] = useState('DT-ROCKET MISSION 01');
  const [missionId, setMissionId] = useState(`MIS-${Math.floor(1000 + Math.random() * 9000)}`);
  const [operatorName, setOperatorName] = useState('FLIGHT DIRECTOR');
  const [missionType, setMissionType] = useState('HIGH ALTITUDE SOUNDING ROCKET');

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    onStartMission(
      {
        missionName,
        missionId,
        operatorName,
        missionType
      },
      isSimulating
    );
  };

  const getStatusBadge = (state: ConnectionState) => {
    switch (state) {
      case 'Connected':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" />
            CONNECTED
          </span>
        );
      case 'Connecting':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 font-mono">
            <AlertTriangle className="w-3.5 h-3.5" />
            CONNECTING...
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 font-mono">
            <XCircle className="w-3.5 h-3.5" />
            DISCONNECTED
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0B1120] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      <div className="w-full max-w-3xl bg-[#111827] rounded-xl p-8 border border-[#334155] shadow-xl relative z-10 space-y-6">
        <div className="flex items-center justify-between border-b border-[#334155] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#2563EB]/15 border border-[#2563EB]/30 flex items-center justify-center text-[#3B82F6]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F8FAFC] tracking-wider uppercase">
                MISSION INITIALIZATION & CONFIGURATION
              </h2>
              <p className="text-xs text-[#94A3B8]">
                CONFIGURE FLIGHT PARAMETERS & HARDWARE TELEMETRY PORT
              </p>
            </div>
          </div>
          <div className="text-right font-mono">
            <span className="text-[10px] text-[#94A3B8] block">SYSTEM DATE</span>
            <span className="text-xs text-[#F8FAFC] font-semibold">
              {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}
            </span>
          </div>
        </div>

        <form onSubmit={handleStart} className="space-y-6">
          {/* Mission Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[#CBD5E1] mb-1.5 font-medium">MISSION NAME</label>
              <input
                type="text"
                value={missionName}
                onChange={(e) => setMissionName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-md bg-[#0B1120] border border-[#334155] text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]"
                required
              />
            </div>
            <div>
              <label className="block text-[#CBD5E1] mb-1.5 font-medium">MISSION ID</label>
              <input
                type="text"
                value={missionId}
                onChange={(e) => setMissionId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-md bg-[#0B1120] border border-[#334155] text-[#3B82F6] font-bold font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-[#CBD5E1] mb-1.5 font-medium">CHIEF OPERATOR NAME</label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-md bg-[#0B1120] border border-[#334155] text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]"
                required
              />
            </div>
            <div>
              <label className="block text-[#CBD5E1] mb-1.5 font-medium">MISSION VEHICLE TYPE</label>
              <select
                value={missionType}
                onChange={(e) => setMissionType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-md bg-[#0B1120] border border-[#334155] text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]"
              >
                <option value="HIGH ALTITUDE SOUNDING ROCKET">HIGH ALTITUDE SOUNDING ROCKET</option>
                <option value="ORBITAL TEST VEHICLE (OTV)">ORBITAL TEST VEHICLE (OTV)</option>
                <option value="CANSTAT / PAYLOAD DROPTANK">CANSTAT / PAYLOAD DROPTANK</option>
                <option value="FLIGHT DEMONSTRATOR MODE">FLIGHT DEMONSTRATOR MODE</option>
              </select>
            </div>
          </div>

          {/* System Status Indicators Box */}
          <div className="p-4 rounded-lg bg-[#1E293B] border border-[#334155] space-y-3">
            <h3 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider mb-2">
              HARDWARE COMMUNICATION BACKPLANE STATUS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center justify-between p-2.5 rounded-md bg-[#0B1120] border border-[#334155]">
                <div className="flex items-center gap-2">
                  <Usb className="w-4 h-4 text-[#3B82F6]" />
                  <span className="text-xs text-[#CBD5E1] font-medium">UART (COM PORT)</span>
                </div>
                {getStatusBadge(uartState)}
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-md bg-[#0B1120] border border-[#334155]">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#3B82F6]" />
                  <span className="text-xs text-[#CBD5E1] font-medium">LoRa TRANSCEIVER</span>
                </div>
                {getStatusBadge(loraState)}
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-md bg-[#0B1120] border border-[#334155]">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#3B82F6]" />
                  <span className="text-xs text-[#CBD5E1] font-medium">TELEMETRY STREAM</span>
                </div>
                {getStatusBadge(telemetryState)}
              </div>
            </div>
          </div>

          {/* Action Button Row */}
          <div className="flex flex-col md:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={onConnectSerial}
              className="flex-1 py-2.5 px-4 rounded-md bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-[#CBD5E1] font-medium text-xs uppercase flex items-center justify-center gap-2 transition-colors"
            >
              <Usb className="w-4 h-4 text-[#3B82F6]" />
              CONNECT RECEIVER (WEB SERIAL)
            </button>

            <button
              type="button"
              onClick={() => onToggleDemoMode(!isSimulating)}
              className={`flex-1 py-2.5 px-4 rounded-md font-medium text-xs uppercase flex items-center justify-center gap-2 transition-colors border ${
                isSimulating
                  ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30'
                  : 'bg-[#1E293B] text-[#94A3B8] border-[#334155]'
              }`}
            >
              <MonitorPlay className="w-4 h-4" />
              {isSimulating ? 'DEMO MODE: ACTIVE' : 'ENABLE DEMO MODE'}
            </button>

            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-md bg-[#2563EB] text-white font-semibold text-xs uppercase flex items-center justify-center gap-2 hover:bg-[#1D4ED8] transition-colors"
            >
              <Play className="w-4 h-4 fill-current" />
              START MISSION DASHBOARD
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
