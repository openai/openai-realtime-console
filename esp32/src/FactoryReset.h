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

    // Initialize HTTPS connection with secure client
    http.begin(client, "https://" + String(backend_server) + "/api/factory_reset_handler");
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

void getFactoryResetStatusFromNVS()
{
    preferences.begin("factory_reset", false);
    factory_reset_status = preferences.getBool("factory_reset_status", false);
    preferences.end();
}

void setFactoryResetStatusInNVS(bool status)
{
    preferences.begin("factory_reset", false);
    preferences.putBool("factory_reset_status", status);
    preferences.end();
}
