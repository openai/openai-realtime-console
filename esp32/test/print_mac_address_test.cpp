// code to get mac address of the device
#include <WiFi.h> // Include the WiFi library

void setup()
{
    // Start the Serial communication to send and receive data
    Serial.begin(115200);

    // Give the Serial monitor some time to open (optional)
    delay(1000);

    // Get and print the MAC address
    String macAddress = WiFi.macAddress();
    Serial.print("ESP32 MAC Address: ");
    Serial.println(macAddress);
}

void loop()
{
    // Nothing needed in loop for this example
}
