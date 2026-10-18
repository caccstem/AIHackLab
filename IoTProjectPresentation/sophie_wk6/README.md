# Luma — ESP32 control room

Start the included local gateway (Python 3, no extra packages):

```sh
cd /Users/sophiesim/ai_hacklab/AIHackLab/week6/sophie_wk6
python3 server.py
```

Open http://localhost:8000, then connect to the IoT Wi-Fi. Keep the terminal running. Use this address instead of Live Server or opening index.html directly. Internet access is not needed. Ctrl+C stops the server.

The browser communicates with this local server, which forwards requests to the boards. This avoids cross-origin browser requests to the ESP32s without firmware changes. The page now makes real device requests; there is no simulated data.

## Configuration

`server.py` defines the three board URLs in `BOARDS`. Currently assumed:
- http://esp32-1.local
- http://esp32-2.local
- http://esp32-3.local

If boards 2 and 3 use bare hostnames, edit their URLs in `BOARDS`.

The server forwards these routes to the boards using GET (browser light commands use POST to the local server):
- /temperature
- /humidity
- /red_light/on and /red_light/off
- The same light routes for yellow, blue, and green.

Board 1’s red on/off routes and JSON sensor formats were confirmed by the user. The .local suffix for boards 2 and 3 still awaits confirmation. Sensor parsing supports numeric text (24.2), optional °C or % units, JSON numbers, and objects such as {"temperature":24.2}, {"humidity":48}, or {"value":24.2}. Other formats produce an error rather than a fabricated reading. Temperature is assumed Celsius; humidity must be 0–100%.

## Behavior

Sensor polling repeats five seconds after each check, with a four-second upstream socket timeout and ten-second browser timeout. Failed boards show unavailable readings and are excluded from averages. History contains the last 24 successful temperature samples; gaps during outages are not represented as elapsed time.

No light requests are sent on startup or by polling. Light controls send commands only on a user click. Indicators show the last successful HTTP command, not hardware feedback, because no light-status endpoint was provided. Unknown is represented by a dashed switch. Clicking an unknown light requests ON; All lights off requests OFF for all twelve lights. Every light is attempted even if another command fails. Failed commands return their indicator to Unknown, since the board may have acted before the response failed. Reloading clears command history without changing hardware.

## Connection troubleshooting

First open http://esp32-1.local/temperature in your browser. If that fails, check the board power, hostname, and shared network. If it works directly but the dashboard fails, check that you opened http://localhost:8000 with server.py running, and inspect the error on the board card. The local gateway bypasses browser CORS requirements on the boards. It listens only on your computer, forwards only the listed routes, and does not send light commands on startup.

CORS reference: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS

Hardware could not be verified during development: esp32-1.local did not resolve. Request routes and response parsing were checked using mocked responses; no real light commands were sent during testing.
