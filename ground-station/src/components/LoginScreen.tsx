import React, { useState } from 'react';
import { Rocket, ShieldCheck, Lock, User, Key, Info, HelpCircle } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: { username: string; role: string }) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState('flight_commander');
  const [password, setPassword] = useState('••••••••••••');
  const [rememberMe, setRememberMe] = useState(true);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter valid security credentials');
      return;
    }
    setErrorMsg('');
    onLoginSuccess({
      username: username,
      role: 'Chief Flight Controller'
    });
  };

  return (
    <div className="min-h-screen w-full bg-[#050814] bg-hud-grid flex flex-col justify-between items-center p-4 relative overflow-hidden font-sans select-none">
      {/* Background Radial Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Top Brand Header */}
      <div className="w-full max-w-6xl pt-4 flex justify-between items-center z-10 font-rajdhani">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00F0FF]/20 to-[#2563EB]/10 border border-[#00F0FF]/40 flex items-center justify-center text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.25)] animate-pulse-glow">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xs font-orbitron font-extrabold text-white tracking-widest uppercase glow-text-cyan">
              DEPARTMENT OF AEROSPACE & ELECTRONICS ENGINEERING
            </h1>
            <p className="text-[11px] font-bold text-slate-400 tracking-wider">GROUND CONTROL STATION • MISSION CONTROL</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-[#00E676] bg-[#00E676]/10 border border-[#00E676]/30 px-3.5 py-1.5 rounded-full font-mono shadow-sm glow-text-emerald">
          <ShieldCheck className="w-4 h-4 animate-pulse" />
          <span>SECURITY PROTOCOL: ENCRYPTED AES-256</span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md panel-glass rounded-2xl p-8 border border-[#00F0FF]/30 z-10 shadow-[0_0_40px_rgba(0,240,255,0.15)] relative backdrop-blur-xl">
        <div className="flex flex-col items-center text-center mb-8 font-rajdhani">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00F0FF]/20 via-[#2563EB]/15 to-transparent border border-[#00F0FF]/40 flex items-center justify-center mb-3 text-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.3)] animate-pulse-glow">
            <Rocket className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-orbitron font-extrabold text-white tracking-widest uppercase glow-text-cyan">
            MISSION CONTROL ACCESS
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono tracking-wider">
            DIGITAL TWIN ENABLED ROCKET TELEMETRY SYSTEM
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-[#FF2E93]/15 border border-[#FF2E93]/40 text-[#FF2E93] text-xs font-mono text-center shadow-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 font-rajdhani">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 tracking-wider">
              OPERATOR USERNAME / CALLSIGN
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter callsign..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#050814] border border-[#1e2d4a] text-white text-xs font-mono focus:outline-none focus:border-[#00F0FF] shadow-inner"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 tracking-wider">
              SECURITY ACCESS PASSCODE
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter passcode..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#050814] border border-[#1e2d4a] text-white text-xs font-mono focus:outline-none focus:border-[#00F0FF] shadow-inner"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-white font-semibold">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-[#1e2d4a] bg-[#050814] text-[#00F0FF] focus:ring-[#00F0FF]"
              />
              Remember Session
            </label>
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="text-[#00F0FF] hover:underline flex items-center gap-1 font-bold"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00F0FF] via-[#00C2FF] to-[#2563EB] text-black font-orbitron font-extrabold text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Key className="w-4 h-4" />
            AUTHENTICATE & LAUNCH DASHBOARD
          </button>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm panel-glass rounded-2xl p-6 border border-[#00F0FF]/30 text-center font-sans shadow-2xl">
            <Info className="w-10 h-10 text-[#00F0FF] mx-auto mb-3 animate-bounce" />
            <h3 className="text-sm font-orbitron font-bold text-white uppercase tracking-widest mb-2 glow-text-cyan">
              RECOVER OPERATOR ACCESS
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed font-mono">
              Default engineering demonstration login:<br />
              <strong className="text-[#00F0FF]">Username: flight_commander</strong><br />
              <strong className="text-[#00F0FF]">Passcode: (any key)</strong>
            </p>
            <button
              onClick={() => setShowForgotModal(false)}
              className="px-6 py-2 rounded-xl bg-[#00F0FF] text-black font-orbitron font-bold text-xs uppercase shadow-[0_0_12px_rgba(0,240,255,0.5)] cursor-pointer"
            >
              CLOSE WINDOW
            </button>
          </div>
        </div>
      )}

      {/* Footer System Specs */}
      <footer className="w-full max-w-6xl py-4 border-t border-[#1e2d4a] flex flex-col md:flex-row justify-between items-center text-[11px] font-mono text-slate-400 gap-2 z-10 font-rajdhani font-semibold">
        <div>
          <span>DEPARTMENT: <strong className="text-slate-200">AEROSPACE & ELECTRONICS (FINAL YEAR B.E./B.TECH PROJECT)</strong></span>
        </div>
        <div className="flex gap-6">
          <span>PROJECT GUIDE: <strong className="text-slate-200">SENIOR FACULTY ADVISOR</strong></span>
          <span>BUILD: <strong className="text-[#00F0FF]">v2.4.0 (RELEASE)</strong></span>
        </div>
      </footer>
    </div>
  );
}
