#pragma once

#include <Arduino.h>

// Sensor/motor functions and handlers using the caller's existing web server.
namespace UltrasonicMotor {
void begin();
// Call regularly to release a completed HTTP movement without blocking.
void update();
// Returns centimeters, or -1 for a missing/out-of-range echo.
float readDistanceCm();
// Commands an SG90 position (0..180); false leaves the servo unchanged.
bool setServoAngle(int angle);
// Disables pulses and releases holding torque; does not hold position.
void releaseServo();
int servoAngle();
bool isServoEnabled();
}

// HTTP callbacks implemented using the existing server in iot_demo.cpp.
#ifndef ULTRASONIC_MOTOR_NO_HTTP
void getDistance();
void handleMotorControl();
#endif
