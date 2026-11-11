import { TelemetryFrame, PacketStatistics, SystemHealth, AlertItem, MissionStats } from '../types/telemetry';
import { PacketParser } from './PacketParser';
import { serialManager } from './SerialManager';

export const INITIAL_TELEMETRY: TelemetryFrame = {
  packetId: 0,
  latitude: 0.0,
  longitude: 0.0,
  roll: 0.0,
  pitch: 0.0,
  temperature: 28.5,
  pressure: 1013.25,
  altitude: 0.0,
  vibration: 0,
  satellites: 0,
  speed: 0.0,
  rssi: -95,
  snr: 8.5,
  timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }) + '.000',
  stage: 1,
  flightStatus: 'PRE-LAUNCH',
  systemMode: 'NOMINAL',
  apogeeEst: 0.0,
  maxSpeedEst: 0.0,
  flightTimeSec: 0
};

export class TelemetryStore {
  private currentFrame: TelemetryFrame = { ...INITIAL_TELEMETRY };
  private history: TelemetryFrame[] = [];
  private listeners: Set<(frame: TelemetryFrame) => void> = new Set();
  private statsListeners: Set<(stats: PacketStatistics) => void> = new Set();
  private healthListeners: Set<(health: SystemHealth) => void> = new Set();
  private alertListeners: Set<(alerts: AlertItem[]) => void> = new Set();

  private packetsReceived = 0;
  private packetsLost = 0;
  private lastPacketId = -1;
  private lastPacketTimestamp = Date.now();
  private packetRateHz = 0;
  private packetRateCount = 0;

  private isSimulating = false;
  private simTimer: any = null;
  private simTimeSec = 0;
  private simVelocity = 0;
  private simAltitude = 0;
  private simLat = 13.082700;
  private simLon = 80.270700;

  private activeAlerts: AlertItem[] = [];
  private systemHealth: SystemHealth = {
    esp32: 'NOMINAL',
    gps: 'NOMINAL',
    bmp280: 'NOMINAL',
    mpu6050: 'NOMINAL',
    lora: 'NOMINAL',
    uart: 'NOMINAL'
  };

  constructor() {
    // Connect serial data callback
    serialManager.onData((line) => {
      this.handleIncomingLine(line);
    });

    // Start 1-second packet rate calculation interval
    setInterval(() => {
      this.packetRateHz = this.packetRateCount;
      this.packetRateCount = 0;
      this.notifyStats();
    }, 1000);
  }

  public subscribe(callback: (frame: TelemetryFrame) => void) {
    this.listeners.add(callback);
    callback(this.currentFrame);
    return () => this.listeners.delete(callback);
  }

  public subscribeStats(callback: (stats: PacketStatistics) => void) {
    this.statsListeners.add(callback);
    callback(this.getStatistics());
    return () => this.statsListeners.delete(callback);
  }

  public subscribeHealth(callback: (health: SystemHealth) => void) {
    this.healthListeners.add(callback);
    callback(this.systemHealth);
    return () => this.healthListeners.delete(callback);
  }

  public subscribeAlerts(callback: (alerts: AlertItem[]) => void) {
    this.alertListeners.add(callback);
    callback(this.activeAlerts);
    return () => this.alertListeners.delete(callback);
  }

  public getCurrentFrame(): TelemetryFrame {
    return this.currentFrame;
  }

  public getHistory(): TelemetryFrame[] {
    return this.history;
  }

  public getStatistics(): PacketStatistics {
    const total = this.packetsReceived + this.packetsLost;
    const lossPct = total > 0 ? (this.packetsLost / total) * 100 : 0;
    return {
      packetsReceived: this.packetsReceived,
      packetsLost: this.packetsLost,
      packetLossPercentage: parseFloat(lossPct.toFixed(2)),
      packetRateHz: this.packetRateHz,
      lastPacketTimestamp: this.lastPacketTimestamp
    };
  }

  public getMissionSummaryStats(): MissionStats {
    if (this.history.length === 0) {
      return {
        packetsReceived: 0,
        packetsLost: 0,
        packetLossPercentage: 0,
        missionDurationSec: 0,
        maxSpeed: 0,
        maxAltitude: 0,
        avgRssi: 0,
        avgSnr: 0,
        highestTemp: 0,
        lowestTemp: 0
      };
    }

    const total = this.packetsReceived + this.packetsLost;
    const lossPct = total > 0 ? (this.packetsLost / total) * 100 : 0;

    let maxSpeed = 0;
    let maxAltitude = 0;
    let sumRssi = 0;
    let sumSnr = 0;
    let highestTemp = -999;
    let lowestTemp = 999;

    this.history.forEach((f) => {
      if (f.speed > maxSpeed) maxSpeed = f.speed;
      if (f.altitude > maxAltitude) maxAltitude = f.altitude;
      if (f.temperature > highestTemp) highestTemp = f.temperature;
      if (f.temperature < lowestTemp) lowestTemp = f.temperature;
      sumRssi += f.rssi;
      sumSnr += f.snr;
    });

    const len = this.history.length;

    return {
      packetsReceived: this.packetsReceived,
      packetsLost: this.packetsLost,
      packetLossPercentage: parseFloat(lossPct.toFixed(2)),
      missionDurationSec: this.simTimeSec || Math.floor(len / Math.max(1, this.packetRateHz)),
      maxSpeed: parseFloat(maxSpeed.toFixed(1)),
      maxAltitude: parseFloat(maxAltitude.toFixed(1)),
      avgRssi: Math.round(sumRssi / len),
      avgSnr: parseFloat((sumSnr / len).toFixed(2)),
      highestTemp: parseFloat(highestTemp.toFixed(1)),
      lowestTemp: parseFloat(lowestTemp.toFixed(1))
    };
  }

  public handleIncomingLine(rawLine: string) {
    const parsed = PacketParser.parsePacket(rawLine);
    if (!parsed) return;

    this.processFrame(parsed);
  }

  public processFrame(frame: TelemetryFrame) {
    this.lastPacketTimestamp = Date.now();
    this.packetRateCount += 1;

    // Detect ESP32 transmitter reset (Packet ID restarting from 0/1 after a higher ID)
    if (this.lastPacketId > 5 && frame.packetId <= 5) {
      console.log(`[TelemetryStore] ESP32 reset detected (PacketID restarted from #${this.lastPacketId} to #${frame.packetId}). Resetting packet counters.`);
      this.packetsReceived = 0;
      this.packetsLost = 0;
      this.lastPacketId = -1;
    } else if (this.lastPacketId !== -1 && frame.packetId < this.lastPacketId) {
      console.log(`[TelemetryStore] Packet ID sequence drop detected (${this.lastPacketId} -> ${frame.packetId}). Resetting packet counters.`);
      this.packetsReceived = 0;
      this.packetsLost = 0;
      this.lastPacketId = -1;
    }

    // Check packet loss using PacketID gap
    if (this.lastPacketId !== -1 && frame.packetId > this.lastPacketId + 1) {
      this.packetsLost += (frame.packetId - this.lastPacketId - 1);
    }
    this.lastPacketId = frame.packetId;
    this.packetsReceived += 1;

    // Calculate flight estimates
    const apogeeEst = Math.max(this.currentFrame.apogeeEst || 0, frame.altitude);
    const maxSpeedEst = Math.max(this.currentFrame.maxSpeedEst || 0, frame.speed);
    const flightTimeSec = this.currentFrame.flightTimeSec ? this.currentFrame.flightTimeSec + 1 : 1;

    // Flight stage evaluate
    let status = frame.flightStatus || 'PRE-LAUNCH';
    if (frame.altitude > 20) {
      if (frame.altitude < (this.currentFrame.altitude || 0)) {
        status = frame.altitude < 150 ? 'MAIN CHUTE LANDING' : 'DROGUE CHUTE';
      } else {
        status = 'POWERED ASCENT';
      }
    }

    const updatedFrame: TelemetryFrame = {
      ...frame,
      apogeeEst: parseFloat(apogeeEst.toFixed(1)),
      maxSpeedEst: parseFloat(maxSpeedEst.toFixed(1)),
      flightTimeSec,
      flightStatus: status
    };

    this.currentFrame = updatedFrame;

    // Maintain up to 2000 items in history for real-time graphs and logs
    this.history.unshift(updatedFrame);
    if (this.history.length > 2000) {
      this.history.pop();
    }

    // Evaluate health & alert conditions
    this.evaluateAlerts(updatedFrame);

    // Notify listeners immediately (<50ms latency)
    this.notifyListeners();
  }

  private evaluateAlerts(frame: TelemetryFrame) {
    const alerts: AlertItem[] = [];
    const timestamp = frame.timestamp;

    // 1. High Temperature Alert
    if (frame.temperature > 45) {
      alerts.push({
        id: `ALT-TEMP-${Date.now()}`,
        type: 'CRITICAL',
        message: `CRITICAL TEMPERATURE EXCEEDED: ${frame.temperature.toFixed(1)}°C`,
        timestamp,
        parameter: 'Temperature',
        value: frame.temperature
      });
      this.systemHealth.bmp280 = 'CRITICAL';
    } else {
      this.systemHealth.bmp280 = 'NOMINAL';
    }

    // 2. Roll & Pitch Limit Alert
    if (Math.abs(frame.roll) > 45 || Math.abs(frame.pitch) > 45) {
      alerts.push({
        id: `ALT-ATT-${Date.now()}`,
        type: 'WARNING',
        message: `ATTITUDE EXCURSION EXCEEDED LIMITS (Roll: ${frame.roll}°, Pitch: ${frame.pitch}°)`,
        timestamp,
        parameter: 'Attitude'
      });
      this.systemHealth.mpu6050 = 'WARNING';
    } else {
      this.systemHealth.mpu6050 = 'NOMINAL';
    }

    // 3. GPS Satellites Alert
    if (frame.satellites < 4) {
      alerts.push({
        id: `ALT-GPS-${Date.now()}`,
        type: 'WARNING',
        message: `LOW GPS SATELLITE FIX: ${frame.satellites} SATS CONNECTED`,
        timestamp,
        parameter: 'GPS'
      });
      this.systemHealth.gps = 'WARNING';
    } else {
      this.systemHealth.gps = 'NOMINAL';
    }

    // 4. RSSI Signal Alert
    if (frame.rssi < -110) {
      alerts.push({
        id: `ALT-LORA-${Date.now()}`,
        type: 'WARNING',
        message: `WEAK LORA SIGNAL DEGRADATION (RSSI: ${frame.rssi} dBm)`,
        timestamp,
        parameter: 'LoRa RSSI'
      });
      this.systemHealth.lora = 'WARNING';
    } else {
      this.systemHealth.lora = 'NOMINAL';
    }

    // 5. High Vibration Alert
    if (frame.vibration === 1) {
      alerts.push({
        id: `ALT-VIB-${Date.now()}`,
        type: 'CRITICAL',
        message: `EXCESSIVE STRUCTURAL VIBRATION DETECTED!`,
        timestamp,
        parameter: 'Vibration'
      });
    }

    this.activeAlerts = alerts;
    this.notifyAlerts();
    this.notifyHealth();
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => cb(this.currentFrame));
    this.notifyStats();
  }

  private notifyStats() {
    const stats = this.getStatistics();
    this.statsListeners.forEach((cb) => cb(stats));
  }

  private notifyHealth() {
    this.healthListeners.forEach((cb) => cb(this.systemHealth));
  }

  private notifyAlerts() {
    this.alertListeners.forEach((cb) => cb(this.activeAlerts));
  }

  /**
   * Simulation / Demo Mode Engine
   */
  public toggleSimulation(enable: boolean) {
    this.isSimulating = enable;
    if (enable) {
      this.startSimulation();
    } else {
      this.stopSimulation();
    }
  }

  public isDemoActive(): boolean {
    return this.isSimulating;
  }

  public startSimulation() {
    if (this.simTimer) clearInterval(this.simTimer);
    this.simTimeSec = 0;
    this.simAltitude = 0;
    this.simVelocity = 0;

    // Pre-populate 18 seconds of active rocket ascent data for immediate live visuals
    for (let i = 0; i < 18; i++) {
      this.tickSimulation();
    }

    this.simTimer = setInterval(() => {
      this.tickSimulation();
    }, 1000);
  }

  public stopSimulation() {
    if (this.simTimer) {
      clearInterval(this.simTimer);
      this.simTimer = null;
    }
  }

  private tickSimulation() {
    this.simTimeSec += 1;
    const packetId = this.packetsReceived + this.packetsLost + 1;

    // Simulate 2% packet loss gap
    if (Math.random() < 0.02 && this.simTimeSec > 5) {
      this.packetsLost += 1;
      this.notifyStats();
      return;
    }

    let status = 'POWERED ASCENT';
    let stage = 1;
    let accel = 0;
    let roll = parseFloat((Math.sin(this.simTimeSec * 0.15) * 4).toFixed(2));
    let pitch = parseFloat((Math.sin(this.simTimeSec * 0.2) * 5).toFixed(2));
    let vibration = 0;

    if (this.simTimeSec < 5) {
      status = 'PRE-LAUNCH';
      this.simVelocity = 0;
      this.simAltitude = 0;
      pitch = 0.0;
    } else if (this.simTimeSec < 35) {
      status = 'POWERED ASCENT';
      stage = 1;
      accel = 22 - (this.simTimeSec * 0.15);
      this.simVelocity += accel;
      this.simAltitude += this.simVelocity;
      if (Math.random() < 0.12) vibration = 1;
    } else if (this.simTimeSec < 40) {
      status = 'STAGE SEPARATION';
      stage = 2;
      vibration = 1;
      this.simVelocity += 3;
      this.simAltitude += this.simVelocity;
    } else if (this.simTimeSec < 85) {
      status = 'COASTING TO APOGEE';
      stage = 2;
      this.simVelocity = Math.max(5, this.simVelocity - 9.81 * 0.85);
      this.simAltitude += this.simVelocity;
    } else if (this.simTimeSec < 150) {
      status = 'DROGUE CHUTE';
      stage = 2;
      this.simVelocity = -12.5;
      this.simAltitude = Math.max(0, this.simAltitude + this.simVelocity);
      pitch = parseFloat((18 + Math.sin(this.simTimeSec) * 8).toFixed(2));
    } else {
      status = 'MAIN CHUTE LANDING';
      stage = 2;
      this.simVelocity = -4.5;
      this.simAltitude = Math.max(0, this.simAltitude + this.simVelocity);
      if (this.simAltitude <= 0) {
        this.simAltitude = 0;
        this.simVelocity = 0;
        status = 'TOUCHDOWN / LANDED';
      }
    }

    const pressure = parseFloat((1013.25 * Math.exp(-this.simAltitude / 8400)).toFixed(2));
    const temp = parseFloat((28.5 - (this.simAltitude / 1000) * 6.5 + (Math.random() * 0.4 - 0.2)).toFixed(1));

    if (this.simAltitude > 0) {
      this.simLat += 0.00008 + (this.simVelocity * 0.000004);
      this.simLon += 0.00012 + (this.simVelocity * 0.000006);
    }

    const rssi = Math.max(-115, Math.floor(-68 - (this.simAltitude / 90) + (Math.random() * 4 - 2)));
    const snr = parseFloat((8.8 - (this.simAltitude / 450) + (Math.random() * 0.6 - 0.3)).toFixed(2));

    const timestamp = new Date().toLocaleTimeString('en-IN', { hour12: false }) +
      '.' + String(Math.floor(Math.random() * 900 + 100)).padStart(3, '0');

    const frame: TelemetryFrame = {
      packetId,
      latitude: parseFloat(this.simLat.toFixed(6)),
      longitude: parseFloat(this.simLon.toFixed(6)),
      roll,
      pitch,
      temperature: temp,
      pressure,
      altitude: parseFloat(this.simAltitude.toFixed(1)),
      vibration,
      satellites: Math.min(14, 8 + Math.floor(this.simAltitude / 300)),
      speed: parseFloat(Math.abs(this.simVelocity).toFixed(1)),
      rssi,
      snr,
      timestamp,
      stage,
      flightStatus: status,
      systemMode: rssi < -110 ? 'MARGINAL' : 'NOMINAL'
    };

    this.processFrame(frame);
  }

  public resetPacketStats() {
    this.packetsReceived = 0;
    this.packetsLost = 0;
    this.lastPacketId = -1;
    this.notifyStats();
  }

  public resetStore() {
    this.packetsReceived = 0;
    this.packetsLost = 0;
    this.lastPacketId = -1;
    this.history = [];
    this.currentFrame = { ...INITIAL_TELEMETRY };
    this.notifyListeners();
  }
}

export const telemetryStore = new TelemetryStore();
