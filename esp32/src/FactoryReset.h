#include <Config.h>
#include <nvs_flash.h>
#include <ESPAsyncWebServer.h> //https://github.com/me-no-dev/ESPAsyncWebServer using the latest dev version from @me-no-dev

void setResetComplete() {
    HTTPClient http;
    WiFiClientSecure client;
    client.setCACert(Vercel_CA_cert);  // Using the existing server certificate
    
    // Construct the JSON payload
    JsonDocument doc;
    doc["authToken"] = authTokenGlobal;
    
    String jsonString;
    serializeJson(doc, jsonString);

    // Initialize HTTPS connection with client
    #ifdef DEV_MODE
    http.begin("http://" + String(backend_server) + ":" + String(backend_port) + "/api/factory_reset_handler");
    #else
    http.begin(client, "https://" + String(backend_server) + "/api/factory_reset_handler");
    #endif

    http.addHeader("Content-Type", "application/json");
    http.setTimeout(10000);  // Add timeout for reliability
    
    // Make the POST request
    int httpCode = http.POST(jsonString);
    
    // ... existing code ...
    if (httpCode > 0) {
        if (httpCode == HTTP_CODE_OK) {
            Serial.println("Factory reset status updated successfully");
        } else {
            Serial.printf("Factory reset status update failed with code: %d\n", httpCode);
        }
    } else {
        Serial.printf("HTTP request failed: %s\n", http.errorToString(httpCode).c_str());
    }
    
    http.end();

    // Clear NVS
    factoryResetDevice();

}

// TODO(@akdeb): Update this to use `false` as default
void getFactoryResetStatusFromNVS()
{
    preferences.begin("is_reset", false);
    factory_reset_status = preferences.getBool("is_reset", false);
    preferences.end();
}

void setFactoryResetStatusInNVS(bool status)
{
    preferences.begin("is_reset", false);
    preferences.putBool("is_reset", status);
    preferences.end();
    factory_reset_status = status;
}

void factoryResetDevice() {
       Serial.println("Factory reset device");
       
       // Erase the NVS partition
       esp_err_t err = nvs_flash_erase();
       if (err != ESP_OK) {
           Serial.printf("Error erasing NVS: %d\n", err);
           return;
       }
       
       // Reinitialize NVS
       err = nvs_flash_init();
       if (err != ESP_OK) {
           Serial.printf("Error initializing NVS: %d\n", err);
           return;
       }
   }