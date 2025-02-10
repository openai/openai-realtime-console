#include <Arduino.h>
#include <FreeRTOS.h>
#include <task.h>

// Pin definitions
#define TOUCH_PIN         2
#define RED_LED_PIN       8
#define GREEN_LED_PIN     9
#define BLUE_LED_PIN      13

// Touch sensor threshold (adjust based on your environment)
#define TOUCH_THRESHOLD   40

// Color sequence and timing
const uint8_t colorSequence[][3] = {
    {0, 255, 255},   // Cyan
    {255, 0, 255},   // Pink
    {255, 255, 0},   // Yellow
};
const int NUM_COLORS = sizeof(colorSequence) / sizeof(colorSequence[0]);

// RTOS task handle and state variables
TaskHandle_t colorPulseTaskHandle = NULL;
volatile bool ledOn = false;

void setup() {
    Serial.begin(115200);
    
    // Initialize LED pins
    pinMode(RED_LED_PIN, OUTPUT);
    pinMode(GREEN_LED_PIN, OUTPUT);
    pinMode(BLUE_LED_PIN, OUTPUT);
    analogWrite(RED_LED_PIN, 0);
    analogWrite(GREEN_LED_PIN, 0);
    analogWrite(BLUE_LED_PIN, 0);

    // Create color pulse task (suspended initially)
    xTaskCreate(
        colorPulseTask,     // Task function
        "ColorPulse",       // Task name
        4096,               // Stack size
        NULL,               // Parameters
        1,                  // Priority
        &colorPulseTaskHandle
    );
    vTaskSuspend(colorPulseTaskHandle);
}

void loop() {
    static bool lastTouchState = false;
    static unsigned long lastDebounceTime = 0;
    const unsigned long debounceDelay = 50;

    // Read touch sensor
    int touchValue = touchRead(TOUCH_PIN);
    bool currentTouchState = (touchValue < TOUCH_THRESHOLD);

    // Debounce logic
    if (currentTouchState != lastTouchState) {
        lastDebounceTime = millis();
    }

    if ((millis() - lastDebounceTime) > debounceDelay) {
        if (currentTouchState && !lastTouchState) {
            ledOn = !ledOn;
            if (ledOn) {
                vTaskResume(colorPulseTaskHandle);
            } else {
                vTaskSuspend(colorPulseTaskHandle);
                analogWrite(RED_LED_PIN, 0);
                analogWrite(GREEN_LED_PIN, 0);
                analogWrite(BLUE_LED_PIN, 0);
            }
        }
        lastTouchState = currentTouchState;
    }

    vTaskDelay(10 / portTICK_PERIOD_MS); // Yield to other tasks
}

void colorPulseTask(void *pvParameters) {
    while (1) {
        unsigned long currentTime = millis();
        loopCyanPinkYellowPulse(currentTime);
        vTaskDelay(10 / portTICK_PERIOD_MS);
    }
}

void loopCyanPinkYellowPulse(unsigned long currentTime) {
    const unsigned long transitionDuration = 1000; // 1 second per transition
    
    static int colorIndex = 0;
    static uint8_t startColor[3];
    static uint8_t endColor[3];
    static unsigned long transitionStartTime = 0;
    static bool initialized = false;

    if (!initialized) {
        memcpy(startColor, colorSequence[colorIndex], 3);
        memcpy(endColor, colorSequence[(colorIndex + 1) % NUM_COLORS], 3);
        transitionStartTime = currentTime;
        initialized = true;
    }

    unsigned long elapsed = currentTime - transitionStartTime;
    float t = (float)elapsed / (float)transitionDuration;
    t = t > 1.0f ? 1.0f : t;

    uint8_t r = startColor[0] + (endColor[0] - startColor[0]) * t;
    uint8_t g = startColor[1] + (endColor[1] - startColor[1]) * t;
    uint8_t b = startColor[2] + (endColor[2] - startColor[2]) * t;

    analogWrite(RED_LED_PIN, r);
    analogWrite(GREEN_LED_PIN, g);
    analogWrite(BLUE_LED_PIN, b);

    if (elapsed >= transitionDuration) {
        colorIndex = (colorIndex + 1) % NUM_COLORS;
        memcpy(startColor, endColor, 3);
        memcpy(endColor, colorSequence[(colorIndex + 1) % NUM_COLORS], 3);
        transitionStartTime = currentTime;
    }
}