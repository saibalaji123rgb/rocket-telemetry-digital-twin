import { TelemetryFrame, PacketStatistics } from '../types/telemetry';

export type AdaptiveMode = 'GOOD' | 'MEDIUM' | 'POOR';
export type CommunicationQuality = 'Excellent' | 'Moderate' | 'Weak';

export interface AdaptiveModeInfo {
  mode: AdaptiveMode;
  quality: CommunicationQuality;
  intervalMs: number;
  intervalStr: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  numericVal: number; // GOOD=2, MEDIUM=1, POOR=0
}

export interface AdaptiveEventLogEntry {
  id: string;
  timestamp: string;
  mode: AdaptiveMode;
  recommendedInterval: string;
  rssi: number;
  snr: number;
}

export interface AdaptiveHistoryPoint {
  time: string;
  timestamp: string;
  mode: AdaptiveMode;
  numericMode: number; // 2, 1, 0
  rssi: number;
  snr: number;
}

export interface AdaptiveTelemetrySummary {
  goodDurationSec: number;
  mediumDurationSec: number;
  poorDurationSec: number;
  goodDurationFormatted: string;
  mediumDurationFormatted: string;
  poorDurationFormatted: string;
  avgRssi: number;
  minRssi: number;
  maxRssi: number;
  avgSnr: number;
  avgRecommendedIntervalMs: number;
  avgRecommendedIntervalStr: string;
  packetLossPercentage: number;
}

export class AdaptiveTelemetryModule {
  private currentMode: AdaptiveMode = 'GOOD';
  private lastEvaluatedFrame: TelemetryFrame | null = null;
  private history: AdaptiveHistoryPoint[] = [];
  private eventLog: AdaptiveEventLogEntry[] = [];
  private notifications: { id: string; title: string; quality: string; interval: string; timestamp: string }[] = [];

  // Duration counters in seconds
  private goodDuration = 0;
  private mediumDuration = 0;
  private poorDuration = 0;

  // Track RSSI & SNR history
  private rssiList: number[] = [];
  private snrList: number[] = [];
  private intervalList: number[] = [];

  /**
   * Calculate Communication Health percentage (0-100%) primarily from RSSI and SNR
   * Suggested mapping: RSSI > -80: Excellent, -80 to -90: Good, < -90: Poor
   */
  public calculateCommunicationHealth(rssi: number, snr: number): { healthPct: number; rating: 'Excellent' | 'Good' | 'Poor'; color: string } {
    let rssiScore = 100;
    if (rssi >= -70) {
      rssiScore = 100;
    } else if (rssi >= -80) {
      rssiScore = 80 + ((rssi + 80) / 10) * 20; // 80 - 100
    } else if (rssi >= -90) {
      rssiScore = 50 + ((rssi + 90) / 10) * 30; // 50 - 80
    } else if (rssi >= -100) {
      rssiScore = 20 + ((rssi + 100) / 10) * 30; // 20 - 50
    } else {
      rssiScore = Math.max(0, 20 + ((rssi + 120) / 20) * 20);
    }

    let snrScore = 100;
    if (snr >= 10) {
      snrScore = 100;
    } else if (snr >= 8) {
      snrScore = 85 + ((snr - 8) / 2) * 15;
    } else if (snr >= 5) {
      snrScore = 65 + ((snr - 5) / 3) * 20;
    } else if (snr >= 2) {
      snrScore = 40 + ((snr - 2) / 3) * 25;
    } else {
      snrScore = Math.max(0, (snr / 2) * 40);
    }

    const healthPct = Math.round(Math.min(100, Math.max(0, rssiScore * 0.7 + snrScore * 0.3)));

    let rating: 'Excellent' | 'Good' | 'Poor' = 'Excellent';
    let color = '#00E676';
    if (rssi > -80) {
      rating = 'Excellent';
      color = '#00E676';
    } else if (rssi >= -90) {
      rating = 'Good';
      color = '#FF9100';
    } else {
      rating = 'Poor';
      color = '#FF1744';
    }

    return { healthPct, rating, color };
  }

  /**
   * Determine Adaptive Mode based on RSSI, SNR, and packet loss
   * GOOD = 500 ms interval
   * MEDIUM = 1000 ms interval
   * POOR = 2000 ms interval
   */
  public calculateAdaptiveMode(rssi: number, snr: number, packetLossPercentage: number = 0): AdaptiveModeInfo {
    let mode: AdaptiveMode = 'GOOD';
    let quality: CommunicationQuality = 'Excellent';
    let intervalMs = 500;
    let intervalStr = '500 ms';
    let color = '#00E676'; // Green
    let badgeBg = 'bg-[#00E676]/15 text-[#00E676]';
    let badgeBorder = 'border-[#00E676]/40';
    let numericVal = 2;

    if (rssi > -80 && snr >= 7 && packetLossPercentage < 5) {
      mode = 'GOOD';
      quality = 'Excellent';
      intervalMs = 500;
      intervalStr = '500 ms';
      color = '#00E676';
      badgeBg = 'bg-[#00E676]/15 text-[#00E676]';
      badgeBorder = 'border-[#00E676]/40';
      numericVal = 2;
    } else if (rssi >= -90 && snr >= 3 && packetLossPercentage < 15) {
      mode = 'MEDIUM';
      quality = 'Moderate';
      intervalMs = 1000;
      intervalStr = '1000 ms';
      color = '#FF9100'; // Orange
      badgeBg = 'bg-[#FF9100]/15 text-[#FF9100]';
      badgeBorder = 'border-[#FF9100]/40';
      numericVal = 1;
    } else {
      mode = 'POOR';
      quality = 'Weak';
      intervalMs = 2000;
      intervalStr = '2000 ms';
      color = '#FF1744'; // Red
      badgeBg = 'bg-[#FF1744]/15 text-[#FF1744]';
      badgeBorder = 'border-[#FF1744]/40';
      numericVal = 0;
    }

    return {
      mode,
      quality,
      intervalMs,
      intervalStr,
      color,
      badgeBg,
      badgeBorder,
      numericVal
    };
  }

  /**
   * Update Adaptive Telemetry state with a new frame
   */
  public updateFrame(frame: TelemetryFrame, stats?: PacketStatistics): { modeInfo: AdaptiveModeInfo; modeChanged: boolean } {
    this.lastEvaluatedFrame = frame;
    const lossPct = stats ? stats.packetLossPercentage : 0;
    const modeInfo = this.calculateAdaptiveMode(frame.rssi, frame.snr, lossPct);
    const modeChanged = this.currentMode !== modeInfo.mode || this.history.length === 0;

    // Track metrics
    this.rssiList.push(frame.rssi);
    this.snrList.push(frame.snr);
    this.intervalList.push(modeInfo.intervalMs);

    // Track duration (assume ~1 frame update interval or time delta)
    if (modeInfo.mode === 'GOOD') this.goodDuration += 1;
    else if (modeInfo.mode === 'MEDIUM') this.mediumDuration += 1;
    else if (modeInfo.mode === 'POOR') this.poorDuration += 1;

    // Add to History line graph
    const timeLabel = frame.timestamp ? frame.timestamp.split('.')[0] : new Date().toLocaleTimeString('en-IN', { hour12: false });
    this.history.push({
      time: timeLabel,
      timestamp: frame.timestamp || timeLabel,
      mode: modeInfo.mode,
      numericMode: modeInfo.numericVal,
      rssi: frame.rssi,
      snr: frame.snr
    });

    if (this.history.length > 300) {
      this.history.shift();
    }

    // If mode changed, log to Adaptive Event Log and trigger Notification
    if (modeChanged) {
      this.currentMode = modeInfo.mode;
      const eventEntry: AdaptiveEventLogEntry = {
        id: `EVT-ADAPT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: frame.timestamp || new Date().toLocaleTimeString('en-IN', { hour12: false }),
        mode: modeInfo.mode,
        recommendedInterval: modeInfo.intervalStr,
        rssi: frame.rssi,
        snr: frame.snr
      };
      this.eventLog.unshift(eventEntry);
      if (this.eventLog.length > 50) this.eventLog.pop();

      // Trigger notification popup item
      this.notifications.unshift({
        id: `NOTIF-${Date.now()}`,
        title: 'Adaptive Telemetry Enabled',
        quality: modeInfo.quality === 'Excellent' ? 'Communication Excellent' : modeInfo.quality === 'Moderate' ? 'Communication Moderate' : 'Weak Communication',
        interval: modeInfo.intervalStr,
        timestamp: frame.timestamp || new Date().toLocaleTimeString('en-IN', { hour12: false })
      });
      if (this.notifications.length > 10) this.notifications.pop();
    }

    return { modeInfo, modeChanged };
  }

  /**
   * Get Adaptive History
   */
  public updateAdaptiveHistory(): AdaptiveHistoryPoint[] {
    return this.history;
  }

  /**
   * Get Adaptive Event Log
   */
  public getEventLog(): AdaptiveEventLogEntry[] {
    return this.eventLog;
  }

  /**
   * Get Recent Notifications
   */
  public getNotifications() {
    return this.notifications;
  }

  /**
   * Clear notifications after display
   */
  public dismissNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
  }

  /**
   * Format seconds to mm:ss format
   */
  private formatDuration(sec: number): string {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}s`;
  }

  /**
   * Generate Adaptive Telemetry Summary
   */
  public generateAdaptiveSummary(stats?: PacketStatistics): AdaptiveTelemetrySummary {
    const totalRssi = this.rssiList.length > 0 ? this.rssiList.reduce((a, b) => a + b, 0) : 0;
    const avgRssi = this.rssiList.length > 0 ? Math.round(totalRssi / this.rssiList.length) : -85;
    const minRssi = this.rssiList.length > 0 ? Math.min(...this.rssiList) : -110;
    const maxRssi = this.rssiList.length > 0 ? Math.max(...this.rssiList) : -65;

    const totalSnr = this.snrList.length > 0 ? this.snrList.reduce((a, b) => a + b, 0) : 0;
    const avgSnr = this.snrList.length > 0 ? parseFloat((totalSnr / this.snrList.length).toFixed(2)) : 8.5;

    const totalInterval = this.intervalList.length > 0 ? this.intervalList.reduce((a, b) => a + b, 0) : 0;
    const avgRecommendedIntervalMs = this.intervalList.length > 0 ? Math.round(totalInterval / this.intervalList.length) : 500;

    return {
      goodDurationSec: this.goodDuration,
      mediumDurationSec: this.mediumDuration,
      poorDurationSec: this.poorDuration,
      goodDurationFormatted: this.formatDuration(this.goodDuration),
      mediumDurationFormatted: this.formatDuration(this.mediumDuration),
      poorDurationFormatted: this.formatDuration(this.poorDuration),
      avgRssi,
      minRssi,
      maxRssi,
      avgSnr,
      avgRecommendedIntervalMs,
      avgRecommendedIntervalStr: `${avgRecommendedIntervalMs} ms`,
      packetLossPercentage: stats ? stats.packetLossPercentage : 0
    };
  }

  /**
   * Reset store counters
   */
  public reset() {
    this.goodDuration = 0;
    this.mediumDuration = 0;
    this.poorDuration = 0;
    this.rssiList = [];
    this.snrList = [];
    this.intervalList = [];
    this.history = [];
    this.eventLog = [];
    this.notifications = [];
    this.currentMode = 'GOOD';
  }
}

export const adaptiveTelemetryModule = new AdaptiveTelemetryModule();
