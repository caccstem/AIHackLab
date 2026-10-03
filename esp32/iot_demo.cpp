#include <WiFi.h>
#include <WebServer.h>
#include <DHT.h>
#include <ESPmDNS.h>

// Change to your board's built-in LED pin (often 2 for standard ESP32 dev boards)
#ifndef LED_BUILTIN
#define LED_BUILTIN 2
#endif

#define DHT11PIN 15
#define LED_RED_PIN 5
#define LED_YELLOW_PIN 18
#define LED_BLUE_PIN 19
#define LED_GREEN_PIN 21
#define BUZZER_PIN 4

DHT dht(DHT11PIN, DHT11);

// Instantiate the web server on port 80
WebServer server(80);

// Replace with your network credentials
// Only supports 2.4 GHz Wi-Fi networks, not 5 GHz
const char* ssid = "AiHacklab-2.4";
const char* password = "cacc2026";

const char* host = "esp32-1"; // Hostname for mDNS


// Base Tempo Calculation (120 BPM)
const int QUARTER_NOTE = 500; 
const int EIGHTH_NOTE = 250;
const int HALF_NOTE = 1000;
const int DOT_QUARTER_NOTE = 750; // 1.5x a quarter note

// Note Frequencies (Hz)
#define NOTE_C4  262
#define NOTE_CS4 277  // C#4/Db4
#define NOTE_D4  294
#define NOTE_DS4 311  // D#4/Eb4 <-- Fixed name from ES4 to DS4
#define NOTE_E4  330
#define NOTE_F4  349
#define NOTE_FS4 370  // F#4/Gb4
#define NOTE_G4  392
#define NOTE_GS4 415  // G#4/Ab4
#define NOTE_A4  440
#define NOTE_AS4 466  // A#4/Bb4
#define NOTE_B4  494
#define NOTE_C5  523

// Melody array
int melody[] = {
  NOTE_C4, NOTE_C4, NOTE_D4, NOTE_C4, NOTE_F4, NOTE_E4,     // Happy birthday to you
  NOTE_C4, NOTE_C4, NOTE_D4, NOTE_C4, NOTE_G4, NOTE_F4,     // Happy birthday to you
  NOTE_C4, NOTE_C4, NOTE_C5, NOTE_A4, NOTE_F4, NOTE_E4, NOTE_D4, // Happy birthday dear [Name]
  NOTE_AS4, NOTE_AS4, NOTE_A4, NOTE_F4, NOTE_G4, NOTE_F4    // Happy birthday to you
};

// Durations array (in milliseconds)
int durations[] = {
  EIGHTH_NOTE, EIGHTH_NOTE, QUARTER_NOTE, QUARTER_NOTE, QUARTER_NOTE, HALF_NOTE,
  EIGHTH_NOTE, EIGHTH_NOTE, QUARTER_NOTE, QUARTER_NOTE, QUARTER_NOTE, HALF_NOTE,
  EIGHTH_NOTE, EIGHTH_NOTE, QUARTER_NOTE, QUARTER_NOTE, QUARTER_NOTE, QUARTER_NOTE, QUARTER_NOTE,
  EIGHTH_NOTE, EIGHTH_NOTE, QUARTER_NOTE, QUARTER_NOTE, QUARTER_NOTE, HALF_NOTE
};

void playHappyBirthday() {
  int totalNotes = sizeof(melody) / sizeof(melody[0]);
  
  for (int i = 0; i < totalNotes; i++) {
    int noteFrequency = melody[i];
    int noteDuration = durations[i];
    
    tone(BUZZER_PIN, noteFrequency); // Turn on buzzer with the specified frequency
    delay(noteDuration);
    
    // Turn off tone (0 duty cycle)
    noTone(BUZZER_PIN); // Turn off buzzer
    
    // Tiny pause between notes to avoid them bleeding together
    delay(noteDuration * 0.1); 
  }
  server.send(200, "text/plain", "Played Happy Birthday melody.");
}


// Function handled when accessing the root IP address "/"
void handleRoot() {
  String html = "<!DOCTYPE html><html>";
  html += "<head><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" charset=\"UTF-8\">";
  html += "<style>html { font-family: Arial; text-align: center; margin:0px auto;} ";
  html += ".button {background-color: #555555; border: none; color: white; padding: 16px 40px; text-decoration: none; font-size: 30px; margin: 2px; cursor: pointer; }";
  html += ".button_red { background-color: #d82818; }";
  html += ".button_yellow { background-color: #e4ec08; }";
  html += ".button_blue { background-color: #1919d4; }";
  html += ".button_green { background-color: #24db2a; }";
  html += "</style><title>ESP32 Web Server</title></head>";
  html += "<body><h1>ESP32 Web Server</h1>";
  
  // Dynamic button based on current red LED state
  if (digitalRead(LED_RED_PIN) == HIGH) {
    html += "<p>Red LED Status: ON</p><p><a href=\"/red_light/off?redirect=true\"><button class=\"button button_red\">TURN OFF</button></a></p>";
  } else {
    html += "<p>Red LED Status: OFF</p><p><a href=\"/red_light/on?redirect=true\"><button class=\"button\">TURN ON</button></a></p>";
  }
  
  // Dynamic button based on current yellow LED state
  if (digitalRead(LED_YELLOW_PIN) == HIGH) {
    html += "<p>Yellow LED Status: ON</p><p><a href=\"/yellow_light/off?redirect=true\"><button class=\"button button_yellow\">TURN OFF</button></a></p>";
  } else {
    html += "<p>Yellow LED Status: OFF</p><p><a href=\"/yellow_light/on?redirect=true\"><button class=\"button\">TURN ON</button></a></p>";
  }
  
  // Dynamic button based on current blue LED state
  if (digitalRead(LED_BLUE_PIN) == HIGH) {
    html += "<p>Blue LED Status: ON</p><p><a href=\"/blue_light/off?redirect=true\"><button class=\"button button_blue\">TURN OFF</button></a></p>";
  } else {
    html += "<p>Blue LED Status: OFF</p><p><a href=\"/blue_light/on?redirect=true\"><button class=\"button\">TURN ON</button></a></p>";
  }
  
  // Dynamic button based on current green LED state
  if (digitalRead(LED_GREEN_PIN) == HIGH) {
    html += "<p>Green LED Status: ON</p><p><a href=\"/green_light/off?redirect=true\"><button class=\"button button_green\">TURN OFF</button></a></p>";
  } else {
    html += "<p>Green LED Status: OFF</p><p><a href=\"/green_light/on?redirect=true\"><button class=\"button\">TURN ON</button></a></p>";
  }
    html += "</body></html>";

  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  html += "<p>Temperature: " + String(temperature) + " °C</p>";
  html += "<p>Humidity: " + String(humidity) + " %</p>";

  server.send(200, "text/html", html); 
}

// Function to handle turning the Red LED ON
void handleRedLightOn() {
  digitalWrite(LED_RED_PIN, HIGH);
  if (server.hasArg("redirect")) {
    server.sendHeader("Location", "/"); // Redirect back to the root page
    server.send(303, "text/plain", "");
  } else {
    server.send(200, "application/json", "{\"status\":\"Red LED turned ON\"}");
  }
}

// Function to handle turning the Red LED OFF
void handleRedLightOff() {
  digitalWrite(LED_RED_PIN, LOW);
  if (server.hasArg("redirect")) {
    server.sendHeader("Location", "/"); // Redirect back to the root page
    server.send(303, "text/plain", "");
  } else {
    server.send(200, "application/json", "{\"status\":\"Red LED turned OFF\"}");
  }
}

// Function to read the Red LED state and return it as a JSON response
void handleRedLightState() {
  bool isOn = digitalRead(LED_RED_PIN) == HIGH;
  String jsonResponse = "{\"status\":\"" + String(isOn ? "ON" : "OFF") + "\"}";
  server.send(200, "application/json", jsonResponse);
}

// Function to handle turning the Yellow LED ON
void handleYellowLightOn() {
  digitalWrite(LED_YELLOW_PIN, HIGH);
  if (server.hasArg("redirect")) {
    server.sendHeader("Location", "/"); // Redirect back to the root page
    server.send(303, "text/plain", "");
  } else {
    server.send(200, "application/json", "{\"status\":\"Yellow LED turned ON\"}");
  }
}

// Function to handle turning the Yellow LED OFF
void handleYellowLightOff() {
  digitalWrite(LED_YELLOW_PIN, LOW);
  if (server.hasArg("redirect")) {
    server.sendHeader("Location", "/"); // Redirect back to the root page
    server.send(303, "text/plain", "");
  } else {
    server.send(200, "application/json", "{\"status\":\"Yellow LED turned OFF\"}");
  }
}

// Function to read the Yellow LED state and return it as a JSON response
void handleYellowLightState() {
  bool isOn = digitalRead(LED_YELLOW_PIN) == HIGH;
  String jsonResponse = "{\"status\":\"" + String(isOn ? "ON" : "OFF") + "\"}";
  server.send(200, "application/json", jsonResponse);
}

// Function to handle turning the Blue LED ON
void handleBlueLightOn() {
  digitalWrite(LED_BLUE_PIN, HIGH);
  if (server.hasArg("redirect")) {
    server.sendHeader("Location", "/"); // Redirect back to the root page
    server.send(303, "text/plain", "");
  } else {
    server.send(200, "application/json", "{\"status\":\"Blue LED turned ON\"}");
  }
}

// Function to handle turning the Blue LED OFF
void handleBlueLightOff() {
  digitalWrite(LED_BLUE_PIN, LOW);
  if (server.hasArg("redirect")) {
    server.sendHeader("Location", "/"); // Redirect back to the root page
    server.send(303, "text/plain", "");
  } else {
    server.send(200, "application/json", "{\"status\":\"Blue LED turned OFF\"}");
  }
}

// Function to read the Blue LED state and return it as a JSON response
void handleBlueLightState() {
  bool isOn = digitalRead(LED_BLUE_PIN) == HIGH;
  String jsonResponse = "{\"status\":\"" + String(isOn ? "ON" : "OFF") + "\"}";
  server.send(200, "application/json", jsonResponse);
}

// Function to handle turning the Green LED ON
void handleGreenLightOn() {
  digitalWrite(LED_GREEN_PIN, HIGH);
  if (server.hasArg("redirect")) {
    server.sendHeader("Location", "/"); // Redirect back to the root page
    server.send(303, "text/plain", "");
  } else {
    server.send(200, "application/json", "{\"status\":\"Green LED turned ON\"}");
  }
}

// Function to handle turning the Green LED OFF
void handleGreenLightOff() {
  digitalWrite(LED_GREEN_PIN, LOW);
  if (server.hasArg("redirect")) {
    server.sendHeader("Location", "/"); // Redirect back to the root page
    server.send(303, "text/plain", "");
  } else {
    server.send(200, "application/json", "{\"status\":\"Green LED turned OFF\"}");
  }
}

// Function to read the Green LED state and return it as a JSON response
void handleGreenLightState() {
  bool isOn = digitalRead(LED_GREEN_PIN) == HIGH;
  String jsonResponse = "{\"status\":\"" + String(isOn ? "ON" : "OFF") + "\"}";
  server.send(200, "application/json", jsonResponse);
}

// Function to handle getting the temperature from the DHT11 sensor
void handleGetTemperature() {
  float temperature = dht.readTemperature();
  String jsonResponse = "{\"temperature\":" + String(temperature) + "}";
  server.send(200, "application/json", jsonResponse);
}

// Function to handle getting the humidity from the DHT11 sensor
void handleGetHumidity() {
  float humidity = dht.readHumidity();
  String jsonResponse = "{\"humidity\":" + String(humidity) + "}";
  server.send(200, "application/json", jsonResponse);
}

// Function to handle the buzzer with a specified frequency and duration
void handleBuzzer() {
  int frequency = 1000;
  int duration = 1000;
  if (server.hasArg("frequency")) {
    frequency = server.arg("frequency").toInt();
  }
  if (server.hasArg("duration")) {
    duration = server.arg("duration").toInt();
  }
  tone(BUZZER_PIN, frequency); // Play the specified frequency
  delay(duration); // Wait for the specified duration
  noTone(BUZZER_PIN); // Stop the sound
  String jsonResponse = "{\"frequency\":" + String(frequency) + ",\"duration\":" + String(duration) + "}";
  server.send(200, "application/json", jsonResponse);
}

void parseAndPlayMelodyDirect(String input) {
    int startIdx = 0;
    int noteCount = 1;

    Serial.println("--- Playing Melody ---");
    
    while (startIdx < input.length()) {
        int commaIdx = input.indexOf(',', startIdx);
        int colonIdx = input.indexOf(':', startIdx);
        
        if (commaIdx == -1) {
            commaIdx = input.length(); // End of string
        }
        
        if (colonIdx != -1 && colonIdx < commaIdx) {
            // Extract and convert data fields on the fly
            unsigned int frequency = (unsigned int)input.substring(startIdx, colonIdx).toInt();
            unsigned long durationMs = (unsigned long)(input.substring(colonIdx + 1, commaIdx).toFloat() * 1000);
            
            Serial.printf("Note %d -> Freq: %u Hz, Dur: %lu ms\n", noteCount++, frequency, durationMs);

            // Execute playback
            if (frequency > 0) {
                tone(BUZZER_PIN, frequency);
            } else {
                noTone(BUZZER_PIN); // Musical rest
            }
            delay(durationMs);

            // Brief pause (10%) to cleanly separate notes
            noTone(BUZZER_PIN);
            delay(durationMs * 0.10);
        }
        
        startIdx = commaIdx + 1; // Slide window past the processed comma
    }
    Serial.println("--- Playback Finished ---");
}

void handlePlayNotes() {
  if (server.hasArg("melody")) {
    String melodyInput = server.arg("melody");
    parseAndPlayMelodyDirect(melodyInput);
    server.send(200, "text/plain", "Played notes.");
  } else {
    server.send(400, "text/plain", "Missing 'melody' argument.");
  }
}
void toggleLED(int pin) {
  int ledState = digitalRead(pin);
  digitalWrite(pin, !ledState); // Toggle the LED state
}

// Function to handle toggling the built-in LED
void handleToggleLEDs() {
  toggleLED(LED_RED_PIN); // Toggle the Red LED
  toggleLED(LED_YELLOW_PIN); // Toggle the Yellow LED
  toggleLED(LED_BLUE_PIN); // Toggle the Blue LED
  toggleLED(LED_GREEN_PIN); // Toggle the Green LED
}

// Function to handle the second mystery function
void handleMystery1() {
  handleToggleLEDs(); // Call the function to toggle all LEDs
  server.send(200, "text/plain", "Mystery Function 1 executed.");
}

void handleTurnOnAllLEDs() {
  digitalWrite(LED_RED_PIN, HIGH);
  digitalWrite(LED_YELLOW_PIN, HIGH);
  digitalWrite(LED_BLUE_PIN, HIGH);
  digitalWrite(LED_GREEN_PIN, HIGH);
}

// Function to handle the second mystery function
void handleMystery2() {
  handleTurnOnAllLEDs(); // Call the function to turn on all LEDs
  server.send(200, "text/plain", "Mystery Function 2 executed.");
}

// Function handled for missing pages
void handleNotFound() {
  server.send(404, "text/plain", "404: Not Found");
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(LED_RED_PIN, OUTPUT);
  pinMode(LED_YELLOW_PIN, OUTPUT);
  pinMode(LED_BLUE_PIN, OUTPUT);
  pinMode(LED_GREEN_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  delay(1000);

  digitalWrite(LED_RED_PIN, LOW);
  digitalWrite(LED_YELLOW_PIN, LOW);
  digitalWrite(LED_BLUE_PIN, LOW);
  digitalWrite(LED_GREEN_PIN, LOW);

  // Connect to Wi-Fi network
  WiFi.begin(ssid, password);
  Serial.println("Connecting to WiFi");

  // Wait for connection
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    digitalWrite(LED_BUILTIN, LOW);
  }

  // Initialize mDNS with the hostname "esp32"
  if (MDNS.begin(host)) {
    MDNS.addService("http", "tcp", 80);
  } else {
    // Handle error
    Serial.println("Error setting up MDNS responder!");
  }

  // Print local IP address once connected
  Serial.println("");
  Serial.println("WiFi connected.");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
  digitalWrite(LED_BUILTIN, HIGH); // Turn the LED on to indicate successful connection

  // Define URL routing
  server.on("/", handleRoot);
  server.on("/red_light/on", handleRedLightOn);
  server.on("/red_light/off", handleRedLightOff);
  server.on("/yellow_light/on", handleYellowLightOn);
  server.on("/yellow_light/off", handleYellowLightOff);
  server.on("/blue_light/on", handleBlueLightOn);
  server.on("/blue_light/off", handleBlueLightOff);
  server.on("/green_light/on", handleGreenLightOn);
  server.on("/green_light/off", handleGreenLightOff);
  server.on("/red_light/state", handleRedLightState);
  server.on("/yellow_light/state", handleYellowLightState);
  server.on("/blue_light/state", handleBlueLightState);
  server.on("/green_light/state", handleGreenLightState);
  server.on("/temperature", handleGetTemperature);
  server.on("/humidity", handleGetHumidity);
  server.on("/buzzer", handleBuzzer);
  server.on("/play_notes", handlePlayNotes);
  server.on("/play_happy_birthday", playHappyBirthday);
  server.on("/mystery1", handleMystery1);
  server.on("/mystery2", handleMystery2);
  server.onNotFound(handleNotFound);

  // Start the server
  server.begin();
  Serial.println("HTTP server started");
}

void loop() {
  server.handleClient(); // Handle incoming client requests
}
