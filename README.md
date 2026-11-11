# Digital Twin-Based Rocket Telemetry and Mission Control System

An engineering prototype combining an ESP32/LoRa telemetry link, a browser-based ground station, and a 3D rocket digital-twin dashboard. The repository contains the firmware sketches, React/TypeScript application, lightweight Express/SQLite backend, and selected hardware/dashboard evidence.

> **Prototype notice:** This repository is for academic development and demonstration. It is not flight-certified and must not be used as the sole source for safety-critical or real-flight decisions.

## System overview

```text
ESP32 transmitter
  ├─ GPS receiver
  ├─ BMP280 pressure / temperature sensor
  ├─ MPU6050 orientation sensor
  ├─ vibration input
  ├─ OLED status display
  └─ SX127x LoRa radio (433 MHz settings in firmware)
          │
          │ LoRa packet
          ▼
ESP32 LoRa receiver ── USB serial ── Ground-station browser
                                      ├─ Live telemetry interface
                                      ├─ 3D rocket digital twin
                                      ├─ charts, status and alerts
                                      ├─ adaptive telemetry / reliability views
                                      └─ mission analysis views

Ground-station backend (optional)
  └─ Express API + SQLite mission / telemetry storage
```

The dashboard source includes views and services for live telemetry, digital-twin visualization, map tracking, alerts, system status, mission statistics, energy optimization, adaptive telemetry monitoring, and a Mission Reliability Score (MRS). The dashboard can also be explored in its simulated/demo mode.

## Repository structure

```text
firmware/
  transmitter/Rocket_tx.ino       # Sensor readout, OLED and LoRa transmission
  receiver/rocket_rx.ino          # LoRa reception and serial forwarding
ground-station/
  src/                            # React + TypeScript user interface
  server/index.js                 # Express API and SQLite initialization
  package.json                    # Frontend/backend dependencies and scripts
  package-lock.json
  tools/capture-dashboard-screenshot.js
docs/
  hardware/                       # Selected prototype and wiring photos
  screenshots/                    # Curated dashboard screenshots; exact duplicates removed
```

## Hardware firmware

### Transmitter

The transmitter sketch is written for an ESP32-style board and uses the following pin assignments from the source: LoRa `SS=5`, `RST=14`, `DIO0=2`; GPS UART `RX=16`, `TX=17`; I²C `SDA=21`, `SCL=22`; vibration input `27`. The GPS UART is configured for 9600 baud. The USB serial output is configured for 115200 baud. LoRa is configured at 433 MHz with spreading factor 9, 125 kHz bandwidth, coding rate 4/5, and CRC enabled.

Libraries referenced by the sketch:

- LoRa
- TinyGPS++
- Adafruit GFX Library
- Adafruit SSD1306
- Adafruit BMP280 Library
- MPU6050-compatible library exposing `MPU6050.h`

Install the ESP32 board support package and the compatible libraries in Arduino IDE, select the correct board and port, then open `firmware/transmitter/Rocket_tx.ino`. Verify the exact module pinout and sensor addresses against your physical wiring before powering the hardware.

### Receiver

Open `firmware/receiver/rocket_rx.ino` in Arduino IDE, install the LoRa library, select the receiver board and upload. The receiver is configured for 433 MHz, spreading factor 9, 125 kHz bandwidth, coding rate 4/5, and CRC. Its serial output appends RSSI and SNR to each received LoRa payload.

## Ground station

Requirements: Node.js (use a current LTS release) and npm.

From the `ground-station` directory:

```bash
npm install
npm run dev
```

Open the Vite development URL shown in the terminal (the project config uses port `3000`). For the optional backend, open a second terminal in `ground-station` and run:

```bash
npm run server
```

The Express service listens on port `5000` by default. It creates `server/rocket_mission_control.db` automatically when started; this runtime database is intentionally not committed.

The browser ground station uses the Web Serial API to connect to a USB serial receiver. Use a compatible browser such as Chrome or Edge, grant access to the correct serial port, and check that the receiver baud rate matches the dashboard connection setting (115200 baud by default).

## Important integration checks

The included firmware and dashboard parser are not yet field-aligned: the transmitter currently emits a 10-field serial line; the LoRa receiver appends RSSI and SNR, producing 12 fields; `src/services/PacketParser.ts` currently expects at least 13 fields and expects a `speed` value in position 6. Reconcile the packet schema and update both sides consistently before treating hardware-to-dashboard telemetry as integrated. This repository preserves the supplied source rather than silently changing its protocol.

The login screen is a visual demonstration only: the current front-end accepts any non-empty passcode, and the main app initializes in an authenticated state. It is not real authentication or AES-256 security. Do not expose the backend publicly or use this screen as an access-control system without implementing proper server-side authentication and transport security.

## Publishing

See [`PUBLISH_TO_GITHUB.md`](PUBLISH_TO_GITHUB.md) for Windows steps to create a new repository and push this prepared project.

## Evidence

Selected prototype photos are in `docs/hardware/`. Dashboard screenshots are organized under `docs/screenshots/` by capture date. Repeated byte-identical copies, an alternate duplicate dashboard export, dependency folders, generated build output, and an empty local SQLite database have been excluded.

## Current status

This repository is an organized snapshot of the supplied project files. The source has not been modified to resolve the packet-format mismatch, and a clean dependency install/build has not been run as part of this packaging step. Please validate the firmware on the target boards and run `npm run build` after installing dependencies.
