# ESP32 IoT Demo API

Standalone Arduino firmware for an ESP32 with a **MAX4466 analog microphone breakout**. The ESP32 runs a small REST-style IoT demo API on the local Wi-Fi network, including a live reading at `http://esp32-1.local/loudness` and the control dashboard at `http://esp32-1.local/options`.

## Hardware assumptions

- A classic ESP32 DevKit/WROOM board, using ADC pin GPIO34 by default.
- A MAX4466 microphone amplifier breakout wired as follows:
	- `VCC` → ESP32 `3V3`
	- `GND` → ESP32 `GND`
	- `OUT` → ESP32 GPIO34
- Power the breakout from 3.3 V so its output stays within the ESP32 ADC input range. Do not connect a 5 V output directly.
- Connect four LEDs, each with a 220–330 Ω series resistor and a shared GND: yellow to GPIO18, blue to GPIO2, green to GPIO19, and red to GPIO21. GPIO2 may be the board's built-in LED on some ESP32 boards. The selected pins and active-high behavior are configured in the `leds` array in the sketch.
- Digital-only sound sensors and I2S microphones need different firmware/wiring.

If your board uses a different ADC1 pin, change `MIC_PIN` in `esp32-loudness.ino`. Avoid ADC2 pins while Wi-Fi is enabled.

## Configure and upload

1. Open `esp32-loudness.ino` in Arduino IDE and select an ESP32 board.
2. Copy `secrets.example.h` to `secrets.h` in this folder. The SSID is already set to `aihacklab-2.4`; enter that Wi-Fi network's password in `secrets.h`. `secrets.h` is git-ignored.
3. Connect the analog microphone output and upload the sketch.
4. Connect both the ESP32 and your computer to `aihacklab-2.4`. Then open `http://esp32-1.local/options` for the control dashboard. The ESP32 must join the same Wi-Fi using the SSID and password configured in `secrets.h`.

The device uses mDNS to advertise `esp32-1.local`. If mDNS is unavailable on your network, use the IP address printed in the serial monitor instead.

## API

- `GET /` — API name and endpoint list.
- `GET /options` — strawberry-themed control page with five cat buttons.
- `GET /health` — device status, local IP, and uptime.
- `GET /loudness` — samples the microphone on every request and returns JSON with the level label, RMS ADC counts, relative full-scale percentage, relative dBFS, and uptime.
- `GET /api/state` — reports the commanded state of all four LEDs.
- `POST /api/led/yellow/toggle`, `/api/led/blue/toggle`, `/api/led/green/toggle`, `/api/led/red/toggle` — toggles that LED and returns all LED states.
- `GET /api/temperature` — reads the ESP32's internal chip-temperature sensor, in Celsius and Fahrenheit.
- `GET /blue_light`, `/blue_light/on`, `/blue_light/off` — backward-compatible blue LED status/on/off routes.

The API enables CORS for browser-based demos. Example response from `/loudness`:

```json
{
	"device": "32-1",
	"sensor": "MAX4466",
	"measurement": "relative_rms",
	"level": "moderate",
	"relative_percent": 3.4,
	"rms_adc_counts": 69.6,
	"relative_dbfs": -29.4,
	"calibrated_spl": false,
	"uptime_ms": 123456
}
```

The loudness values are **relative**: the MAX4466 gain setting affects them. They are not calibrated sound-pressure readings in dB SPL. The temperature button reads the ESP32's chip temperature, not room temperature; it is not an ambient-temperature sensor. The API has no authentication, so keep it on a trusted local network rather than exposing it directly to the internet.
