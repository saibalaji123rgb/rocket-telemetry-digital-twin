import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Activity,
  Rocket,
  MapPin,
  LineChart,
  Database,
  AlertTriangle,
  ShieldCheck,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Radio,
  Zap
} from 'lucide-react';

export type NavTabId =
  | 'dashboard'
  | 'telemetry'
  | 'adaptive'
  | 'mrs'
  | 'twin'
  | 'map'
  | 'charts'
  | 'logs'
  | 'alerts'
  | 'health'
  | 'stats'
  | 'settings'
  | 'meoe';

interface NavItemDef {
  id: NavTabId;
  label: string;
  subtitle: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

const NAV_ITEMS: NavItemDef[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    subtitle: 'Mission Overview',
    icon: LayoutDashboard
  },
  {
    id: 'telemetry',
    label: 'Live Telemetry',
    subtitle: '13 Stream Parameters',
    icon: Activity,
    badge: 'LIVE',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  },
  {
    id: 'adaptive',
    label: 'Adaptive Telemetry',
    subtitle: 'Rate & Interval Emitter',
    icon: Radio,
    badge: 'ADAPTIVE',
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
  },
  {
    id: 'mrs',
    label: 'Mission Reliability (MRS)',
    subtitle: 'Composite Reliability Metric',
    icon: ShieldCheck,
    badge: 'MRS',
    badgeColor: 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/30'
  },
  {
    id: 'meoe',
    label: 'Mission Energy (MEOE)',
    subtitle: 'Decision-Support & Optimization',
    icon: Zap,
    badge: 'MEOE',
    badgeColor: 'bg-[#00F0FF]/15 text-[#00F0FF] border-[#00F0FF]/30'
  },
  {
    id: 'twin',
    label: 'Digital Twin',
    subtitle: '3D Spatial Rocket View',
    icon: Rocket
  },
  {
    id: 'map',
    label: 'Map & Tracking',
    subtitle: 'GPS Trajectory & Fix',
    icon: MapPin
  },
  {
    id: 'charts',
    label: 'Charts & Analytics',
    subtitle: 'Full Plot Arrays',
    icon: LineChart
  },
  {
    id: 'logs',
    label: 'Data Logs',
    subtitle: 'UART Buffer Records',
    icon: Database
  },
  {
    id: 'alerts',
    label: 'Alerts',
    subtitle: 'Safety & Limit Monitoring',
    icon: AlertTriangle,
    badge: 'SAFE',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  },
  {
    id: 'health',
    label: 'System Status',
    subtitle: 'Subsystem Health Check',
    icon: ShieldCheck
  },
  {
    id: 'stats',
    label: 'Mission Statistics',
    subtitle: 'Performance Analytics',
    icon: BarChart3
  },
  {
    id: 'settings',
    label: 'Settings',
    subtitle: 'App & COM Port Setup',
    icon: Settings
  }
];

interface SidebarProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeAlertCount?: number;
}

export default function Sidebar({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  activeAlertCount = 0
}: SidebarProps) {
  return (
    <motion.aside
      initial={false}
      animate={{
        width: isCollapsed ? 76 : 270
      }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="relative h-screen sticky top-0 z-40 bg-[#080e1f]/95 backdrop-blur-md border-r border-[#1e2d4a] flex flex-col font-sans select-none shadow-xl shadow-cyan-950/20 overflow-hidden shrink-0"
    >
      {/* Header Section */}
      <div className="p-3.5 border-b border-[#1e2d4a] flex items-center justify-between min-h-[68px]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#00F0FF]/20 to-[#2563EB]/10 border border-[#00F0FF]/40 text-[#00F0FF] shrink-0 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.25)]">
            <Rocket className="w-5 h-5 animate-pulse-glow" />
          </div>

          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col whitespace-nowrap overflow-hidden"
              >
                <span className="text-xs font-orbitron font-extrabold text-[#00F0FF] tracking-widest uppercase glow-text-cyan">
                  DIGITAL TWIN ENABLED
                </span>
                <h1 className="text-sm font-orbitron font-extrabold text-white tracking-wider uppercase leading-tight mt-0.5">
                  ROCKET TELEMETRY
                </h1>
                <span className="text-xs font-rajdhani font-bold text-slate-300 tracking-wider uppercase">
                  MISSION CONTROL SYSTEM
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg bg-[#0f1933] border border-[#1e2d4a] text-slate-200 hover:text-[#00F0FF] hover:border-[#00F0FF]/40 transition-colors shrink-0 ml-1 cursor-pointer"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1.5 scrollbar-thin">
        {NAV_ITEMS.map((item) => {
          const IconComp = item.icon;
          const isActive = activeTab === item.id;
          const isAlertTab = item.id === 'alerts' && activeAlertCount > 0;

          return (
            <div key={item.id} className="relative group">
              <button
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left relative cursor-pointer ${isActive
                  ? 'bg-gradient-to-r from-[#00F0FF]/20 via-[#2563EB]/25 to-transparent text-white border-l-4 border-[#00F0FF] shadow-[inset_0_0_15px_rgba(0,240,255,0.15)]'
                  : 'text-slate-300 hover:text-white hover:bg-[#0f1933]/80'
                  }`}
              >
                {/* Icon */}
                <div className={`p-2 rounded-lg shrink-0 transition-all ${isActive
                  ? 'bg-[#00F0FF] text-black shadow-[0_0_12px_rgba(0,240,255,0.6)]'
                  : 'text-slate-400 group-hover:text-[#00F0FF] group-hover:bg-[#111c38]'
                  }`}>
                  <IconComp className="w-5 h-5" />
                </div>

                {/* Expanded Label & Subtitle */}
                <AnimatePresence mode="wait">
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.12 }}
                      className="flex-1 min-w-0 flex items-center justify-between"
                    >
                      <div className="truncate">
                        <span className={`text-sm block font-rajdhani font-bold tracking-wider ${isActive ? 'text-[#00F0FF] glow-text-cyan' : 'text-white'}`}>
                          {item.label}
                        </span>
                        <span className={`text-xs block truncate font-rajdhani font-bold ${isActive ? 'text-slate-200' : 'text-slate-400'}`}>
                          {item.subtitle}
                        </span>
                      </div>

                      {/* Optional Badge */}
                      {isAlertTab ? (
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-orbitron font-bold bg-[#FF2E93]/20 text-[#FF2E93] border border-[#FF2E93]/40 shrink-0 ml-1 animate-pulse">
                          {activeAlertCount}
                        </span>
                      ) : item.badge ? (
                        <span className={`px-2.5 py-0.5 rounded-md text-xs font-orbitron font-bold border shrink-0 ml-1 ${isActive ? 'bg-[#00F0FF]/20 text-[#00F0FF] border-[#00F0FF]/40' : item.badgeColor
                          }`}>
                          {item.badge}
                        </span>
                      ) : null}
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>

              {/* Tooltip on Hover (When Collapsed) */}
              {isCollapsed && (
                <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-3.5 py-2 bg-[#0f1933] text-white text-sm font-rajdhani font-bold rounded-lg border border-[#00F0FF]/30 shadow-[0_0_15px_rgba(0,240,255,0.2)] whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                  <IconComp className="w-4 h-4 text-[#00F0FF]" />
                  <span>{item.label}</span>
                  {isAlertTab && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF2E93] animate-ping" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Status Bar */}
      <div className="p-3 border-t border-[#1e2d4a] bg-[#050814]/90">
        {!isCollapsed ? (
          <div className="flex items-center justify-between text-xs text-slate-300 font-mono font-bold">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#00E676] animate-pulse"></span>
              <span className="text-[#00E676] font-bold tracking-wider font-rajdhani text-xs">GCS LINK ONLINE</span>
            </div>
            <span className="font-orbitron text-xs text-[#00F0FF] font-bold">v2.4.0</span>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="h-3 w-3 rounded-full bg-[#00E676] animate-pulse" title="GCS Link Online"></span>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
