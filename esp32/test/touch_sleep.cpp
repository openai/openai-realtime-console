#include <Arduino.h>
#include <esp_sleep.h>
#include <driver/touch_sensor.h>

// Use touch pad channel 2 (T2)
#define TOUCH_PAD_CHANNEL   TOUCH_PAD_NUM2  
// Set the threshold value – adjust this value for your hardware
#define TOUCH_THRESHOLD     60000  
// Duration (in milliseconds) required for a long press
#define LONG_PRESS_MS       1000  

// Task handles (optional, for task management)
TaskHandle_t fibTaskHandle   = NULL;
TaskHandle_t touchTaskHandle = NULL;

// Define RGB LED pins
#define READ_PIN_T    8
#define GREEN_PIN_T  9
#define BLUE_PIN_T   13

//------------------------------------------------------------------------------
// RGB LED Task: Cycle through colors every 1 second
//------------------------------------------------------------------------------
void ledTaskT(void* parameter) {
  // Set pins as outputs
  pinMode(READ_PIN_T, OUTPUT);
  pinMode(GREEN_PIN_T, OUTPUT);
  pinMode(BLUE_PIN_T, OUTPUT);
  
  while (true) {
    // Red
    digitalWrite(READ_PIN_T, HIGH);
    digitalWrite(GREEN_PIN_T, LOW);
    digitalWrite(BLUE_PIN_T, LOW);
    delay(1000);
    
    // Green
    digitalWrite(READ_PIN_T, LOW);
    digitalWrite(GREEN_PIN_T, HIGH);
    digitalWrite(BLUE_PIN_T, LOW);
    delay(1000);
    
    // Blue
    digitalWrite(READ_PIN_T, LOW);
    digitalWrite(GREEN_PIN_T, LOW);
    digitalWrite(BLUE_PIN_T, HIGH);
    delay(1000);
  }
}

//------------------------------------------------------------------------------
// enterSleep: Wait for a stable release, enable touch wake, and enter deep sleep
//------------------------------------------------------------------------------
void enterSleep() {
  Serial.println("Preparing to sleep...");

  // Wait until the touch pad reading shows "release"
  // (Assuming that a reading above TOUCH_THRESHOLD means a touch.)
  while (touchRead(TOUCH_PAD_CHANNEL) > TOUCH_THRESHOLD) {
    delay(50);
  }
  // Extra delay to allow any residual contact or noise to settle
  delay(500);

  // Enable touchpad wakeup using the Arduino API.
  // This configures the ESP32 so that a new touch on channel 2 will wake it.
  touchSleepWakeUpEnable(TOUCH_PAD_CHANNEL, TOUCH_THRESHOLD);

  Serial.println("Entering deep sleep now.");
  esp_deep_sleep_start();
  // Execution stops here until a wakeup occurs.
}

//------------------------------------------------------------------------------
// Touch Task: Monitor the touch pad to detect a long press and trigger sleep
//------------------------------------------------------------------------------
void touchTask(void* parameter) {
  touch_pad_init();
  touch_pad_config(TOUCH_PAD_NUM2);

  bool touched = false;
  unsigned long pressStartTime = 0;

  while (true) {
    // Read the touch sensor
    uint32_t touchValue = touchRead(TOUCH_PAD_CHANNEL);
    Serial.printf("Touch Pad Value: %u\n", touchValue);

    // On the ESP32-S3, a reading above TOUCH_THRESHOLD indicates a touch.
    bool isTouched = (touchValue > TOUCH_THRESHOLD);

    // Detect transition from "not touched" to "touched"
    if (isTouched && !touched) {
      touched = true;
      pressStartTime = millis();
      Serial.println("Touch detected – press started.");
    }

    // Detect transition from "touched" to "released"
    if (!isTouched && touched) {
      touched = false;
      unsigned long pressDuration = millis() - pressStartTime;
      if (pressDuration >= LONG_PRESS_MS) {
        Serial.print("Long press detected (");
        Serial.print(pressDuration);
        Serial.println(" ms) – going to sleep.");
        // Call enterSleep() which will wait for a stable release, enable wake, and sleep.
        enterSleep();
        // (The device will reset on wake, so code execution won't continue here.)
      } else {
        Serial.print("Short press detected (");
        Serial.print(pressDuration);
        Serial.println(" ms) – ignoring.");
      }
    }

    delay(50);  // Small delay to avoid spamming readings
  }
  // (This point is never reached.)
  vTaskDelete(NULL);
}

//------------------------------------------------------------------------------
// setup: Initialize Serial, print wakeup cause, and create tasks
//------------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(500);

  // Check the wakeup cause and print a message
  esp_sleep_wakeup_cause_t wakeupCause = esp_sleep_get_wakeup_cause();
  if (wakeupCause == ESP_SLEEP_WAKEUP_TOUCHPAD) {
    Serial.println("Woke up from touchpad deep sleep.");
  } else {
    Serial.println("Normal startup.");
  }

  // Create the Fibonacci task (prints every 1 second)
  xTaskCreate(ledTaskT, "FibonacciTask", 2048, NULL, 1, &fibTaskHandle);
  // Create the Touch task (monitors the touch pad)
  xTaskCreate(touchTask, "TouchTask", 2048, NULL, 1, &touchTaskHandle);
}

//------------------------------------------------------------------------------
// loop: Not used as tasks handle all work
//------------------------------------------------------------------------------
void loop() {
  // Nothing to do here.
}
