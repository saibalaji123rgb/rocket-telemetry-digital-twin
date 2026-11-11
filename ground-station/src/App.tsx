import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import MissionSetup from './components/MissionSetup';
import Header from './components/Header';
import Sidebar, { NavTabId } from './components/Sidebar';

import TelemetryOverview from './components/TelemetryOverview';
import DigitalTwin3D from './components/DigitalTwin3D';
import OrientationHealth from './components/OrientationHealth';
import RealtimeCharts from './components/RealtimeCharts';
import TelemetryLog from './components/TelemetryLog';
import PostMissionAnalysis from './components/PostMissionAnalysis';

import LiveTelemetryView from './components/views/LiveTelemetryView';
import DigitalTwinView from './components/views/DigitalTwinView';
import MapTrackingView from './components/views/MapTrackingView';
import AlertsView from './components/views/AlertsView';
import SystemStatusView from './components/views/SystemStatusView';
import MissionStatsView from './components/views/MissionStatsView';
import SettingsView from './components/views/SettingsView';
import MissionEnergyOptimizationView from './components/views/MissionEnergyOptimizationView';
import AdaptiveTelemetryView from './components/views/AdaptiveTelemetryView';
import MissionReliabilityView from './components/views/MissionReliabilityView';
import AdaptiveTelemetryCard from './components/AdaptiveTelemetryCard';
import MissionReliabilityCard from './components/MissionReliabilityCard';

import { telemetryStore } from './services/TelemetryStore';
import { serialManager } from './services/SerialManager';
import {
  TelemetryFrame, ConnectionState, PacketStatistics,
  SystemHealth, AlertItem, MissionSetupData
} from './types/telemetry';

export default function App() {
  const [authState, setAuthState] = useState<{ isAuthenticated: boolean; user: any }>({
    isAuthenticated: true,
    user: { username: 'flight_commander', role: 'Chief Flight Controller' }
  });

  const [missionActive, setMissionActive] = useState(true);
  const [showPostMission, setShowPostMission] = useState(false);
  const [missionSetup, setMissionSetup] = useState<MissionSetupData>({
    missionName: 'DT-ROCKET MISSION 01',
    missionId: 'MIS-9082',
    operatorName: 'FLIGHT DIRECTOR',
    missionType: 'HIGH ALTITUDE SOUNDING ROCKET'
  });

  const [activeTab, setActiveTab] = useState<NavTabId>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [telemetry, setTelemetry] = useState<TelemetryFrame>(telemetryStore.getCurrentFrame());
  const [stats, setStats] = useState<PacketStatistics>(telemetryStore.getStatistics());
  const [health, setHealth] = useState<SystemHealth>({
    esp32: 'NOMINAL',
    gps: 'NOMINAL',
    bmp280: 'NOMINAL',
    mpu6050: 'NOMINAL',
    lora: 'NOMINAL',
    uart: 'NOMINAL'
  });
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [history, setHistory] = useState<TelemetryFrame[]>(telemetryStore.getHistory());
  const [uartState, setUartState] = useState<ConnectionState>(serialManager.getState());
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Subscribe to services
  useEffect(() => {
    const unsubTelemetry = telemetryStore.subscribe((data) => {
      setTelemetry({ ...data });
      setHistory([...telemetryStore.getHistory()]);
    });

    const unsubStats = telemetryStore.subscribeStats((s) => setStats({ ...s }));
    const unsubHealth = telemetryStore.subscribeHealth((h) => setHealth({ ...h }));
    const unsubAlerts = telemetryStore.subscribeAlerts((a) => setAlerts([...a]));
    const unsubSerialState = serialManager.onStateChange((state) => setUartState(state));

    return () => {
      unsubTelemetry();
      unsubStats();
      unsubHealth();
      unsubAlerts();
      unsubSerialState();
    };
  }, []);

  const handleLoginSuccess = (user: any) => {
    setAuthState({ isAuthenticated: true, user });
  };

  const handleConnectSerial = async () => {
    try {
      if (uartState === 'Connected') {
        await serialManager.disconnect();
        setIsDemoMode(true);
        telemetryStore.toggleSimulation(true);
      } else {
        await serialManager.connect(115200);
        setIsDemoMode(false);
        telemetryStore.toggleSimulation(false);
      }
    } catch (err: any) {
      alert(`Serial Port Connection Error: ${err.message}`);
    }
  };

  const handleToggleDemoMode = (enable: boolean) => {
    setIsDemoMode(enable);
    telemetryStore.toggleSimulation(enable);
  };

  const handleStartMission = (setup: MissionSetupData, isDemo: boolean) => {
    setMissionSetup(setup);
    setMissionActive(true);
    setShowPostMission(false);
    if (isDemo) {
      telemetryStore.toggleSimulation(true);
    }
  };

  const handleLogout = () => {
    setAuthState({ isAuthenticated: false, user: null });
    setMissionActive(false);
    setShowPostMission(false);
    telemetryStore.stopSimulation();
  };

  const handleClearLog = () => {
    telemetryStore.resetStore();
  };

  // 1. Show Login Screen if unauthenticated
  if (!authState.isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // 2. Show Mission Setup Screen if mission not started
  if (!missionActive) {
    return (
      <MissionSetup
        onStartMission={handleStartMission}
        onConnectSerial={handleConnectSerial}
        uartState={uartState}
        loraState={uartState === 'Connected' ? 'Connected' : 'Disconnected'}
        telemetryState={uartState === 'Connected' || isDemoMode ? 'Connected' : 'Disconnected'}
        isSimulating={isDemoMode}
        onToggleDemoMode={handleToggleDemoMode}
      />
    );
  }

  // 3. Show Post Mission Analysis Screen if selected
  if (showPostMission) {
    return (
      <PostMissionAnalysis
        history={history}
        stats={telemetryStore.getMissionSummaryStats()}
        missionSetup={missionSetup}
        onBackToDashboard={() => setShowPostMission(false)}
      />
    );
  }

  // Render view based on active tab selection
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'telemetry':
        return <LiveTelemetryView telemetry={telemetry} stats={stats} />;
      case 'adaptive':
        return <AdaptiveTelemetryView telemetry={telemetry} stats={stats} />;
      case 'mrs':
        return <MissionReliabilityView telemetry={telemetry} stats={stats} />;
      case 'twin':
        return <DigitalTwinView telemetry={telemetry} />;
      case 'map':
        return <MapTrackingView telemetry={telemetry} />;
      case 'charts':
        return (
          <RealtimeCharts
            history={history}
            stats={stats}
            onResetPacketStats={() => telemetryStore.resetPacketStats()}
          />
        );
      case 'logs':
        return <TelemetryLog history={history} onClearLog={handleClearLog} />;
      case 'alerts':
        return <AlertsView alerts={alerts} />;
      case 'health':
        return <SystemStatusView health={health} stats={stats} uartState={uartState} />;
      case 'stats':
        return (
          <MissionStatsView
            stats={telemetryStore.getMissionSummaryStats()}
            missionSetup={missionSetup}
          />
        );
      case 'settings':
        return (
          <SettingsView
            uartState={uartState}
            onConnectSerial={handleConnectSerial}
            isSimulating={isDemoMode}
            onToggleDemoMode={handleToggleDemoMode}
            onResetStore={handleClearLog}
          />
        );
      case 'meoe':
        return <MissionEnergyOptimizationView telemetry={telemetry} />;
      case 'dashboard':
      default:
        return (
          <>
            {/* Upper 3-Column Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
              {/* Left Panel: Telemetry Overview Cards (3 cols) */}
              <section className="lg:col-span-3 h-full">
                <TelemetryOverview telemetry={telemetry} />
              </section>

              {/* Center Column: 3D Digital Twin Rocket (6 cols) */}
              <section className="lg:col-span-6 h-full">
                <DigitalTwin3D telemetry={telemetry} />
              </section>

              {/* Right Panel: Orientation & System Health (3 cols) */}
              <section className="lg:col-span-3 h-full">
                <OrientationHealth telemetry={telemetry} health={health} alerts={alerts} />
              </section>
            </div>

            {/* NEW INDEPENDENT FEATURE MODULE 1: ADAPTIVE TELEMETRY MONITORING */}
            <section className="w-full">
              <AdaptiveTelemetryCard telemetry={telemetry} stats={stats} showFullModule={true} />
            </section>

            {/* NEW INDEPENDENT FEATURE MODULE 2: MISSION RELIABILITY SCORE (MRS) */}
            <section className="w-full">
              <MissionReliabilityCard telemetry={telemetry} stats={stats} showFullModule={true} />
            </section>

            {/* Lower Realtime Charts Array Section */}
            <section className="w-full">
              <RealtimeCharts
                history={history}
                stats={stats}
                onResetPacketStats={() => telemetryStore.resetPacketStats()}
              />
            </section>

            {/* Bottom Telemetry Data Log Table */}
            <section className="w-full">
              <TelemetryLog history={history} onClearLog={handleClearLog} />
            </section>
          </>
        );
    }
  };

  // 4. Render Main GCS Workspace with Fixed Aerospace Collapsible Sidebar
  return (
    <div id="dashboard-root" className="min-h-screen bg-[#050814] bg-hud-grid text-[#F8FAFC] flex font-sans select-none overflow-x-hidden">
      {/* Aerospace Collapsible Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        activeAlertCount={alerts.length}
      />

      {/* Main Workspace Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto">
        {/* Top Header Bar */}
        <Header
          telemetry={telemetry}
          stats={stats}
          uartState={uartState}
          loraState={uartState === 'Connected' || isDemoMode ? 'Connected' : 'Disconnected'}
          missionName={missionSetup.missionName}
          onLogout={handleLogout}
          onOpenAnalysis={() => setShowPostMission(true)}
          onConnectSerial={handleConnectSerial}
        />

        {/* Dynamic Tab View Content */}
        <main className="flex-1 p-3.5 flex flex-col gap-3.5">
          {renderActiveTabContent()}
        </main>

        {/* Footer System Status Bar */}
        <footer className="bg-[#080e1f]/90 border-t border-[#1e2d4a] px-4 py-2.5 flex flex-wrap justify-between items-center text-xs md:text-sm font-mono text-slate-300 font-rajdhani font-bold gap-2">
          <div className="flex items-center gap-3">
            <span className="text-[#00F0FF] font-orbitron font-extrabold glow-text-cyan">DIGITAL TWIN ROCKET MISSION CONTROL v2.4.0</span>
            <span>•</span>
            <span className="font-extrabold text-slate-200">FRAMEWORK: REACT + TYPESCRIPT + THREE.JS + WEB SERIAL</span>
          </div>
          <div className="flex items-center gap-4 font-extrabold">
            <span>LATENCY: &lt;10ms</span>
            <span>UPDATE ENGINE: EVENT-DRIVEN PUB/SUB</span>
            <span className="text-[#00E676] font-orbitron font-extrabold flex items-center gap-1.5 glow-text-emerald">
              <span className="h-2 w-2 rounded-full bg-[#00E676] animate-pulse"></span>
              SYSTEM STATUS: OPERATIONAL
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
