#include "ultrasonic_motor.h"
#ifndef ULTRASONIC_MOTOR_NO_HTTP
#include <WebServer.h>
#endif

namespace UltrasonicMotor {
namespace {
constexpr uint8_t TRIGGER_PIN = 33;
constexpr uint8_t ECHO_PIN = 32;  // Use a 5 V to 3.3 V voltage divider.
constexpr uint8_t SERVO_PIN = 25; 
static_assert(SERVO_PIN < 34, "ESP32 GPIO 34-39 cannot output servo PWM");
// Channel 2 uses a different PWM timer from the buzzer's channel 0.
constexpr uint8_t PWM_CHANNEL = 2;
constexpr uint8_t PWM_BITS = 16;
constexpr uint32_t SERVO_PERIOD_US = 20000; // 50 Hz.
// Conservative starting range; calibrate for your particular SG90.
constexpr uint32_t MIN_PULSE_US = 1000;
constexpr uint32_t MAX_PULSE_US = 2000;
int currentAngle = 90;
bool servoEnabled = false;
bool timedMove = false;
unsigned long moveStartedMs = 0;
constexpr unsigned long MOVE_DURATION_MS = 1000;
unsigned long lastSampleMs = 0;
bool hasSample = false;
float cachedDistance = -1;
}

void releaseServo() {
  // Release the servo by disabling control pulses; this does not hold position.
  ledcWrite(PWM_CHANNEL, 0);
  servoEnabled = false;
  timedMove = false;
}

void update() {
  if (timedMove && millis() - moveStartedMs >= MOVE_DURATION_MS) {
    releaseServo();
  }
}

void begin() {
  pinMode(TRIGGER_PIN, OUTPUT);
  digitalWrite(TRIGGER_PIN, LOW);
  pinMode(ECHO_PIN, INPUT);
  pinMode(SERVO_PIN, OUTPUT);
  digitalWrite(SERVO_PIN, LOW);
  ledcSetup(PWM_CHANNEL, 50, PWM_BITS);
  ledcAttachPin(SERVO_PIN, PWM_CHANNEL);
  releaseServo(); // Stay released until an angle is requested.
  hasSample = false;
}

float readDistanceCm() {
  // Space triggers by at least 60 ms, even if API requests arrive rapidly.
  if (hasSample && millis() - lastSampleMs < 60) return cachedDistance;
  digitalWrite(TRIGGER_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIGGER_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIGGER_PIN, LOW);
  const unsigned long duration = pulseIn(ECHO_PIN, HIGH, 25000UL);
  const float distance = duration * 0.0343f / 2.0f;
  cachedDistance = duration != 0 && distance >= 2.0f && distance <= 400.0f
                     ? distance : -1.0f;
  lastSampleMs = millis();
  hasSample = true;
  return cachedDistance;
}

bool setServoAngle(int angle) {
  if (angle < 0 || angle > 180) return false;
  const uint32_t pulseUs = MIN_PULSE_US +
      (MAX_PULSE_US - MIN_PULSE_US) * static_cast<uint32_t>(angle) / 180;
  const uint32_t duty = (pulseUs * ((1UL << PWM_BITS) - 1) +
                         SERVO_PERIOD_US / 2) / SERVO_PERIOD_US;
  ledcWrite(PWM_CHANNEL, duty);
  currentAngle = angle;
  servoEnabled = true;
  timedMove = false;
  return true;
}

void startTimedMove() {
  moveStartedMs = millis();
  timedMove = true;
}

int servoAngle() { return currentAngle; }
bool isServoEnabled() { return servoEnabled; }
}  // namespace UltrasonicMotor

// Reuse the single server owned by iot_demo.cpp.
#ifndef ULTRASONIC_MOTOR_NO_HTTP
extern WebServer server;

// GET /getDistance -> {"distance_cm":42.5}; null means no valid echo.
void getDistance() {
  const float distance = UltrasonicMotor::readDistanceCm();
  const bool valid = distance >= 0;
  server.sendHeader("Cache-Control", "no-store");
  server.send(200, "application/json", String("{\"distance_cm\":") +
              (valid ? String(distance, 1) : String("null")) + "}");
}

// /motorControl?angle=0..180 or /motorControl?action=stop (release).
void handleMotorControl() {
  if (server.hasArg("action")) {
    if (server.arg("action") != "stop" || server.hasArg("angle")) {
      server.send(400, "application/json",
                  "{\"error\":\"Use angle=0..180 or action=stop\"}");
      return;
    }
    UltrasonicMotor::releaseServo();
  } else {
    const String angleText = server.arg("angle");
    bool valid = angleText.length() > 0 && angleText.length() <= 3;
    for (size_t i = 0; i < angleText.length(); ++i) {
      if (angleText[i] < '0' || angleText[i] > '9') valid = false;
    }
    if (!valid || !UltrasonicMotor::setServoAngle(angleText.toInt())) {
      server.send(400, "application/json",
                  "{\"error\":\"Use angle=0..180 or action=stop\"}");
      return;
    }
    UltrasonicMotor::startTimedMove();
  }
  server.sendHeader("Cache-Control", "no-store");
  server.send(200, "application/json", String("{\"angle\":") +
      String(UltrasonicMotor::servoAngle()) + ",\"enabled\":" +
      (UltrasonicMotor::isServoEnabled() ? "true" : "false") + "}");
}
#endif
