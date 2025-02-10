#include <Arduino.h>

// Adjust to the pin you are using:
#define TOUCH_PIN 2

void setup() {
  Serial.begin(115200);
  while (!Serial); // wait for Serial to be ready

  Serial.println("ESP32 Touch Threshold Test");
  Serial.println("Touch or release the pad and watch the values.");
  Serial.println("Use these values to decide on a threshold.");
}

void loop() {
  uint16_t touchValue = touchRead(TOUCH_PIN);
  Serial.println(touchValue);

  // If you'd like to show a quick guess for touched vs not touched,
  // you can temporarily hardcode a threshold for testing:
  // int threshold = 40;
  // if (touchValue < threshold) {
  //   Serial.println("Touched!");
  // } else {
  //   Serial.println("Not touched");
  // }

  delay(250); // read ~4 times per second
}
