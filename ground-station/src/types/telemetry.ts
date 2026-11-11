export interface TelemetryFrame {
  packetId: number;
  latitude: number;
  longitude: number;
  roll: number;
  pitch: number;
  speed: number; // m/s
  temperature: number; // °C
  pressure: number; // hPa
  altitude: number; // m
  vibration: number; // 0 = Normal, 1 = High
  satellites: number;
  rssi: number; // dBm
  snr: number; // dB
  timestamp: string;
  stage?: number;
  flightStatus?: string;
  systemMode?: string;
  apogeeEst?: number;
  maxSpeedEst?: number;
  flightTimeSec?: number;
}

export interface MissionSetupData {
  missionName: string;
  missionId: string;
  operatorName: string;
  missionType: string;
  notes?: string;
}

export type ConnectionState = 'Disconnected' | 'Connecting' | 'Connected' | 'Receiver Disconnected';

export interface SystemHealth {
  esp32: 'NOMINAL' | 'WARNING' | 'CRITICAL';
  gps: 'NOMINAL' | 'WARNING' | 'CRITICAL';
  bmp280: 'NOMINAL' | 'WARNING' | 'CRITICAL';
  mpu6050: 'NOMINAL' | 'WARNING' | 'CRITICAL';
  lora: 'NOMINAL' | 'WARNING' | 'CRITICAL';
  uart: 'NOMINAL' | 'WARNING' | 'CRITICAL';
}

export interface AlertItem {
  id: string;
  type: 'CRITICAL' | 'WARNING' | 'NORMAL';
  message: string;
  timestamp: string;
  parameter?: string;
  value?: number | string;
}

export interface PacketStatistics {
  packetsReceived: number;
  packetsLost: number;
  packetLossPercentage: number;
  packetRateHz: number;
  lastPacketTimestamp: number;
}

export interface MissionStats {
  packetsReceived: number;
  packetsLost: number;
  packetLossPercentage: number;
  missionDurationSec: number;
  maxSpeed: number;
  maxAltitude: number;
  avgRssi: number;
  avgSnr: number;
  highestTemp: number;
  lowestTemp: number;
}
