#include <Arduino.h>

int redPin = 9;   // Red LED pin
int greenPin = 8; // Green LED pin
int bluePin = 13;  // Blue LED pin

void setup()
{
    pinMode(redPin, OUTPUT);
    pinMode(greenPin, OUTPUT);
    pinMode(bluePin, OUTPUT);
}

void loop()
{
    // Example: turn Red on (LOW), Green off (HIGH), Blue off (HIGH) for Common Anode
    digitalWrite(redPin, LOW);    // Red on
    digitalWrite(greenPin, HIGH); // Green off
    digitalWrite(bluePin, HIGH);  // Blue off

    delay(1000); // Wait 1 second

    // Turn Green on and others off
    digitalWrite(redPin, HIGH);  // Red off
    digitalWrite(greenPin, LOW); // Green on
    digitalWrite(bluePin, HIGH); // Blue off

    delay(1000); // Wait 1 second

    // Turn Green on and others off
    digitalWrite(redPin, HIGH);   // Red off
    digitalWrite(greenPin, HIGH); // Green on
    digitalWrite(bluePin, LOW);   // Blue off

    delay(1000); // Wait 1 second
}