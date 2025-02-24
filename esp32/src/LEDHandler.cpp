#include "LEDHandler.h"

int brightness = 0;
int fadeAmount = 5;
static unsigned long lastToggle = 0;
static bool ledState = false;

void setLEDColor(uint8_t r, uint8_t g, uint8_t b)
{
    analogWrite(RED_LED_PIN, r);
    analogWrite(GREEN_LED_PIN, g);
    analogWrite(BLUE_LED_PIN, b);
}

enum class StaticColor
{
    RED,
    GREEN,
    BLUE,
    YELLOW,
    MAGENTA,
    CYAN,
};

void setStaticColor(StaticColor color)
{
    switch (color)
    {
    case StaticColor::RED:
        digitalWrite(RED_LED_PIN, LOW);
        digitalWrite(GREEN_LED_PIN, HIGH);
        digitalWrite(BLUE_LED_PIN, HIGH);
        break;
    case StaticColor::GREEN:
        digitalWrite(RED_LED_PIN, HIGH);
        digitalWrite(GREEN_LED_PIN, LOW);
        digitalWrite(BLUE_LED_PIN, HIGH);
        break;
    case StaticColor::BLUE:
        digitalWrite(RED_LED_PIN, HIGH);
        digitalWrite(GREEN_LED_PIN, HIGH);
        digitalWrite(BLUE_LED_PIN, LOW);
        break;
    case StaticColor::YELLOW:
        digitalWrite(RED_LED_PIN, LOW);
        digitalWrite(GREEN_LED_PIN, LOW);
        digitalWrite(BLUE_LED_PIN, HIGH);
        break;
    case StaticColor::MAGENTA:
        digitalWrite(RED_LED_PIN, LOW);
        digitalWrite(GREEN_LED_PIN, HIGH);
        digitalWrite(BLUE_LED_PIN, LOW);
        break;
    case StaticColor::CYAN:
        digitalWrite(RED_LED_PIN, HIGH);
        digitalWrite(GREEN_LED_PIN, LOW);
        digitalWrite(BLUE_LED_PIN, LOW);
        break;
    }
}

void loopCyanPinkYellow()
{
    // Cyan (Green + Blue)
    digitalWrite(RED_LED_PIN, LOW);
    digitalWrite(GREEN_LED_PIN, HIGH);
    digitalWrite(BLUE_LED_PIN, HIGH);
    delay(500);

    // Pink (Red + Blue)
    digitalWrite(RED_LED_PIN, HIGH);
    digitalWrite(GREEN_LED_PIN, LOW);
    digitalWrite(BLUE_LED_PIN, HIGH);
    delay(500);

    // Yellow (Red + Green)
    digitalWrite(RED_LED_PIN, HIGH);
    digitalWrite(GREEN_LED_PIN, HIGH);
    digitalWrite(BLUE_LED_PIN, LOW);
    delay(500);
}

void pulseWhite()
{
    setLEDColor(brightness, brightness, brightness);
    brightness += fadeAmount;
    if (brightness <= 0 || brightness >= 255) // Changed from 255 to 128
    {
        fadeAmount = -fadeAmount;
    }
}

void pulseMagenta()
{
    setLEDColor(brightness, 0, brightness);
    brightness += fadeAmount;
    if (brightness <= 0 || brightness >= 255) // Changed from 255 to 128
    {
        fadeAmount = -fadeAmount;
    }
}

void pulseYellow()
{
    setLEDColor(brightness, brightness, 0);
    brightness += fadeAmount;
    if (brightness <= 0 || brightness >= 255) // Changed from 255 to 128
    {
        fadeAmount = -fadeAmount;
    }
}

void pulseBlue()
{
    setLEDColor(0, 0, brightness);
    brightness += fadeAmount;
    if (brightness <= 0 || brightness >= 255) // Changed from 255 to 128
    {
        fadeAmount = -fadeAmount;
    }
}

void blinkWhite()
{
    if (ledState)
    {
        digitalWrite(RED_LED_PIN, HIGH);
        digitalWrite(GREEN_LED_PIN, HIGH);
        digitalWrite(BLUE_LED_PIN, HIGH);
    }
    else
    {
        digitalWrite(RED_LED_PIN, LOW);
        digitalWrite(GREEN_LED_PIN, LOW);
        digitalWrite(BLUE_LED_PIN, LOW);
    }
}

void blinkGreen()
{
    digitalWrite(BLUE_LED_PIN, LOW);
    digitalWrite(RED_LED_PIN, LOW);
    if (ledState)
    {
        digitalWrite(GREEN_LED_PIN, HIGH);
    }
    else
    {
        digitalWrite(GREEN_LED_PIN, LOW);
    }
}

void blinkYellow()
{
    digitalWrite(BLUE_LED_PIN, LOW);
    if (ledState)
    {
        digitalWrite(RED_LED_PIN, HIGH);
        digitalWrite(GREEN_LED_PIN, HIGH);
    }
    else
    {
        digitalWrite(RED_LED_PIN, LOW);
        digitalWrite(GREEN_LED_PIN, LOW);
    }
}

void turnOffLED()
{
    digitalWrite(RED_LED_PIN, LOW);
    digitalWrite(GREEN_LED_PIN, LOW);
    digitalWrite(BLUE_LED_PIN, LOW);
}

void turnOnLED()
{
    digitalWrite(RED_LED_PIN, HIGH);
    digitalWrite(GREEN_LED_PIN, HIGH);
    digitalWrite(BLUE_LED_PIN, HIGH);
}

void setupRGBLED()
{
    pinMode(RED_LED_PIN, OUTPUT);
    pinMode(GREEN_LED_PIN, OUTPUT);
    pinMode(BLUE_LED_PIN, OUTPUT);
    turnOffLED(); // Turn off the LED initially
}

void blinkCyanPulse()
{
    analogWrite(GREEN_LED_PIN, brightness);
    analogWrite(BLUE_LED_PIN, brightness);

    brightness += fadeAmount;
    if (brightness <= 0 || brightness >= 255)
    {
        fadeAmount = -fadeAmount;
    }
}

const uint8_t colorSequence[][3] = {
    {0, 255, 255}, // Cyan   (R=0,   G=255, B=255)
    {255, 0, 255}, // Pink   (R=255, G=0,   B=255)
    {255, 255, 0}, // Yellow (R=255, G=255, B=0)
};
const int NUM_COLORS = sizeof(colorSequence) / sizeof(colorSequence[0]);

void loopCyanPinkYellowPulse(unsigned long currentTime)
{
    // Duration of each color fade
    const unsigned long transitionDuration = 1000; // 500 ms per fade

    // colorIndex = which color in colorSequence we’re currently *starting* from
    static int colorIndex = 0;

    // We'll store the "start color" and "end color" for the current fade
    static uint8_t startColor[3];
    static uint8_t endColor[3];

    // The timestamp at which the current fade *started*
    static unsigned long transitionStartTime = 0;

    // A flag so we can initialize the first fade
    static bool initialized = false;

    if (!initialized)
    {
        // On the very first call, set the starting color to colorSequence[0]
        // and the endColor to the next color in the array
        memcpy(startColor, colorSequence[colorIndex], 3);
        int nextIndex = (colorIndex + 1) % NUM_COLORS;
        memcpy(endColor, colorSequence[nextIndex], 3);

        transitionStartTime = currentTime;
        initialized = true;
    }

    // How long has this transition been running?
    unsigned long elapsed = currentTime - transitionStartTime;
    float t = (float)elapsed / (float)transitionDuration;
    if (t > 1.0f)
    {
        t = 1.0f; // clamp
    }

    // Interpolate each channel: R, G, B
    uint8_t r = startColor[0] + (endColor[0] - startColor[0]) * t;
    uint8_t g = startColor[1] + (endColor[1] - startColor[1]) * t;
    uint8_t b = startColor[2] + (endColor[2] - startColor[2]) * t;

    // Write these values to your LED pins
    analogWrite(RED_LED_PIN, r);
    analogWrite(GREEN_LED_PIN, g);
    analogWrite(BLUE_LED_PIN, b);

    // Check if this transition has finished
    if (elapsed >= transitionDuration)
    {
        // Move to next color in the sequence
        colorIndex = (colorIndex + 1) % NUM_COLORS;
        memcpy(startColor, endColor, 3); // old 'end' becomes new 'start'

        int nextIndex = (colorIndex + 1) % NUM_COLORS;
        memcpy(endColor, colorSequence[nextIndex], 3);

        transitionStartTime = currentTime; // reset the clock for the next fade
    }
}

void blinkBlue()
{
    digitalWrite(GREEN_LED_PIN, LOW);
    digitalWrite(RED_LED_PIN, LOW);
    if (ledState)
    {
        digitalWrite(BLUE_LED_PIN, HIGH);
    }
    else
    {
        digitalWrite(BLUE_LED_PIN, LOW);
    }
}

void staticYellow()
{
    digitalWrite(BLUE_LED_PIN, LOW);
    digitalWrite(RED_LED_PIN, HIGH);
    digitalWrite(GREEN_LED_PIN, HIGH);
}

void ledTask(void *parameter)
{
    setupRGBLED();
    unsigned long currentTime = 0;
    while (1)
    {
        currentTime += 20; // Track time based on vTaskDelay

        // Toggle LED state every 200ms for blinking functions
        if (currentTime - lastToggle >= 200)
        {
            ledState = !ledState;
            lastToggle = currentTime;
        }

         switch (deviceState)
        {
        case IDLE:
            setStaticColor(StaticColor::GREEN);
            break;
        case PROCESSING:
            setStaticColor(StaticColor::RED);
            break;
        case SPEAKING:
            setStaticColor(StaticColor::BLUE);
            break;
        case LISTENING:
            setStaticColor(StaticColor::YELLOW);
            break;
        case OTA:
            setStaticColor(StaticColor::CYAN);
            break;
        default:
            setStaticColor(StaticColor::GREEN); // LED on
            break;
        }

        // Delay for smoother LED transitions
        vTaskDelay(20 / portTICK_PERIOD_MS); // Approximate the delay from the original `pulsateLED()`
    }
}