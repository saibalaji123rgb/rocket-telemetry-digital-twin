# Project notes

## Included subsystems

- ESP32 transmitter firmware for GPS, BMP280, MPU6050, vibration input, OLED status, and LoRa transmission.
- LoRa receiver firmware with RSSI/SNR serial forwarding.
- React/TypeScript ground-station dashboard with a 3D rocket model, telemetry plots, health/status cards, adaptive telemetry and reliability modules.
- Express API and SQLite schema for mission metadata and telemetry logs.

## Known items to validate

1. Align the firmware packet field order/count with `ground-station/src/services/PacketParser.ts`.
2. Test receiver serial output against the dashboard over Web Serial at the selected baud rate.
3. Verify the sensor addresses, ESP32 pins, LoRa modules, antenna and regional radio compliance on the actual hardware.
4. Replace demonstration-only login behavior with proper authentication before any deployment.
5. Test the backend API and persistence with real mission frames; the supplied SQLite file was empty and has been left out because the server creates its database at runtime.
