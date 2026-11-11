# Firmware notes

- `transmitter/Rocket_tx.ino`: ESP32-side sensor acquisition, OLED output, USB serial output, and LoRa transmit.
- `receiver/rocket_rx.ino`: LoRa packet receiver; prints packet payload plus RSSI and SNR over USB serial.

The transmitter pin assignments and radio parameters are documented in the root README. The telemetry frame schema currently differs from the dashboard parser; see **Important integration checks** in the root README before testing the live dashboard.
