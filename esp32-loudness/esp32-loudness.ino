#include <Arduino.h>
#include <ESPmDNS.h>
#include <WebServer.h>
#include <WiFi.h>
#include <math.h>

#include "secrets.h"

namespace {
constexpr char HOSTNAME[] = "32-1";
constexpr uint8_t MIC_PIN = 34;  // Default for a classic ESP32 DevKit/WROOM.
constexpr size_t SAMPLE_COUNT = 2048;
constexpr uint16_t SAMPLE_INTERVAL_US = 125;

struct LedControl {
  const char* color;
  uint8_t pin;
  bool isOn;
  bool activeLow;
};

LedControl leds[] = {
  {"yellow", 18, false, false},
  {"blue", 2, false, false},
  {"green", 19, false, false},
  {"red", 21, false, false}
};

WebServer server(80);

const char OPTIONS_PAGE[] PROGMEM = R"rawliteral(
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#ffe7ef">
  <title>Berry Kitty Control Room</title>
  <style>
    :root { color-scheme: light; font-family: ui-rounded, "Trebuchet MS", system-ui, sans-serif; color: #593b4a; }
    * { box-sizing: border-box; }
    body {
      min-height: 100vh; margin: 0; padding: 34px 18px 48px;
      background-color: #ffe7ef;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='74' height='82' viewBox='0 0 74 82'%3E%3Cg transform='translate(13 14)'%3E%3Cpath d='M13 11C5 6 4 16 11 17C5 22 11 28 16 23C22 28 28 21 21 17C28 14 23 6 17 11Z' fill='%23f07189'/%3E%3Cpath d='M11 12Q15 3 19 12Q15 9 11 12' fill='%2363aa72'/%3E%3Ccircle cx='12' cy='17' r='1' fill='%23fff4c2'/%3E%3Ccircle cx='17' cy='20' r='1' fill='%23fff4c2'/%3E%3Ccircle cx='20' cy='15' r='1' fill='%23fff4c2'/%3E%3C/g%3E%3C/svg%3E");
      background-repeat: repeat;
    }
    main { max-width: 840px; margin: 0 auto; }
    .card { padding: clamp(22px, 5vw, 42px); border: 2px solid #fff8fa; border-radius: 30px; background: rgba(255,250,251,.93); box-shadow: 0 18px 55px #a84e6422; }
    header { text-align: center; margin-bottom: 28px; }
    .eyebrow { color: #d65b78; font-size: .76rem; font-weight: 900; letter-spacing: .18em; text-transform: uppercase; }
    h1 { margin: 7px 0 8px; color: #723e56; font-size: clamp(2rem, 7vw, 3.3rem); line-height: 1; }
    header p { margin: 0; color: #936f7e; }
    .controls { display: grid; grid-template-columns: repeat(auto-fit, minmax(145px, 1fr)); gap: 16px; }
    .control { padding: 18px 10px 14px; text-align: center; border-radius: 22px; background: #fff; box-shadow: 0 5px 18px #81485a12; }
    .cat-button { --fur: #f3c6aa; position: relative; isolation: isolate; display: grid; place-items: center; width: 104px; height: 92px; margin: 12px auto 10px; border: 0; border-radius: 46% 46% 48% 48%; background: var(--fur); cursor: pointer; box-shadow: inset 0 -7px 0 #00000012, 0 5px 0 #00000014; transition: transform .14s ease, filter .14s ease; }
    .cat-button:hover { transform: translateY(-3px); filter: saturate(1.08); }
    .cat-button:active { transform: translateY(2px); box-shadow: inset 0 -3px 0 #00000012, 0 2px 0 #00000014; }
    .cat-button:focus-visible { outline: 4px solid #75435c; outline-offset: 4px; }
    .cat-button::before, .cat-button::after { content: ""; position: absolute; z-index: -1; top: -7px; width: 37px; height: 42px; background: var(--fur); }
    .cat-button::before { left: 7px; clip-path: polygon(0 0,100% 35%,75% 100%,14% 77%); transform: rotate(-8deg); }
    .cat-button::after { right: 7px; clip-path: polygon(0 35%,100% 0,86% 77%,25% 100%); transform: rotate(8deg); }
    .cat-face { position: relative; width: 100%; color: #543342; font-size: 21px; font-weight: 900; line-height: 1; }
    .cat-face::before { content: "•       •"; display: block; white-space: pre; }
    .cat-face::after { content: "⌁  ᴗ  ⌁"; display: block; margin-top: 6px; font-size: 14px; white-space: pre; }
    .yellow { --fur: #ffd957; } .blue { --fur: #69c9f4; } .green { --fur: #75d69a; } .red { --fur: #ff858d; } .purple { --fur: #c69af4; }
    .purple .cat-face::before { content: "•       •"; }
    .control h2 { margin: 3px 0 2px; font-size: 1rem; text-transform: capitalize; }
    .status { margin: 0; color: #806573; font-size: .91rem; }
    .status strong { color: #4e8b5b; text-transform: uppercase; }
    .status strong.off { color: #a48290; }
    .temperature { min-height: 1.4em; color: #75508d; font-weight: 750; }
    .note { margin: 24px 0 0; text-align: center; color: #967989; font-size: .83rem; }
    #connection { min-height: 1.4em; margin: 15px 0 0; color: #a64d68; text-align: center; font-size: .9rem; }
    @media (max-width: 420px) { .controls { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; } .control:last-child { grid-column: 1 / -1; } }
    @media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition: none !important; } }
  </style>
</head>
<body>
  <main>
    <section class="card" aria-labelledby="title">
      <header><div class="eyebrow">ESP32 IoT Demo API</div><h1 id="title">Berry Kitty Controls</h1><p>Tap a kitty to toggle its light. Ask the purple kitty for a temperature check.</p></header>
      <div class="controls">
        <article class="control"><button class="cat-button yellow" type="button" data-led="yellow" aria-label="Toggle yellow light"><span class="cat-face" aria-hidden="true"></span></button><h2>Yellow</h2><p class="status">Yellow: <strong id="yellow-status" class="off">off</strong></p></article>
        <article class="control"><button class="cat-button blue" type="button" data-led="blue" aria-label="Toggle blue light"><span class="cat-face" aria-hidden="true"></span></button><h2>Blue</h2><p class="status">Blue: <strong id="blue-status" class="off">off</strong></p></article>
        <article class="control"><button class="cat-button green" type="button" data-led="green" aria-label="Toggle green light"><span class="cat-face" aria-hidden="true"></span></button><h2>Green</h2><p class="status">Green: <strong id="green-status" class="off">off</strong></p></article>
        <article class="control"><button class="cat-button red" type="button" data-led="red" aria-label="Toggle red light"><span class="cat-face" aria-hidden="true"></span></button><h2>Red</h2><p class="status">Red: <strong id="red-status" class="off">off</strong></p></article>
        <article class="control"><button class="cat-button purple" id="temperature-button" type="button" aria-label="Measure ESP32 temperature"><span class="cat-face" aria-hidden="true"></span></button><h2>Temperature</h2><p class="status">ESP32 chip sensor</p><p class="temperature" id="temperature">Not measured</p></article>
      </div>
      <p id="connection" role="status" aria-live="polite">Connecting to ESP32…</p>
      <p class="note">Temperature is the ESP32 chip temperature, not room temperature. LED states show the API's current commanded state.</p>
    </section>
  </main>
  <script>
    const connection = document.querySelector('#connection');
    function showLed(color, isOn) {
      const label = document.querySelector(`#${color}-status`);
      label.textContent = isOn ? 'on' : 'off';
      label.classList.toggle('off', !isOn);
    }
    async function loadState() {
      const response = await fetch('/api/state', { cache: 'no-store' });
      if (!response.ok) throw new Error('Could not read device state');
      const state = await response.json();
      Object.entries(state.leds).forEach(([color, isOn]) => showLed(color, isOn));
      connection.textContent = 'Connected to 32-1';
    }
    document.querySelectorAll('[data-led]').forEach((button) => {
      button.addEventListener('click', async () => {
        button.disabled = true;
        try {
          const response = await fetch(`/api/led/${button.dataset.led}/toggle`, { method: 'POST', cache: 'no-store' });
          if (!response.ok) throw new Error('Toggle request failed');
          const state = await response.json();
          Object.entries(state.leds).forEach(([color, isOn]) => showLed(color, isOn));
          connection.textContent = 'Light toggled';
        } catch (error) { connection.textContent = 'Could not reach ESP32. Check Wi-Fi and reload.'; }
        finally { button.disabled = false; }
      });
    });
    document.querySelector('#temperature-button').addEventListener('click', async () => {
      const button = document.querySelector('#temperature-button');
      const display = document.querySelector('#temperature');
      button.disabled = true; display.textContent = 'Measuring…';
      try {
        const response = await fetch('/api/temperature', { cache: 'no-store' });
        if (!response.ok) throw new Error('Temperature request failed');
        const reading = await response.json();
        display.textContent = `${reading.temperature_c.toFixed(1)} °C / ${reading.temperature_f.toFixed(1)} °F`;
        connection.textContent = 'Temperature measured';
      } catch (error) { display.textContent = 'Measurement unavailable'; connection.textContent = 'Could not read ESP32 temperature.'; }
      finally { button.disabled = false; }
    });
    loadState().catch(() => { connection.textContent = 'Could not reach ESP32. Check Wi-Fi and reload.'; });
  </script>
</body>
</html>
)rawliteral";

float sampleRms() {
  double sum = 0;
  double sumSquares = 0;

  for (size_t i = 0; i < SAMPLE_COUNT; ++i) {
    const int sample = analogRead(MIC_PIN);
    sum += sample;
    sumSquares += static_cast<double>(sample) * sample;
    delayMicroseconds(SAMPLE_INTERVAL_US);
  }

  const double mean = sum / SAMPLE_COUNT;
  const double variance = max(0.0, sumSquares / SAMPLE_COUNT - mean * mean);
  return static_cast<float>(sqrt(variance));
}

const char* describeLevel(float percent) {
  if (percent < 2.0f) return "quiet";
  if (percent < 8.0f) return "moderate";
  if (percent < 20.0f) return "loud";
  return "very loud";
}

void sendJson(int statusCode, const String& body) {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.sendHeader("Cache-Control", "no-store");
  server.send(statusCode, "application/json; charset=utf-8", body);
}

void setLed(uint8_t index, bool isOn) {
  leds[index].isOn = isOn;
  const uint8_t outputLevel = isOn != leds[index].activeLow ? HIGH : LOW;
  digitalWrite(leds[index].pin, outputLevel);
}

void sendLedState() {
  String result = "{\"device\":\"32-1\",\"leds\":{";
  for (size_t i = 0; i < sizeof(leds) / sizeof(leds[0]); ++i) {
    if (i > 0) result += ",";
    result += "\"";
    result += leds[i].color;
    result += "\":";
    result += leds[i].isOn ? "true" : "false";
  }
  result += "}}";
  sendJson(200, result);
}

void handleOptionsPage() {
  server.sendHeader("Cache-Control", "no-store");
  server.send_P(200, "text/html; charset=utf-8", OPTIONS_PAGE);
}

void handleApiInfo() {
  sendJson(200,
    "{\"name\":\"ESP32 IoT Demo API\",\"device\":\"32-1\","
    "\"dashboard\":\"/options\",\"endpoints\":[\"/health\",\"/loudness\","
    "\"/api/state\",\"/api/led/{color}/toggle\",\"/api/temperature\"]}");
}

void handleHealth() {
  String result = "{\"status\":\"ok\",\"device\":\"32-1\",\"ip\":\"";
  result += WiFi.localIP().toString();
  result += "\",\"uptime_ms\":";
  result += String(millis());
  result += "}";
  sendJson(200, result);
}

void handleLoudness() {
  const float rms = sampleRms();
  const float percent = min(100.0f, rms / 2047.5f * 100.0f);
  const float dbfs = 20.0f * log10f(max(rms, 0.01f) / 2047.5f);

  String result = "{\"device\":\"32-1\",\"sensor\":\"MAX4466\",\"measurement\":\"relative_rms\",\"level\":\"";
  result += describeLevel(percent);
  result += "\",\"relative_percent\":";
  result += String(percent, 1);
  result += ",\"rms_adc_counts\":";
  result += String(rms, 1);
  result += ",\"relative_dbfs\":";
  result += String(dbfs, 1);
  result += ",\"calibrated_spl\":false,\"uptime_ms\":";
  result += String(millis());
  result += "}";
  sendJson(200, result);
}

void handleBlueLightStatus() {
  String result = "{\"device\":\"32-1\",\"blue_light\":\"";
  result += leds[1].isOn ? "on" : "off";
  result += "\",\"gpio\":";
  result += String(leds[1].pin);
  result += "}";
  sendJson(200, result);
}

void handleBlueLightOn() {
  setLed(1, true);
  handleBlueLightStatus();
}

void handleBlueLightOff() {
  setLed(1, false);
  handleBlueLightStatus();
}

void handleLedToggle(uint8_t index) {
  setLed(index, !leds[index].isOn);
  sendLedState();
}

void handleYellowToggle() { handleLedToggle(0); }
void handleBlueToggle() { handleLedToggle(1); }
void handleGreenToggle() { handleLedToggle(2); }
void handleRedToggle() { handleLedToggle(3); }

void handleLedState() {
  sendLedState();
}

void handleTemperature() {
  const float temperatureC = temperatureRead();
  if (!isfinite(temperatureC)) {
    sendJson(503, "{\"error\":\"temperature_unavailable\"}");
    return;
  }

  String result = "{\"device\":\"32-1\",\"sensor\":\"ESP32_internal_chip_sensor\",\"temperature_c\":";
  result += String(temperatureC, 1);
  result += ",\"temperature_f\":";
  result += String(temperatureC * 9.0f / 5.0f + 32.0f, 1);
  result += ",\"ambient_temperature\":false}";
  sendJson(200, result);
}

void handleOptions() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.send(204);
}

void handleNotFound() {
  sendJson(404, "{\"error\":\"not_found\",\"message\":\"Try /options\"}");
}
}  // namespace

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);
  analogSetPinAttenuation(MIC_PIN, ADC_11db);
  for (size_t i = 0; i < sizeof(leds) / sizeof(leds[0]); ++i) {
    pinMode(leds[i].pin, OUTPUT);
    setLed(i, false);
  }

  WiFi.setHostname(HOSTNAME);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print('.');
  }

  Serial.println();
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  if (!MDNS.begin(HOSTNAME)) {
    Serial.println("mDNS startup failed; the device is still available by IP address.");
  } else {
    MDNS.addService("http", "tcp", 80);
    Serial.println("Open http://esp32-1.local/options");
  }

  server.on("/", HTTP_GET, handleApiInfo);
  server.on("/options", HTTP_GET, handleOptionsPage);
  server.on("/health", HTTP_GET, handleHealth);
  server.on("/loudness", HTTP_GET, handleLoudness);
  server.on("/api/state", HTTP_GET, handleLedState);
  server.on("/api/led/yellow/toggle", HTTP_POST, handleYellowToggle);
  server.on("/api/led/blue/toggle", HTTP_POST, handleBlueToggle);
  server.on("/api/led/green/toggle", HTTP_POST, handleGreenToggle);
  server.on("/api/led/red/toggle", HTTP_POST, handleRedToggle);
  server.on("/api/temperature", HTTP_GET, handleTemperature);
  server.on("/blue_light", HTTP_GET, handleBlueLightStatus);
  server.on("/blue_light/on", HTTP_GET, handleBlueLightOn);
  server.on("/blue_light/off", HTTP_GET, handleBlueLightOff);
  server.on("/", HTTP_OPTIONS, handleOptions);
  server.on("/options", HTTP_OPTIONS, handleOptions);
  server.on("/health", HTTP_OPTIONS, handleOptions);
  server.on("/loudness", HTTP_OPTIONS, handleOptions);
  server.on("/api/state", HTTP_OPTIONS, handleOptions);
  server.on("/api/led/yellow/toggle", HTTP_OPTIONS, handleOptions);
  server.on("/api/led/blue/toggle", HTTP_OPTIONS, handleOptions);
  server.on("/api/led/green/toggle", HTTP_OPTIONS, handleOptions);
  server.on("/api/led/red/toggle", HTTP_OPTIONS, handleOptions);
  server.on("/api/temperature", HTTP_OPTIONS, handleOptions);
  server.on("/blue_light", HTTP_OPTIONS, handleOptions);
  server.on("/blue_light/on", HTTP_OPTIONS, handleOptions);
  server.on("/blue_light/off", HTTP_OPTIONS, handleOptions);
  server.onNotFound(handleNotFound);
  server.begin();
}

void loop() {
  server.handleClient();
}
