import { TelemetryFrame } from '../types/telemetry';

export class PacketParser {
  /**
   * Parses raw telemetry string output from ESP32 LoRa Receiver over UART.
   * Expected format (13 fields):
   * PacketID, Latitude, Longitude, Roll, Pitch, Speed, Temperature, Pressure, Altitude, Vibration, GPSSatellites, RSSI, SNR
   *
   * Example:
   * 190, 13.261047, 80.022846, -24.66, -4.15, 12.45, 30.24, 1001.12, 0.00, 0, 8, -98, 7.25
   */
  public static parsePacket(rawLine: string): TelemetryFrame | null {
    if (!rawLine || typeof rawLine !== 'string') return null;

    const parts = rawLine.split(',').map((p) => p.trim());
    if (parts.length < 13) {
      // Discard invalid/incomplete frame safely without crashing
      return null;
    }

    try {
      const packetId = parseInt(parts[0], 10);
      const latitude = parseFloat(parts[1]);
      const longitude = parseFloat(parts[2]);
      const roll = parseFloat(parts[3]);
      const pitch = parseFloat(parts[4]);
      const speed = parseFloat(parts[5]);
      const temperature = parseFloat(parts[6]);
      const pressure = parseFloat(parts[7]);
      const altitude = parseFloat(parts[8]);
      const vibration = parseInt(parts[9], 10) || 0;
      const satellites = parseInt(parts[10], 10) || 0;
      const rssi = parseInt(parts[11], 10) || -100;
      const snr = parseFloat(parts[12]) || 0;

      // Validate numeric types
      if (isNaN(packetId) || isNaN(latitude) || isNaN(longitude) || isNaN(altitude)) {
        return null;
      }

      const timestamp = new Date().toLocaleTimeString('en-IN', { hour12: false }) +
        '.' + String(Math.floor(Math.random() * 900 + 100)).padStart(3, '0');

      return {
        packetId,
        latitude,
        longitude,
        roll,
        pitch,
        speed,
        temperature,
        pressure,
        altitude,
        vibration,
        satellites,
        rssi,
        snr,
        timestamp,
        stage: 1,
        flightStatus: altitude > 10 ? 'POWERED ASCENT' : 'PRE-LAUNCH',
        systemMode: 'NOMINAL'
      };
    } catch (err) {
      console.warn('[PacketParser] Error parsing frame string:', err);
      return null;
    }
  }
}
