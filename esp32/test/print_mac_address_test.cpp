#include <WiFi.h>

void setup() {
    Serial.begin(115200);
    delay(1000);

    WiFi.mode(WIFI_STA);  // Ensure WiFi is initialized
}

void loop() {
    // Print MAC address using the simple WiFi.macAddress() method
    Serial.print("Wi-Fi MAC Address: ");
    Serial.println(WiFi.macAddress());
    
    // Delay for 1 second before printing again
    delay(1000);    
}