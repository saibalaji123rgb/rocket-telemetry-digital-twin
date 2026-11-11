import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// SQLite Database Setup
const dbPath = path.join(__dirname, 'rocket_mission_control.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite Mission Control database at', dbPath);
    initDb();
  }
});

function initDb() {
  db.run(`
    CREATE TABLE IF NOT EXISTS missions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      operator TEXT NOT NULL,
      type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      duration_sec INTEGER DEFAULT 0,
      max_altitude REAL DEFAULT 0,
      max_speed REAL DEFAULT 0,
      total_packets INTEGER DEFAULT 0,
      lost_packets INTEGER DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS telemetry_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mission_id TEXT,
      packet_id INTEGER,
      latitude REAL,
      longitude REAL,
      roll REAL,
      pitch REAL,
      yaw REAL,
      speed REAL,
      temperature REAL,
      pressure REAL,
      altitude REAL,
      vibration INTEGER,
      satellites INTEGER,
      rssi INTEGER,
      snr REAL,
      timestamp TEXT,
      FOREIGN KEY (mission_id) REFERENCES missions(id)
    )
  `);
}

// REST Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ONLINE', timestamp: new Date().toISOString() });
});

// Start mission session
app.post('/api/missions/start', (req, res) => {
  const { missionId, missionName, operatorName, missionType } = req.body;
  const id = missionId || `MIS-${Date.now()}`;
  
  db.run(
    `INSERT OR REPLACE INTO missions (id, name, operator, type) VALUES (?, ?, ?, ?)`,
    [id, missionName || 'DEFAULT MISSION', operatorName || 'FLIGHT DIRECTOR', missionType || 'ORBITAL'],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, missionId: id });
    }
  );
});

// Save batch of telemetry frames
app.post('/api/telemetry/batch', (req, res) => {
  const { missionId, frames } = req.body;
  if (!frames || !Array.isArray(frames)) {
    return res.status(400).json({ error: 'Frames array required' });
  }

  const stmt = db.prepare(`
    INSERT INTO telemetry_logs (
      mission_id, packet_id, latitude, longitude, roll, pitch, yaw, speed,
      temperature, pressure, altitude, vibration, satellites, rssi, snr, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.serialize(() => {
    frames.forEach((f) => {
      stmt.run([
        missionId, f.packetId, f.latitude, f.longitude, f.roll, f.pitch, f.yaw || 0, f.speed,
        f.temperature, f.pressure, f.altitude, f.vibration, f.satellites, f.rssi, f.snr, f.timestamp
      ]);
    });
    stmt.finalize();
  });

  res.json({ success: true, count: frames.length });
});

// Get mission logs for post mission replay
app.get('/api/missions/:id/logs', (req, res) => {
  const missionId = req.params.id;
  db.all(
    `SELECT * FROM telemetry_logs WHERE mission_id = ? ORDER BY packet_id ASC`,
    [missionId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, logs: rows });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Mission Control Backend API listening on port ${PORT}`);
});
