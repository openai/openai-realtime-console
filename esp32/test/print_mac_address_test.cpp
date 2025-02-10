#include <WiFi.h>
#include <esp_wifi.h>

    uint8_t mac[6];



void setup() {
    Serial.begin(115200);
    delay(1000);

    WiFi.mode(WIFI_STA);  // Ensure WiFi is initialized
    WiFi.begin("SSID", "PASSWORD"); // If needed for connection
    
    // Fetch MAC Address directly from ESP32 API
    uint8_t mac[6];
    esp_wifi_get_mac(WIFI_IF_STA, mac);
}

void loop() {
    // Nothing needed here
    delay(1000);    
      Serial.printf("Wi-Fi MAC Address: %02X:%02X:%02X:%02X:%02X:%02X\n",
                  mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);

}
