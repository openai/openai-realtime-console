#include <Arduino.h>

// Define pin assignments
const int ledPin = 0;     // GPIO 2 connected to LED
const int buttonPin = D5; // GPIO 15 connected to button

// Variables for button state tracking
bool ledState = LOW;
bool buttonState = HIGH;
bool lastButtonState = HIGH;
unsigned long lastDebounceTime = 0;
unsigned long debounceDelay = 50; // Adjust debounce delay as needed

void setup()
{
    // Initialize serial communication (optional)
    Serial.begin(115200);

    // Set the LED pin as output
    pinMode(ledPin, OUTPUT);
    digitalWrite(ledPin, ledState);

    // Set the button pin as input with internal pull-up resistor
    pinMode(buttonPin, INPUT_PULLUP);
}

void loop()
{
    // Read the state of the button
    int reading = digitalRead(buttonPin);

    // Check for state change (debounce)
    if (reading != lastButtonState)
    {
        lastDebounceTime = millis(); // Reset debounce timer
    }

    if ((millis() - lastDebounceTime) > debounceDelay)
    {
        // If the button state has changed
        if (reading != buttonState)
        {
            buttonState = reading;

            // Only toggle the LED if the new button state is LOW (button pressed)
            if (buttonState == LOW)
            {
                ledState = !ledState; // Toggle LED state
                digitalWrite(ledPin, ledState);

                // Optional: print the LED state to the Serial Monitor
                Serial.print("LED is now ");
                Serial.println(ledState == HIGH ? "ON" : "OFF");
            }
        }
    }

    lastButtonState = reading; // Save the reading for next loop
}
