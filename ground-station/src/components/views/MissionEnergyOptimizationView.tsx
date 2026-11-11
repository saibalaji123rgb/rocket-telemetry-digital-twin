import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TelemetryFrame } from '../../types/telemetry';
import {
  Zap,
  Gauge,
  Sliders,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  RefreshCw,
  Info,
  Radio,
  SlidersHorizontal,
  Compass,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  Activity,
  Award,
  Upload,
  Play,
  Pause,
  RotateCcw,
  Square,
  FileText,
  Check,
  AlertCircle
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

export interface TelemetryPacketData {
  packetNo: number;
  altitude: number; // m
  pressure: number; // hPa
  speed: number; // km/h
  rssi: number; // dBm
  snr: number; // dB
}

interface MissionEnergyOptimizationViewProps {
  telemetry: TelemetryFrame;
}

// Sample dataset 1: Nominal Flight Trajectory (150 Packets) - Efficient Cruise
const PRESET_NOMINAL_DATASET = Array.from({ length: 150 }, (_, i) => {
  const pNo = i + 1;
  // Cruise speed 58-68 km/h, altitude 400-600m
  const alt = Math.round(150 + Math.sin(i / 25) * 350 + (i / 150) * 100);
  const press = Math.round(1013 - (alt / 1000) * 110);
  const spd = Math.round(58 + Math.sin(i / 12) * 10);
  const rssi = Math.round(-75 - (i / 150) * 18);
  const snr = Math.max(2, Math.round(12 - (i / 150) * 7));
  return `${pNo},${alt},${press},${spd},${rssi},${snr}`;
}).join('\n');

// Sample dataset 2: High Drag / Energy Deficit Trajectory (200 Packets) - Excessive Drag
const PRESET_DEFICIT_DATASET = Array.from({ length: 200 }, (_, i) => {
  const pNo = i + 1;
  // High speed (88-102 km/h) & high altitude (920m), causing rapid energy exhaustion
  const alt = Math.round(250 + (i / 200) * 700);
  const press = Math.round(1010 - (alt / 1000) * 115);
  const spd = Math.round(86 + Math.sin(i / 15) * 10 + (i / 200) * 10);
  const rssi = Math.round(-78 - (i / 200) * 22);
  const snr = Math.max(1, Math.round(10 - (i / 200) * 7));
  return `${pNo},${alt},${press},${spd},${rssi},${snr}`;
}).join('\n');

export default function MissionEnergyOptimizationView({ telemetry }: MissionEnergyOptimizationViewProps) {
  // Mode Selection: 'live' or 'scenario'
  const [mode, setMode] = useState<'live' | 'scenario'>('scenario');

  // Baseline Scenario Mission Setup Parameters
  const [missionParams, setMissionParams] = useState({
    totalDistance: 60, // km
    initialFuel: 100, // Energy Units
    plannedSpeed: 70, // km/h
    plannedAltitude: 600, // m
    baseConsumption: 1.67, // Units/km (Base rate: 100 Units / 60 km)
    speedFactorCoef: 0.02,
    altitudeFactorCoef: 0.0006,
    safetyMargin: 15 // %
  });

  // Multiline Textarea dataset input
  const [rawTextareaData, setRawTextareaData] = useState<string>(
    `PacketNo,Altitude,Pressure,Speed,RSSI,SNR\n` + PRESET_DEFICIT_DATASET
  );

  // Parsed packets & validation state
  const [parsedPackets, setParsedPackets] = useState<TelemetryPacketData[]>([]);
  const [validationState, setValidationState] = useState<{
    loaded: boolean;
    packetCount: number;
    errors: { line: number; text: string }[];
  }>({
    loaded: false,
    packetCount: 0,
    errors: []
  });

  // Simulation Replay Playback State
  const [simState, setSimState] = useState<'idle' | 'running' | 'paused' | 'completed'>('idle');
  const [currentPacketIdx, setCurrentPacketIdx] = useState<number>(0);
  const [simSpeed, setSimSpeed] = useState<number>(2); // 1x, 2x, 5x, 10x

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Automatically load default dataset on mount
  useEffect(() => {
    handleLoadDataset(rawTextareaData);
  }, []);

  // Parse CSV dataset string into TelemetryPacketData[]
  const handleLoadDataset = (csvText: string) => {
    const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    const validPackets: TelemetryPacketData[] = [];
    const errors: { line: number; text: string }[] = [];

    lines.forEach((line, idx) => {
      if (idx === 0 && line.toLowerCase().includes('packet')) {
        return;
      }

      const parts = line.split(/[,;\t]+/);
      if (parts.length >= 4) {
        const pNo = parseInt(parts[0], 10) || idx;
        const alt = parseFloat(parts[1]);
        const press = parseFloat(parts[2]);
        const spd = parseFloat(parts[3]);
        const rssi = parts[4] !== undefined ? parseFloat(parts[4]) : -80;
        const snr = parts[5] !== undefined ? parseFloat(parts[5]) : 8;

        if (!isNaN(alt) && !isNaN(press) && !isNaN(spd)) {
          validPackets.push({
            packetNo: pNo,
            altitude: alt,
            pressure: press,
            speed: spd,
            rssi,
            snr
          });
        } else {
          errors.push({ line: idx + 1, text: `Invalid numeric format in line ${idx + 1}: "${line}"` });
        }
      } else {
        errors.push({ line: idx + 1, text: `Insufficient columns in line ${idx + 1}: expected at least 4 fields (PacketNo, Altitude, Pressure, Speed)` });
      }
    });

    setParsedPackets(validPackets);
    setValidationState({
      loaded: validPackets.length > 0,
      packetCount: validPackets.length,
      errors
    });

    setSimState('idle');
    setCurrentPacketIdx(0);
  };

  // CSV File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setRawTextareaData(text);
        handleLoadDataset(text);
      }
    };
    reader.readAsText(file);
  };

  // Simulation Replay Timer Control
  useEffect(() => {
    if (simState === 'running') {
      const intervalMs = Math.max(50, Math.round(500 / simSpeed));
      timerRef.current = setInterval(() => {
        setCurrentPacketIdx((prev) => {
          if (prev >= parsedPackets.length - 1) {
            setSimState('completed');
            if (timerRef.current) clearInterval(timerRef.current);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [simState, simSpeed, parsedPackets.length]);

  const handleStartSim = () => {
    if (parsedPackets.length === 0) return;
    if (simState === 'completed') {
      setCurrentPacketIdx(0);
    }
    setSimState('running');
  };

  const handlePauseSim = () => setSimState('paused');
  const handleResumeSim = () => setSimState('running');
  const handleResetSim = () => {
    setSimState('idle');
    setCurrentPacketIdx(0);
  };
  const handleStopSim = () => setSimState('completed');

  // --------------------------------------------------------------------------
  // EXACT PHYSICS ENERGY INTEGRATION (Accumulates fuel step-by-step per packet)
  // --------------------------------------------------------------------------
  const cumulativeSimulationData = useMemo(() => {
    if (mode === 'live' || parsedPackets.length === 0) {
      return null;
    }

    const totalP = parsedPackets.length;
    const totalD = missionParams.totalDistance;
    const initialF = missionParams.initialFuel;
    const plannedS = missionParams.plannedSpeed;
    const plannedA = missionParams.plannedAltitude;
    const baseC = missionParams.baseConsumption > 0 ? missionParams.baseConsumption : initialF / Math.max(1, totalD);
    const sCoef = missionParams.speedFactorCoef;
    const aCoef = missionParams.altitudeFactorCoef;

    const stepDist = totalD / totalP; // km per packet

    let accumulatedDistance = 0;
    let accumulatedFuelConsumed = 0;
    let fuelExhaustedAtDist: number | null = null;
    let fuelExhaustedAtPacket: number | null = null;

    const packetHistory: {
      packetNo: number;
      distanceCovered: number;
      remainingDistance: number;
      speed: number;
      altitude: number;
      pressure: number;
      effectiveConsumption: number;
      fuelConsumedStep: number;
      cumulativeFuelConsumed: number;
      remainingFuel: number;
      estimatedReachableDistance: number;
      isExhausted: boolean;
    }[] = [];

    for (let i = 0; i < totalP; i++) {
      const p = parsedPackets[i];
      const dist = Math.min(totalD, Math.round((i + 1) * stepDist * 10) / 10);
      const remDist = Math.max(0, Math.round((totalD - dist) * 10) / 10);

      // Speed Factor
      const sRatio = (p.speed - plannedS) / Math.max(10, plannedS);
      const sFactor = Math.max(0.6, 1 + sCoef * 10 * sRatio + Math.pow(Math.max(0, sRatio), 1.8));

      // Altitude Factor
      const aRatio = (p.altitude - plannedA) / Math.max(100, plannedA);
      const aFactor = Math.max(0.7, 1 + aCoef * 500 * aRatio);

      // Atmospheric Pressure Factor
      const pDelta = (1013.25 - p.pressure) / 1013.25;
      const pFactor = Math.max(0.8, 1 + pDelta * 0.4);

      // Effective consumption for this specific packet (Units/km)
      const effCons = Math.max(0.3, baseC * sFactor * aFactor * pFactor);

      // Fuel consumed during this step
      const stepFuel = effCons * stepDist;
      accumulatedFuelConsumed += stepFuel;
      accumulatedDistance = dist;

      const remFuel = Math.max(0, Math.round((initialF - accumulatedFuelConsumed) * 10) / 10);
      const isExhausted = remFuel <= 0;

      if (isExhausted && fuelExhaustedAtDist === null) {
        fuelExhaustedAtDist = dist;
        fuelExhaustedAtPacket = p.packetNo;
      }

      // Reachable distance from start
      let estReachable = 0;
      if (isExhausted) {
        estReachable = fuelExhaustedAtDist !== null ? fuelExhaustedAtDist : dist;
      } else {
        const remainingRangeFromNow = remFuel / effCons;
        estReachable = Math.round((dist + remainingRangeFromNow) * 10) / 10;
      }

      packetHistory.push({
        packetNo: p.packetNo,
        distanceCovered: dist,
        remainingDistance: remDist,
        speed: p.speed,
        altitude: p.altitude,
        pressure: p.pressure,
        effectiveConsumption: Math.round(effCons * 100) / 100,
        fuelConsumedStep: stepFuel,
        cumulativeFuelConsumed: Math.round(accumulatedFuelConsumed * 10) / 10,
        remainingFuel: remFuel,
        estimatedReachableDistance: estReachable,
        isExhausted
      });
    }

    return {
      totalDistance: totalD,
      initialFuel: initialF,
      packetHistory,
      fuelExhaustedAtDist,
      fuelExhaustedAtPacket,
      totalFuelConsumed: Math.round(accumulatedFuelConsumed * 10) / 10,
      totalDistanceCovered: accumulatedDistance
    };
  }, [mode, parsedPackets, missionParams]);

  // Compute Active Packet Stream data depending on Live vs Scenario Mode
  const activeStream = useMemo(() => {
    if (mode === 'live') {
      const currentSpeed = Math.max(10, Math.round((telemetry.speed || 15) * 3.6));
      const currentAltitude = Math.max(0, Math.round(telemetry.altitude || 450));
      const currentPressure = Math.max(300, Math.round(telemetry.pressure || 950));
      const distanceCovered = Math.min(
        missionParams.totalDistance,
        Math.round(((telemetry.packetId || 100) * 0.15 + currentSpeed * 0.2) * 10) / 10
      );
      const remainingDistance = Math.max(0, Math.round((missionParams.totalDistance - distanceCovered) * 10) / 10);
      const remainingFuel = Math.max(
        5,
        Math.round((missionParams.initialFuel * (1 - distanceCovered / missionParams.totalDistance)) * 10) / 10
      );

      return {
        packetNo: telemetry.packetId || 1,
        totalPackets: 999,
        progressPct: 50,
        currentSpeed,
        currentAltitude,
        currentPressure,
        distanceCovered,
        remainingDistance,
        remainingFuel,
        rssi: telemetry.rssi || -75,
        isExhausted: false,
        estimatedReachableDistance: Math.round((remainingFuel / 1.67) * 10) / 10
      };
    } else {
      // Scenario Analysis Mode
      const totalP = parsedPackets.length;
      if (totalP === 0 || !cumulativeSimulationData) {
        return {
          packetNo: 0,
          totalPackets: 0,
          progressPct: 0,
          currentSpeed: missionParams.plannedSpeed,
          currentAltitude: missionParams.plannedAltitude,
          currentPressure: 1013,
          distanceCovered: 0,
          remainingDistance: missionParams.totalDistance,
          remainingFuel: missionParams.initialFuel,
          rssi: -80,
          isExhausted: false,
          estimatedReachableDistance: missionParams.totalDistance
        };
      }

      const safeIdx = Math.min(currentPacketIdx, totalP - 1);
      const activeHist = cumulativeSimulationData.packetHistory[safeIdx];
      const progressRatio = (safeIdx + 1) / totalP;
      const progressPct = Math.round(progressRatio * 100);

      return {
        packetNo: activeHist.packetNo,
        totalPackets: totalP,
        progressPct,
        currentSpeed: activeHist.speed,
        currentAltitude: activeHist.altitude,
        currentPressure: activeHist.pressure,
        distanceCovered: activeHist.distanceCovered,
        remainingDistance: activeHist.remainingDistance,
        remainingFuel: activeHist.remainingFuel,
        rssi: parsedPackets[safeIdx].rssi,
        isExhausted: activeHist.isExhausted,
        estimatedReachableDistance: activeHist.estimatedReachableDistance,
        effectiveConsumption: activeHist.effectiveConsumption
      };
    }
  }, [mode, telemetry, parsedPackets, currentPacketIdx, missionParams, cumulativeSimulationData]);

  // Core Mission Energy Model Calculations (Evaluates feasibility accurately!)
  const modelResults = useMemo(() => {
    const { totalDistance, safetyMargin } = missionParams;

    const {
      remainingDistance,
      remainingFuel,
      estimatedReachableDistance,
      distanceCovered,
      isExhausted
    } = activeStream;

    const effCons = activeStream.effectiveConsumption || 1.67;
    const currentEfficiency = Math.round((1 / Math.max(0.1, effCons)) * 100) / 100;

    // FEASIBILITY LOGIC:
    // Mission is ONLY feasible if estimatedReachableDistance >= Total Distance AND not exhausted prematurely!
    const requiredWithSafety = totalDistance * (1 + safetyMargin / 100);
    const isFeasible = !isExhausted && estimatedReachableDistance >= totalDistance;

    // Feasibility % ratio
    const rawFeasibility = totalDistance > 0 ? (estimatedReachableDistance / totalDistance) * 100 : 100;
    const missionFeasibilityPct = Math.min(100, Math.max(0, Math.round(rawFeasibility)));

    // Success Probability
    let successProbability = Math.round(Math.min(99, Math.max(5, (estimatedReachableDistance / requiredWithSafety) * 95)));
    if (!isFeasible) {
      successProbability = Math.min(60, Math.max(5, Math.round((estimatedReachableDistance / totalDistance) * 50)));
    }

    return {
      effectiveConsumption: effCons,
      estimatedReachableDistance,
      currentEfficiency,
      missionFeasibilityPct,
      successProbability,
      isFeasible
    };
  }, [missionParams, activeStream]);

  // Optimization Solver (Finds optimal speed & altitude to solve deficit)
  const optimizationResults = useMemo(() => {
    const { remainingDistance, remainingFuel, distanceCovered } = activeStream;
    const {
      baseConsumption,
      initialFuel,
      totalDistance,
      plannedSpeed,
      plannedAltitude,
      speedFactorCoef,
      altitudeFactorCoef,
      safetyMargin
    } = missionParams;

    const baseRate = baseConsumption > 0 ? baseConsumption : initialFuel / Math.max(1, totalDistance);

    let bestReachable = 0;
    let bestSpeed = 60;
    let bestAltitude = 550;
    let bestConsumption = 999;

    for (let s = 45; s <= 90; s += 5) {
      for (let a = 300; a <= 750; a += 50) {
        const sRatio = (s - plannedSpeed) / Math.max(10, plannedSpeed);
        const sFactor = Math.max(0.6, 1 + speedFactorCoef * 10 * sRatio + Math.pow(Math.max(0, sRatio), 1.8));

        const aRatio = (a - plannedAltitude) / Math.max(100, plannedAltitude);
        const aFactor = Math.max(0.7, 1 + altitudeFactorCoef * 500 * aRatio);

        const effCons = baseRate * sFactor * aFactor * 0.95; // Optimal flight path drag reduction
        const totalOptimizedRange = initialFuel / effCons;

        if (totalOptimizedRange > bestReachable) {
          bestReachable = totalOptimizedRange;
          bestSpeed = s;
          bestAltitude = a;
          bestConsumption = effCons;
        }
      }
    }

    const roundedReachable = Math.round(bestReachable * 10) / 10;
    const roundedConsumption = Math.round(bestConsumption * 100) / 100;
    const optimizedEfficiency = Math.round((1 / bestConsumption) * 100) / 100;
    const optimizationGain = Math.round((roundedReachable - modelResults.estimatedReachableDistance) * 10) / 10;

    const reqWithSafety = totalDistance * (1 + safetyMargin / 100);
    const optProbRatio = roundedReachable / Math.max(1, reqWithSafety);
    let optSuccessProb = Math.round(Math.min(98, Math.max(10, optProbRatio * 95)));
    if (roundedReachable < totalDistance) {
      optSuccessProb = Math.min(75, Math.max(10, Math.round((roundedReachable / totalDistance) * 65)));
    }

    return {
      optimalSpeed: bestSpeed,
      optimalAltitude: bestAltitude,
      expectedConsumption: roundedConsumption,
      expectedReachableDistance: roundedReachable,
      optimizedEfficiency,
      optimizationGain,
      optSuccessProb
    };
  }, [activeStream, missionParams, modelResults.estimatedReachableDistance]);

  // Dynamic Graph 1 Data: Planned vs Actual Cumulative Fuel Curve
  const graph1Data = useMemo(() => {
    const totalD = missionParams.totalDistance;
    const initialF = missionParams.initialFuel;

    if (mode === 'scenario' && cumulativeSimulationData) {
      const steps = 10;
      const stepSize = totalD / steps;

      return Array.from({ length: steps + 1 }, (_, i) => {
        const dist = Math.round(i * stepSize);
        const plannedFuel = Math.max(0, Math.round((initialF - (dist / totalD) * initialF) * 10) / 10);

        // Find packet at distance <= dist
        const hist = cumulativeSimulationData.packetHistory.find((h) => h.distanceCovered >= dist) ||
          cumulativeSimulationData.packetHistory[cumulativeSimulationData.packetHistory.length - 1];

        let currentFuel: number | null = null;
        if (dist <= activeStream.distanceCovered && hist) {
          currentFuel = hist.remainingFuel;
        }

        return {
          distance: dist,
          plannedFuel,
          currentFuel
        };
      });
    } else {
      const steps = 10;
      const stepSize = totalD / steps;
      return Array.from({ length: steps + 1 }, (_, i) => {
        const dist = Math.round(i * stepSize);
        return {
          distance: dist,
          plannedFuel: Math.max(0, Math.round((initialF - (dist / totalD) * initialF) * 10) / 10),
          currentFuel: dist <= activeStream.distanceCovered ? activeStream.remainingFuel : null
        };
      });
    }
  }, [missionParams, activeStream, cumulativeSimulationData, mode]);

  // Dynamic Graph 3 Data: Efficiency Comparison
  const graph3Data = useMemo(() => {
    return [
      {
        metric: 'Efficiency (km/U)',
        Current: modelResults.currentEfficiency,
        Optimized: optimizationResults.optimizedEfficiency
      },
      {
        metric: 'Reachable Dist (km)',
        Current: modelResults.estimatedReachableDistance,
        Optimized: optimizationResults.expectedReachableDistance
      }
    ];
  }, [modelResults, optimizationResults]);

  // Final Summary Stats generated when all packets complete
  const finalSummaryStats = useMemo(() => {
    if (parsedPackets.length === 0 || !cumulativeSimulationData) return null;

    let maxAlt = 0;
    let sumSpeed = 0;
    parsedPackets.forEach((p) => {
      if (p.altitude > maxAlt) maxAlt = p.altitude;
      sumSpeed += p.speed;
    });

    const avgSpeed = Math.round((sumSpeed / parsedPackets.length) * 10) / 10;
    const energyConsumed = cumulativeSimulationData.totalFuelConsumed;

    const overallStatus = modelResults.isFeasible
      ? 'MISSION SUCCESSFUL'
      : cumulativeSimulationData.fuelExhaustedAtDist !== null
        ? `MISSION TERMINATED - FUEL EXHAUSTED AT ${cumulativeSimulationData.fuelExhaustedAtDist} km`
        : 'MISSION COMPLETION AT RISK - ENERGY DEFICIT';

    return {
      totalPackets: parsedPackets.length,
      distanceCovered: activeStream.distanceCovered,
      maxAltitude: maxAlt,
      avgSpeed,
      energyConsumed,
      remainingEnergy: activeStream.remainingFuel,
      isFeasible: modelResults.isFeasible,
      successProb: modelResults.successProbability,
      optimalSpeed: optimizationResults.optimalSpeed,
      optimalAltitude: optimizationResults.optimalAltitude,
      optimizationGain: optimizationResults.optimizationGain,
      overallStatus,
      exhaustedDist: cumulativeSimulationData.fuelExhaustedAtDist
    };
  }, [parsedPackets, activeStream, cumulativeSimulationData, modelResults, optimizationResults]);

  return (
    <div className="space-y-4 font-sans text-slate-100">
      {/* Top Header & Mode Switch */}
      <div className="panel-glass p-5 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shadow-xl border border-[#1e2d4a]">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#00F0FF]/25 to-[#2563EB]/15 text-[#00F0FF] border border-[#00F0FF]/40 shadow-[0_0_20px_rgba(0,240,255,0.3)]">
            <Zap className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-orbitron font-extrabold uppercase bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 tracking-wider">
                DECISION-SUPPORT SUBSYSTEM
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-orbitron font-extrabold uppercase bg-[#00E676]/15 text-[#00E676] border border-[#00E676]/30 tracking-wider">
                PHYSICS ENERGY MODEL
              </span>
            </div>
            <h1 className="text-lg md:text-xl font-orbitron font-extrabold text-white tracking-wider uppercase leading-tight mt-1">
              Mission Energy & Optimization Engine (MEOE)
            </h1>
            <p className="text-xs md:text-sm font-rajdhani font-bold text-slate-300 tracking-wider mt-0.5">
              Dataset Scenario Analysis & Predictive Replay Engine
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center bg-[#070d1e] p-1.5 rounded-xl border border-[#1e2d4a] shadow-inner self-stretch lg:self-auto">
          <button
            onClick={() => setMode('live')}
            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-orbitron text-xs font-extrabold tracking-wider transition-all duration-200 cursor-pointer ${mode === 'live'
                ? 'bg-gradient-to-r from-[#00F0FF] to-[#00A3FF] text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-[#0e172e]'
              }`}
          >
            <Radio className={`w-4 h-4 ${mode === 'live' ? 'animate-pulse' : ''}`} />
            LIVE MODE
          </button>
          <button
            onClick={() => setMode('scenario')}
            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-orbitron text-xs font-extrabold tracking-wider transition-all duration-200 cursor-pointer ${mode === 'scenario'
                ? 'bg-gradient-to-r from-[#A855F7] to-[#7C3AED] text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-[#0e172e]'
              }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            MISSION SCENARIO ANALYSIS MODE
          </button>
        </div>
      </div>

      {/* Mode Status Banner */}
      <div
        className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 font-sans text-xs md:text-sm ${mode === 'live'
            ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-200'
            : 'bg-purple-950/30 border-purple-500/30 text-purple-200'
          }`}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={`w-2.5 h-2.5 rounded-full ${mode === 'live' ? 'bg-[#00F0FF] animate-ping' : 'bg-purple-400 animate-pulse'
              }`}
          />
          <span className="font-orbitron font-bold tracking-wider uppercase">
            {mode === 'live' ? 'LIVE TELEMETRY MODE:' : 'DATASET SCENARIO REPLAY MODE:'}
          </span>
          <span className="font-rajdhani font-semibold">
            {mode === 'live'
              ? 'Reading real-time telemetry over serial port. Inputs locked.'
              : 'Disconnected from live COM/Serial link. Evaluates complete telemetry datasets sequentially.'}
          </span>
        </div>
      </div>

      {/* MISSION SCENARIO ANALYSIS MODE DATASET INPUT & CONTROLS */}
      {mode === 'scenario' && (
        <div className="space-y-4">
          {/* Dataset Input Box & Controls */}
          <div className="panel-glass p-5 rounded-2xl border border-[#1e2d4a]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-[#1e2d4a] pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-[#00F0FF]" />
                <h2 className="text-sm font-orbitron font-bold text-white uppercase tracking-wider">
                  TELEMETRY DATASET INPUT (100–500 PACKETS)
                </h2>
              </div>

              {/* CSV Import & Presets Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00F0FF]/15 text-[#00F0FF] hover:bg-[#00F0FF]/25 border border-[#00F0FF]/30 text-xs font-orbitron font-bold transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" /> IMPORT CSV FILE
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  onClick={() => {
                    const sample = `PacketNo,Altitude,Pressure,Speed,RSSI,SNR\n` + PRESET_NOMINAL_DATASET;
                    setRawTextareaData(sample);
                    handleLoadDataset(sample);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#111c38] text-emerald-300 hover:text-white border border-[#1e2d4a] text-xs font-rajdhani font-bold cursor-pointer"
                >
                  PRESET 1: NOMINAL (EFFICIENT 150 PKTS)
                </button>

                <button
                  onClick={() => {
                    const sample = `PacketNo,Altitude,Pressure,Speed,RSSI,SNR\n` + PRESET_DEFICIT_DATASET;
                    setRawTextareaData(sample);
                    handleLoadDataset(sample);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#111c38] text-rose-300 hover:text-white border border-[#1e2d4a] text-xs font-rajdhani font-bold cursor-pointer"
                >
                  PRESET 2: HIGH DRAG (DEFICIT 200 PKTS)
                </button>
              </div>
            </div>

            {/* Multiline Textarea */}
            <div className="space-y-3">
              <textarea
                rows={7}
                value={rawTextareaData}
                onChange={(e) => setRawTextareaData(e.target.value)}
                placeholder="Paste telemetry dataset CSV format: PacketNo,Altitude,Pressure,Speed,RSSI,SNR..."
                className="w-full bg-[#030611] border border-[#1e2d4a] rounded-xl p-3.5 text-xs font-mono text-cyan-200 outline-none focus:border-[#00F0FF] scrollbar-thin resize-y"
              />

              <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                <button
                  onClick={() => handleLoadDataset(rawTextareaData)}
                  className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#2563EB] text-black font-orbitron font-extrabold text-xs uppercase hover:brightness-110 transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] cursor-pointer tracking-wider"
                >
                  <Check className="w-4 h-4" /> LOAD DATASET
                </button>

                {validationState.loaded && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-xs font-rajdhani font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Dataset Loaded Successfully | Packets Loaded: {validationState.packetCount}</span>
                  </div>
                )}

                {validationState.errors.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-400 text-xs font-rajdhani font-bold">
                    <AlertCircle className="w-4 h-4" />
                    <span>Formatting Errors Found in {validationState.errors.length} rows</span>
                  </div>
                )}
              </div>

              {validationState.errors.length > 0 && (
                <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-lg text-xs font-mono text-rose-300 space-y-1 max-h-24 overflow-y-auto">
                  {validationState.errors.map((err, i) => (
                    <div key={i}>• {err.text}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Baseline Scenario Parameters Config */}
            <div className="mt-4 pt-4 border-t border-[#1e2d4a]/80 grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 font-rajdhani font-bold mb-1">Total Distance (km):</label>
                <input
                  type="number"
                  value={missionParams.totalDistance}
                  onChange={(e) => setMissionParams({ ...missionParams, totalDistance: parseFloat(e.target.value) || 1 })}
                  className="w-full bg-[#030611] border border-[#1e2d4a] rounded-lg px-2.5 py-1.5 text-white font-mono-num"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-rajdhani font-bold mb-1">Initial Fuel (Units):</label>
                <input
                  type="number"
                  value={missionParams.initialFuel}
                  onChange={(e) => setMissionParams({ ...missionParams, initialFuel: parseFloat(e.target.value) || 1 })}
                  className="w-full bg-[#030611] border border-[#1e2d4a] rounded-lg px-2.5 py-1.5 text-white font-mono-num"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-rajdhani font-bold mb-1">Planned Speed (km/h):</label>
                <input
                  type="number"
                  value={missionParams.plannedSpeed}
                  onChange={(e) => setMissionParams({ ...missionParams, plannedSpeed: parseFloat(e.target.value) || 1 })}
                  className="w-full bg-[#030611] border border-[#1e2d4a] rounded-lg px-2.5 py-1.5 text-white font-mono-num"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-rajdhani font-bold mb-1">Planned Altitude (m):</label>
                <input
                  type="number"
                  value={missionParams.plannedAltitude}
                  onChange={(e) => setMissionParams({ ...missionParams, plannedAltitude: parseFloat(e.target.value) || 1 })}
                  className="w-full bg-[#030611] border border-[#1e2d4a] rounded-lg px-2.5 py-1.5 text-white font-mono-num"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-rajdhani font-bold mb-1">Safety Margin (%):</label>
                <input
                  type="number"
                  value={missionParams.safetyMargin}
                  onChange={(e) => setMissionParams({ ...missionParams, safetyMargin: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#030611] border border-[#1e2d4a] rounded-lg px-2.5 py-1.5 text-amber-400 font-mono-num font-bold"
                />
              </div>
            </div>
          </div>

          {/* SIMULATION REPLAY CONTROLS & PROGRESS */}
          <div className="panel-glass p-5 rounded-2xl border border-[#1e2d4a] flex flex-col lg:flex-row justify-between items-center gap-4 shadow-xl">
            <div className="flex flex-wrap items-center gap-2.5">
              {simState === 'idle' || simState === 'completed' ? (
                <button
                  onClick={handleStartSim}
                  disabled={parsedPackets.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00E676] to-[#059669] text-black font-orbitron font-extrabold text-xs uppercase hover:brightness-110 transition-all shadow-[0_0_15px_rgba(0,230,118,0.4)] cursor-pointer disabled:opacity-50 tracking-wider"
                >
                  <Play className="w-4 h-4 fill-current" /> START SIMULATION
                </button>
              ) : simState === 'running' ? (
                <button
                  onClick={handlePauseSim}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FFB703] to-[#D97706] text-black font-orbitron font-extrabold text-xs uppercase hover:brightness-110 transition-all shadow-[0_0_15px_rgba(255,183,3,0.4)] cursor-pointer tracking-wider"
                >
                  <Pause className="w-4 h-4 fill-current" /> PAUSE
                </button>
              ) : (
                <button
                  onClick={handleResumeSim}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00E676] to-[#059669] text-black font-orbitron font-extrabold text-xs uppercase hover:brightness-110 transition-all shadow-[0_0_15px_rgba(0,230,118,0.4)] cursor-pointer tracking-wider"
                >
                  <Play className="w-4 h-4 fill-current" /> RESUME
                </button>
              )}

              <button
                onClick={handleResetSim}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#111c38] text-slate-300 hover:text-white border border-[#1e2d4a] text-xs font-orbitron font-bold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> RESET
              </button>

              <button
                onClick={handleStopSim}
                disabled={simState === 'idle'}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-950/60 text-rose-400 hover:bg-rose-900/60 border border-rose-800/40 text-xs font-orbitron font-bold transition-colors cursor-pointer disabled:opacity-40"
              >
                <Square className="w-4 h-4 fill-current" /> STOP
              </button>
            </div>

            <div className="flex items-center gap-2 bg-[#070c1c] p-1.5 rounded-xl border border-[#1e2d4a]">
              <span className="text-[11px] font-orbitron font-bold text-slate-400 px-2 uppercase">SPEED:</span>
              {[1, 2, 5, 10].map((s) => (
                <button
                  key={s}
                  onClick={() => setSimSpeed(s)}
                  className={`px-2.5 py-1 rounded text-xs font-orbitron font-extrabold transition-all cursor-pointer ${simSpeed === s ? 'bg-[#00F0FF] text-black shadow-[0_0_10px_rgba(0,240,255,0.5)]' : 'text-slate-400 hover:text-white'
                    }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            <div className="flex-1 w-full lg:max-w-xs space-y-1">
              <div className="flex justify-between text-xs font-orbitron font-bold">
                <span className="text-slate-300">
                  CURRENT PACKET: <span className="text-[#00F0FF] font-mono">{activeStream.packetNo} / {activeStream.totalPackets}</span>
                </span>
                <span className="text-[#00E676] font-mono">{activeStream.progressPct}%</span>
              </div>
              <div className="w-full h-3 bg-[#030611] rounded-full overflow-hidden border border-[#1e2d4a]">
                <div
                  className="h-full bg-gradient-to-r from-[#00F0FF] via-[#2563EB] to-[#00E676] rounded-full transition-all duration-200"
                  style={{ width: `${activeStream.progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MISSION FEASIBILITY DECISION BANNER (UPDATED REAL-TIME INTEGRATION) */}
      <div
        className={`p-5 rounded-2xl border-2 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 transition-all duration-300 ${modelResults.isFeasible
            ? 'bg-gradient-to-r from-emerald-950/60 via-[#081f14] to-emerald-950/40 border-[#00E676] shadow-[0_0_30px_rgba(0,230,118,0.25)] text-[#00E676]'
            : 'bg-gradient-to-r from-rose-950/70 via-[#260812] to-rose-950/50 border-[#FF2E93] shadow-[0_0_30px_rgba(255,46,147,0.3)] text-[#FF2E93]'
          }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`p-3.5 rounded-xl border ${modelResults.isFeasible
                ? 'bg-[#00E676]/20 border-[#00E676]/40 text-[#00E676]'
                : 'bg-[#FF2E93]/20 border-[#FF2E93]/40 text-[#FF2E93] animate-bounce'
              }`}
          >
            {modelResults.isFeasible ? <CheckCircle2 className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
          </div>
          <div>
            <div className="text-xs font-orbitron font-extrabold uppercase tracking-widest opacity-80">
              REAL-TIME MISSION DECISION
            </div>
            <div className="text-xl md:text-2xl font-orbitron font-black tracking-wider uppercase glow-text">
              {modelResults.isFeasible ? 'MISSION CAN BE COMPLETED' : 'MISSION COMPLETION AT RISK'}
            </div>
            <p className="text-xs md:text-sm font-rajdhani font-bold text-slate-200 mt-0.5">
              {modelResults.isFeasible
                ? `Reachable distance (${modelResults.estimatedReachableDistance} km) covers total required distance (${missionParams.totalDistance} km).`
                : activeStream.isExhausted
                  ? `ENERGY EXHAUSTED! Fuel depleted to 0 Units before reaching goal. Max Reachable: ${modelResults.estimatedReachableDistance} km.`
                  : `Reachable distance (${modelResults.estimatedReachableDistance} km) is LESS than total required distance (${missionParams.totalDistance} km).`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-[#050914]/80 px-5 py-3 rounded-xl border border-current shrink-0">
          <div className="text-center">
            <span className="text-[10px] font-orbitron font-bold uppercase text-slate-400 block">REACHABLE DISTANCE</span>
            <span className="text-xl md:text-2xl font-orbitron font-black text-white font-mono-num">
              {modelResults.estimatedReachableDistance} <span className="text-xs font-rajdhani font-bold text-slate-400">km</span>
            </span>
          </div>
          <div className="h-8 w-px bg-slate-700" />
          <div className="text-center">
            <span className="text-[10px] font-orbitron font-bold uppercase text-slate-400 block">TOTAL MISSION GOAL</span>
            <span className="text-xl md:text-2xl font-orbitron font-black text-[#38BDF8] font-mono-num">
              {missionParams.totalDistance} <span className="text-xs font-rajdhani font-bold text-slate-400">km</span>
            </span>
          </div>
        </div>
      </div>

      {/* REAL-TIME METRIC CARDS (9 CARDS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-9 gap-3">
        {/* Card 1: Status */}
        <div className="bg-[#0b1429]/90 backdrop-blur-md p-4 rounded-xl border border-[#1e2d4a] shadow-lg flex flex-col justify-between">
          <span className="text-[10px] font-orbitron font-extrabold text-slate-400 uppercase tracking-wider block">MISSION STATUS</span>
          <div className="my-2">
            <span
              className={`text-xs font-orbitron font-extrabold px-2.5 py-1 rounded-md block text-center uppercase tracking-wider border ${modelResults.isFeasible
                  ? 'bg-emerald-950/80 text-[#00E676] border-[#00E676]/40 glow-text-emerald'
                  : 'bg-rose-950/80 text-[#FF2E93] border-[#FF2E93]/40 glow-text-red'
                }`}
            >
              {modelResults.isFeasible ? 'COMPLETABLE' : 'AT RISK'}
            </span>
          </div>
          <span className="text-[10px] font-rajdhani font-bold text-slate-400 block">Replay frame evaluation</span>
        </div>

        {/* Card 2: Mission Feasibility */}
        <div className="bg-[#0b1429]/90 backdrop-blur-md p-4 rounded-xl border border-[#1e2d4a] shadow-lg flex flex-col justify-between">
          <span className="text-[10px] font-orbitron font-extrabold text-slate-400 uppercase tracking-wider block">FEASIBILITY</span>
          <div className="flex items-baseline gap-1 my-1">
            <span
              className={`text-2xl font-orbitron font-black font-mono-num ${modelResults.missionFeasibilityPct >= 100
                  ? 'text-[#00E676] glow-text-emerald'
                  : modelResults.missionFeasibilityPct >= 75
                    ? 'text-[#FFB703]'
                    : 'text-[#FF2E93] glow-text-red'
                }`}
            >
              {modelResults.missionFeasibilityPct}
            </span>
            <span className="text-xs font-rajdhani font-bold text-slate-400">%</span>
          </div>
          <span className="text-[10px] font-rajdhani font-bold text-slate-400 block">Range vs Total Goal</span>
        </div>

        {/* Card 3: Remaining Distance */}
        <div className="bg-[#0b1429]/90 backdrop-blur-md p-4 rounded-xl border border-[#1e2d4a] shadow-lg flex flex-col justify-between">
          <span className="text-[10px] font-orbitron font-extrabold text-slate-400 uppercase tracking-wider block">REMAINING DIST</span>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-2xl font-orbitron font-black text-[#38BDF8] font-mono-num">{activeStream.remainingDistance}</span>
            <span className="text-xs font-rajdhani font-bold text-slate-400">km</span>
          </div>
          <span className="text-[10px] font-rajdhani font-bold text-slate-400 block">Distance to destination</span>
        </div>

        {/* Card 4: Reachable Distance */}
        <div className="bg-[#0b1429]/90 backdrop-blur-md p-4 rounded-xl border border-[#1e2d4a] shadow-lg flex flex-col justify-between">
          <span className="text-[10px] font-orbitron font-extrabold text-slate-400 uppercase tracking-wider block">REACHABLE DIST</span>
          <div className="flex items-baseline gap-1 my-1">
            <span className={`text-2xl font-orbitron font-black font-mono-num ${modelResults.isFeasible ? 'text-[#00E676] glow-text-emerald' : 'text-[#FF2E93] glow-text-red'}`}>
              {modelResults.estimatedReachableDistance}
            </span>
            <span className="text-xs font-rajdhani font-bold text-slate-400">km</span>
          </div>
          <span className="text-[10px] font-rajdhani font-bold text-slate-400 block">Max range based on energy</span>
        </div>

        {/* Card 5: Remaining Energy */}
        <div className="bg-[#0b1429]/90 backdrop-blur-md p-4 rounded-xl border border-[#1e2d4a] shadow-lg flex flex-col justify-between">
          <span className="text-[10px] font-orbitron font-extrabold text-slate-400 uppercase tracking-wider block">REMAINING ENERGY</span>
          <div className="flex items-baseline gap-1 my-1">
            <span className={`text-2xl font-orbitron font-black font-mono-num ${activeStream.remainingFuel > 0 ? 'text-amber-400' : 'text-[#FF2E93] animate-pulse'}`}>
              {activeStream.remainingFuel}
            </span>
            <span className="text-xs font-rajdhani font-bold text-slate-400">Units</span>
          </div>
          <span className="text-[10px] font-rajdhani font-bold text-slate-400 block">Actual fuel balance</span>
        </div>

        {/* Card 6: Consumption Rate */}
        <div className="bg-[#0b1429]/90 backdrop-blur-md p-4 rounded-xl border border-[#1e2d4a] shadow-lg flex flex-col justify-between">
          <span className="text-[10px] font-orbitron font-extrabold text-slate-400 uppercase tracking-wider block">CONSUMPTION RATE</span>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-2xl font-orbitron font-black text-purple-400 font-mono-num">{modelResults.effectiveConsumption}</span>
            <span className="text-xs font-rajdhani font-bold text-slate-400">U/km</span>
          </div>
          <span className="text-[10px] font-rajdhani font-bold text-slate-400 block">Drag & speed adjusted</span>
        </div>

        {/* Card 7: Flight Efficiency */}
        <div className="bg-[#0b1429]/90 backdrop-blur-md p-4 rounded-xl border border-[#1e2d4a] shadow-lg flex flex-col justify-between">
          <span className="text-[10px] font-orbitron font-extrabold text-slate-400 uppercase tracking-wider block">FLIGHT EFFICIENCY</span>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-2xl font-orbitron font-black text-[#00F0FF] font-mono-num glow-text-cyan">{modelResults.currentEfficiency}</span>
            <span className="text-xs font-rajdhani font-bold text-slate-400">km/U</span>
          </div>
          <span className="text-[10px] font-rajdhani font-bold text-slate-400 block">Kilometers per unit energy</span>
        </div>

        {/* Card 8: Optimization Gain */}
        <div className="bg-[#0b1429]/90 backdrop-blur-md p-4 rounded-xl border border-[#1e2d4a] shadow-lg flex flex-col justify-between">
          <span className="text-[10px] font-orbitron font-extrabold text-slate-400 uppercase tracking-wider block">OPTIMIZATION GAIN</span>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-2xl font-orbitron font-black text-emerald-400 font-mono-num">
              +{optimizationResults.optimizationGain}
            </span>
            <span className="text-xs font-rajdhani font-bold text-slate-400">km</span>
          </div>
          <span className="text-[10px] font-rajdhani font-bold text-slate-400 block">Range gain if optimized</span>
        </div>

        {/* Card 9: Success Probability */}
        <div className="bg-[#0b1429]/90 backdrop-blur-md p-4 rounded-xl border border-[#1e2d4a] shadow-lg flex flex-col justify-between">
          <span className="text-[10px] font-orbitron font-extrabold text-slate-400 uppercase tracking-wider block">SUCCESS PROB</span>
          <div className="flex items-baseline gap-1 my-1">
            <span
              className={`text-2xl font-orbitron font-black font-mono-num ${modelResults.successProbability >= 80
                  ? 'text-[#00E676] glow-text-emerald'
                  : modelResults.successProbability >= 60
                    ? 'text-[#FFB703]'
                    : 'text-[#FF2E93] glow-text-red'
                }`}
            >
              {modelResults.successProbability}
            </span>
            <span className="text-xs font-rajdhani font-bold text-slate-400">%</span>
          </div>
          <span className="text-[10px] font-rajdhani font-bold text-slate-400 block">Safety margin included</span>
        </div>
      </div>

      {/* OPTIMIZATION ENGINE & RECOMMENDATION PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Optimization Engine Card (7 cols) */}
        <div className="lg:col-span-7 panel-glass p-5 rounded-2xl border border-[#1e2d4a] shadow-xl">
          <div className="flex items-center justify-between border-b border-[#1e2d4a] pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-[#00F0FF] animate-pulse" />
              <h2 className="text-sm font-orbitron font-extrabold text-white uppercase tracking-wider">
                FLIGHT PROFILE OPTIMIZATION ENGINE
              </h2>
            </div>
            <span className="px-2.5 py-1 rounded bg-[#00F0FF]/15 text-[#00F0FF] text-[11px] font-orbitron font-bold border border-[#00F0FF]/30">
              DYNAMIC SOLVER
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Packet Profile */}
            <div className="bg-[#070d1e] p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <span className="text-xs font-orbitron font-bold text-slate-400 uppercase">CURRENT PACKET FLIGHT PROFILE</span>
                <span className="text-[10px] font-mono text-cyan-400">PKT #{activeStream.packetNo}</span>
              </div>
              <div className="space-y-2 text-xs font-rajdhani font-bold">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Current Speed:</span>
                  <span className="text-white font-mono-num font-bold text-sm">{activeStream.currentSpeed} km/h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Current Altitude:</span>
                  <span className="text-white font-mono-num font-bold text-sm">{activeStream.currentAltitude} m</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Effective Consumption:</span>
                  <span className="text-purple-400 font-mono-num">{modelResults.effectiveConsumption} U/km</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-800/60">
                  <span className="text-slate-400">Success Probability:</span>
                  <span className={`font-orbitron font-bold text-sm ${modelResults.successProbability >= 80 ? 'text-[#00E676]' : 'text-[#FF2E93]'}`}>
                    {modelResults.successProbability}%
                  </span>
                </div>
              </div>
            </div>

            {/* Recommended Optimal Profile */}
            <div className="bg-[#09182b] p-4 rounded-xl border border-[#00F0FF]/40 shadow-[0_0_20px_rgba(0,240,255,0.15)] relative">
              <div className="flex items-center justify-between mb-3 border-b border-[#00F0FF]/20 pb-2">
                <span className="text-xs font-orbitron font-extrabold text-[#00F0FF] uppercase">RECOMMENDED OPTIMAL PROFILE</span>
                <span className="text-[10px] font-mono text-emerald-400">SOLVED</span>
              </div>
              <div className="space-y-2 text-xs font-rajdhani font-bold">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Recommended Speed:</span>
                  <span className="text-[#00F0FF] font-mono-num font-extrabold text-sm">{optimizationResults.optimalSpeed} km/h</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Recommended Altitude:</span>
                  <span className="text-[#00F0FF] font-mono-num font-extrabold text-sm">{optimizationResults.optimalAltitude} m</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Expected Reachable:</span>
                  <span className="text-[#00E676] font-mono-num font-extrabold">{optimizationResults.expectedReachableDistance} km</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[#00F0FF]/20">
                  <span className="text-slate-300">Optimized Success Prob:</span>
                  <span className="font-orbitron font-extrabold text-sm text-[#00E676] glow-text-emerald">
                    {optimizationResults.optSuccessProb}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Intelligent Recommendation Panel (5 cols) */}
        <div className="lg:col-span-5 panel-glass p-5 rounded-2xl border border-[#1e2d4a] shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 border-b border-[#1e2d4a] pb-3 mb-4">
              <Award className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-orbitron font-extrabold text-white uppercase tracking-wider">
                INTELLIGENT RECOMMENDATION PANEL
              </h2>
            </div>

            <div className="space-y-2.5 font-rajdhani text-xs md:text-sm">
              <div className="p-3 rounded-xl bg-[#09152b] border border-[#1e2d4a] text-slate-200">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase font-orbitron mb-1">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>FLIGHT ADVISORY ASSESSMENT:</span>
                </div>
                <p className="text-slate-300 font-semibold leading-relaxed">
                  {modelResults.isFeasible
                    ? 'Flight energy consumption is nominal. Applying recommended speed/altitude profile will optimize total mission safety margin.'
                    : 'Current speed and altitude parameters are causing elevated energy drain relative to remaining mission distance!'}
                </p>
              </div>

              <div className="space-y-1.5 text-slate-200 font-semibold">
                <div className="flex items-center gap-2 text-xs">
                  <ArrowRight className="w-4 h-4 text-[#00F0FF] shrink-0" />
                  <span>
                    Adjust speed to <strong className="text-[#00F0FF] font-mono">{optimizationResults.optimalSpeed} km/h</strong> (current:{' '}
                    <span className="text-slate-400">{activeStream.currentSpeed} km/h</span>).
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <ArrowRight className="w-4 h-4 text-[#00F0FF] shrink-0" />
                  <span>
                    Maintain altitude at <strong className="text-[#00F0FF] font-mono">{optimizationResults.optimalAltitude} m</strong> (range 500–600 m).
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <ArrowRight className="w-4 h-4 text-[#00E676] shrink-0" />
                  <span>
                    Reachable distance expands from{' '}
                    <strong className="text-slate-300 font-mono">{modelResults.estimatedReachableDistance} km</strong> to{' '}
                    <strong className="text-[#00E676] font-mono">{optimizationResults.expectedReachableDistance} km</strong>.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DYNAMICALLY ANIMATING CHARTS (4 CHARTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* GRAPH 1: Planned vs Current Mission Trajectory */}
        <div className="panel-glass p-5 rounded-2xl border border-[#1e2d4a] shadow-xl">
          <div className="flex items-center justify-between mb-4 border-b border-[#1e2d4a] pb-3">
            <div>
              <h3 className="text-xs font-orbitron font-extrabold text-white uppercase tracking-wider">
                GRAPH 1: PLANNED MISSION VS CURRENT MISSION
              </h3>
              <p className="text-[11px] font-rajdhani text-slate-400">
                Distance (km) vs Remaining Fuel / Energy (Units)
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-rajdhani font-bold">
              <span className="flex items-center gap-1 text-[#38BDF8]">
                <span className="w-2.5 h-0.5 bg-[#38BDF8] inline-block" /> Planned Curve
              </span>
              <span className="flex items-center gap-1 text-[#00E676]">
                <span className="w-2.5 h-0.5 bg-[#00E676] inline-block" /> Current Flight
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={graph1Data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" opacity={0.5} />
                <XAxis dataKey="distance" stroke="#94a3b8" tick={{ fontSize: 11 }} unit="km" />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} domain={[0, 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#070d1e', borderColor: '#1e2d4a', borderRadius: '0.5rem', color: '#fff' }}
                />
                <Line
                  type="monotone"
                  dataKey="plannedFuel"
                  name="Planned Fuel"
                  stroke="#38BDF8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="currentFuel"
                  name="Current Flight Fuel"
                  stroke={modelResults.isFeasible ? '#00E676' : '#FF2E93'}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRAPH 2: Fuel/Energy Remaining vs Reachable Distance */}
        <div className="panel-glass p-5 rounded-2xl border border-[#1e2d4a] shadow-xl">
          <div className="flex items-center justify-between mb-4 border-b border-[#1e2d4a] pb-3">
            <div>
              <h3 className="text-xs font-orbitron font-extrabold text-white uppercase tracking-wider">
                GRAPH 2: FUEL / ENERGY REMAINING VS DISTANCE
              </h3>
              <p className="text-[11px] font-rajdhani text-slate-400">
                Required Goal vs Current Reachable & Optimized Reachable
              </p>
            </div>
          </div>

          <div className="h-64 w-full flex flex-col justify-center space-y-5 px-2">
            <div>
              <div className="flex justify-between text-xs font-rajdhani font-bold mb-1">
                <span className="text-slate-300 font-mono">Total Required Mission Distance:</span>
                <span className="text-[#38BDF8] font-mono">{missionParams.totalDistance} km</span>
              </div>
              <div className="w-full h-4 bg-[#070d1e] rounded-full overflow-hidden border border-[#1e2d4a]">
                <div className="h-full bg-[#38BDF8] rounded-full" style={{ width: '100%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-rajdhani font-bold mb-1">
                <span className="text-slate-300">Current Reachable Distance:</span>
                <span className={`font-mono ${modelResults.isFeasible ? 'text-[#00E676]' : 'text-[#FF2E93]'}`}>
                  {modelResults.estimatedReachableDistance} km
                </span>
              </div>
              <div className="w-full h-4 bg-[#070d1e] rounded-full overflow-hidden border border-[#1e2d4a]">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${modelResults.isFeasible ? 'bg-[#00E676]' : 'bg-[#FF2E93]'
                    }`}
                  style={{
                    width: `${Math.min(
                      100,
                      (modelResults.estimatedReachableDistance / Math.max(1, missionParams.totalDistance)) * 100
                    )}%`
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-rajdhani font-bold mb-1">
                <span className="text-slate-300">Optimized Reachable Distance:</span>
                <span className="text-[#00F0FF] font-mono">{optimizationResults.expectedReachableDistance} km</span>
              </div>
              <div className="w-full h-4 bg-[#070d1e] rounded-full overflow-hidden border border-[#1e2d4a]">
                <div
                  className="h-full bg-gradient-to-r from-[#00F0FF] to-[#2563EB] rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      (optimizationResults.expectedReachableDistance / Math.max(1, missionParams.totalDistance)) * 100
                    )}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* GRAPH 3: Current Efficiency vs Optimized Efficiency */}
        <div className="panel-glass p-5 rounded-2xl border border-[#1e2d4a] shadow-xl">
          <div className="flex items-center justify-between mb-4 border-b border-[#1e2d4a] pb-3">
            <div>
              <h3 className="text-xs font-orbitron font-extrabold text-white uppercase tracking-wider">
                GRAPH 3: CURRENT EFFICIENCY VS OPTIMIZED EFFICIENCY
              </h3>
              <p className="text-[11px] font-rajdhani text-slate-400">
                Comparative Bar Metrics (Efficiency km/U & Total Reachable Range km)
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graph3Data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" opacity={0.5} />
                <XAxis dataKey="metric" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#070d1e', borderColor: '#1e2d4a', borderRadius: '0.5rem', color: '#fff' }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="Current" fill="#FFB703" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="Optimized" fill="#00F0FF" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRAPH 4: Mission Success Probability Circular Gauge */}
        <div className="panel-glass p-5 rounded-2xl border border-[#1e2d4a] shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#1e2d4a] pb-3">
            <h3 className="text-xs font-orbitron font-extrabold text-white uppercase tracking-wider">
              GRAPH 4: MISSION SUCCESS PROBABILITY GAUGE
            </h3>
            <span className="text-[10px] font-mono text-slate-400">0 – 100% SCALE</span>
          </div>

          <div className="flex flex-col items-center justify-center my-4 relative">
            <svg className="w-52 h-52 transform -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="48" stroke="#0f1933" strokeWidth="10" fill="transparent" />
              <circle
                cx="60"
                cy="60"
                r="48"
                stroke={
                  modelResults.successProbability >= 80
                    ? '#00E676'
                    : modelResults.successProbability >= 60
                      ? '#FFB703'
                      : '#FF2E93'
                }
                strokeWidth="10"
                strokeDasharray={`${(modelResults.successProbability / 100) * 301.59} 301.59`}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-300 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span
                className={`text-4xl font-orbitron font-black font-mono-num ${modelResults.successProbability >= 80
                    ? 'text-[#00E676] glow-text-emerald'
                    : modelResults.successProbability >= 60
                      ? 'text-[#FFB703]'
                      : 'text-[#FF2E93] glow-text-red'
                  }`}
              >
                {modelResults.successProbability}%
              </span>
              <span className="text-xs font-orbitron font-bold text-slate-300 uppercase tracking-widest mt-1">
                PROBABILITY
              </span>
              <span className="text-[10px] font-rajdhani font-bold text-slate-400 mt-0.5">
                {modelResults.successProbability >= 80
                  ? 'NOMINAL MARGIN'
                  : modelResults.successProbability >= 60
                    ? 'MODERATE MARGIN'
                    : 'CRITICAL MARGIN DEFICIT'}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center px-4 py-2 bg-[#070d1e] rounded-xl border border-[#1e2d4a] text-xs font-rajdhani font-bold">
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-[#FF2E93]" /> 0–50% High Risk
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-[#FFB703]" /> 51–79% Moderate
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-[#00E676]" /> 80–100% Optimal
            </span>
          </div>
        </div>
      </div>

      {/* FINAL MISSION SUMMARY REPORT (ACCURATELY GENERATED) */}
      {(simState === 'completed' || currentPacketIdx >= parsedPackets.length - 1) && finalSummaryStats && mode === 'scenario' && (
        <div
          className={`panel-glass p-6 rounded-2xl border-2 shadow-2xl space-y-4 ${finalSummaryStats.isFeasible
              ? 'border-[#00E676] shadow-[0_0_30px_rgba(0,230,118,0.25)]'
              : 'border-[#FF2E93] shadow-[0_0_30px_rgba(255,46,147,0.3)]'
            }`}
        >
          <div className="flex items-center justify-between border-b border-[#1e2d4a] pb-3">
            <div className="flex items-center gap-3">
              <Award className={`w-6 h-6 ${finalSummaryStats.isFeasible ? 'text-[#00E676]' : 'text-[#FF2E93] animate-bounce'}`} />
              <div>
                <h2 className="text-base font-orbitron font-black text-white uppercase tracking-wider">
                  FINAL MISSION SCENARIO EVALUATION REPORT
                </h2>
                <p className="text-xs font-rajdhani font-bold text-slate-300">
                  Physics Energy Consumption & Optimization Assessment
                </p>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-lg border text-xs font-orbitron font-extrabold uppercase tracking-wider ${finalSummaryStats.isFeasible
                  ? 'bg-emerald-950/80 text-[#00E676] border-[#00E676]/40'
                  : 'bg-rose-950/80 text-[#FF2E93] border-[#FF2E93]/40'
                }`}
            >
              {finalSummaryStats.overallStatus}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#070d1e] p-4 rounded-xl border border-[#1e2d4a]">
              <span className="text-xs font-rajdhani font-bold text-slate-400 uppercase">PACKETS PROCESSED</span>
              <div className="text-2xl font-orbitron font-black text-[#00F0FF] font-mono-num mt-1">
                {finalSummaryStats.totalPackets}
              </div>
            </div>

            <div className="bg-[#070d1e] p-4 rounded-xl border border-[#1e2d4a]">
              <span className="text-xs font-rajdhani font-bold text-slate-400 uppercase">DISTANCE COVERED</span>
              <div className="text-2xl font-orbitron font-black text-[#38BDF8] font-mono-num mt-1">
                {finalSummaryStats.distanceCovered} km
              </div>
            </div>

            <div className="bg-[#070d1e] p-4 rounded-xl border border-[#1e2d4a]">
              <span className="text-xs font-rajdhani font-bold text-slate-400 uppercase">MAX ALTITUDE</span>
              <div className="text-2xl font-orbitron font-black text-amber-400 font-mono-num mt-1">
                {finalSummaryStats.maxAltitude} m
              </div>
            </div>

            <div className="bg-[#070d1e] p-4 rounded-xl border border-[#1e2d4a]">
              <span className="text-xs font-rajdhani font-bold text-slate-400 uppercase">AVERAGE SPEED</span>
              <div className="text-2xl font-orbitron font-black text-purple-400 font-mono-num mt-1">
                {finalSummaryStats.avgSpeed} km/h
              </div>
            </div>

            <div className="bg-[#070d1e] p-4 rounded-xl border border-[#1e2d4a]">
              <span className="text-xs font-rajdhani font-bold text-slate-400 uppercase">ENERGY CONSUMED</span>
              <div className="text-2xl font-orbitron font-black text-rose-400 font-mono-num mt-1">
                {finalSummaryStats.energyConsumed} Units
              </div>
            </div>

            <div className="bg-[#070d1e] p-4 rounded-xl border border-[#1e2d4a]">
              <span className="text-xs font-rajdhani font-bold text-slate-400 uppercase">REMAINING ENERGY</span>
              <div className={`text-2xl font-orbitron font-black font-mono-num mt-1 ${finalSummaryStats.remainingEnergy > 0 ? 'text-emerald-400' : 'text-[#FF2E93]'}`}>
                {finalSummaryStats.remainingEnergy} Units
              </div>
            </div>

            <div className="bg-[#070d1e] p-4 rounded-xl border border-[#1e2d4a]">
              <span className="text-xs font-rajdhani font-bold text-slate-400 uppercase">FEASIBILITY DECISION</span>
              <div
                className={`text-xl font-orbitron font-black mt-1 ${finalSummaryStats.isFeasible ? 'text-[#00E676] glow-text-emerald' : 'text-[#FF2E93] glow-text-red'
                  }`}
              >
                {finalSummaryStats.isFeasible ? 'COMPLETED' : 'AT RISK / DEFICIT'}
              </div>
            </div>

            <div className="bg-[#070d1e] p-4 rounded-xl border border-[#1e2d4a]">
              <span className="text-xs font-rajdhani font-bold text-slate-400 uppercase">OPTIMAL FLIGHT PROFILE</span>
              <div className="text-sm font-orbitron font-extrabold text-[#00F0FF] mt-1">
                {finalSummaryStats.optimalSpeed} km/h @ {finalSummaryStats.optimalAltitude} m
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Analytical Notice */}
      <div className="panel-glass p-4 rounded-xl border border-[#1e2d4a] bg-[#060a17]/90 text-slate-400 text-xs font-sans flex items-start gap-3 shadow-inner">
        <Info className="w-5 h-5 text-[#00F0FF] shrink-0 mt-0.5" />
        <div>
          <span className="font-orbitron font-bold text-[#00F0FF] block text-[11px] uppercase tracking-wider mb-0.5">
            MODEL DISCLAIMER & ANALYTICAL NOTICE
          </span>
          <p className="font-rajdhani font-semibold leading-relaxed text-slate-300">
            Fuel/Energy values are estimated using a simplified mission energy consumption model based on predefined mission parameters and real-time operating conditions. They are analytical estimations and not direct sensor measurements.
          </p>
        </div>
      </div>
    </div>
  );
}
