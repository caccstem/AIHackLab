# HC-SR04 and SG90

`ultrasonic_motor.cpp` implements the sensor, servo, and HTTP handlers.
`iot_demo.cpp` owns the Wi-Fi connection and web server.

## Wiring

| Signal | ESP32 connection |
| --- | --- |
| HC-SR04 TRIG | GPIO 33 |
| HC-SR04 ECHO | GPIO 32 through a voltage divider |
| HC-SR04 VCC | 5 V |
| SG90 signal (usually orange/yellow) | GPIO 25 |
| SG90 power (red) | Suitable regulated external 5 V supply |
| SG90 ground (brown), sensor GND, supply GND | ESP32 GND |

For ECHO, connect ECHO → 1 kΩ → GPIO 32, then GPIO 32 → 2 kΩ → GND.
Do not connect 5 V ECHO directly to the ESP32. Do not power the servo from a
GPIO or the ESP32 3.3 V pin. The SG90 connects directly to its signal and power connections.

## HTTP API

- `GET /getDistance` returns `{"distance_cm":42.5}` or `null` for invalid echo.
- `GET /motorControl?angle=90` commands a servo position.
- `POST /motorControl` accepts form field `angle=0..180`.
- `GET /motorControl?action=stop` (or POST `action=stop`) disables pulses,
  releasing the servo. It does not actively brake or hold the current position.

```sh
curl http://192.168.1.100/getDistance
curl -X POST http://192.168.1.100/motorControl -d 'angle=90'
curl -X POST http://192.168.1.100/motorControl -d 'action=stop'
```

Movement responds with `{"angle":90,"enabled":true}`. Angle is the commanded
position, not measured feedback. The servo starts released. Each HTTP angle request
enables pulses for 1 second, then automatically releases the servo. Another request
starts a new 1-second movement window. Release removes holding torque; the position
may shift under load. This assumes a standard positional SG90, not a continuous-rotation
variant.

The code uses 50 Hz PWM and a configurable 1000–2000 µs pulse range, with 1500 µs
at angle 90. Actual travel varies; calibrate `MIN_PULSE_US`/`MAX_PULSE_US` carefully
for your servo and mechanism rather than assuming exact 180-degree travel.
Reference: [TowerPro SG90 datasheet](https://www.mikroprinc.com/uploads/store/products/pdf/SG90Servo_pdf5b57081c57730.pdf).
PWM channel 2 keeps the servo timer separate from the existing buzzer channel 0.

## Build and hardware API

Set Wi-Fi credentials in `iot_demo.cpp`, then run:

```sh
pio run -e esp32dev
pio run -e esp32dev -t upload
pio device monitor -b 115200
```

Use the IP printed in Serial Monitor. Module functions are
`UltrasonicMotor::begin()`, `readDistanceCm()`, `setServoAngle(angle)`,
`releaseServo()`, `servoAngle()`, and `isServoEnabled()`.
Distance reads within 60 ms reuse the last sample; echo timeout is 25 ms.
