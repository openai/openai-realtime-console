#include "HttpsOTAUpdate.h"
#include "esp_ota_ops.h"
#include "Config.h"
#include <HTTPClient.h>
#include <nvs_flash.h>
#include <Config.h>
#include <WiFiClientSecure.h>
#include <ESPAsyncWebServer.h> //https://github.com/me-no-dev/ESPAsyncWebServer using the latest dev version from @me-no-dev

HttpsOTAStatus_t otastatus;

bool isDeviceRegistered(AsyncWebServerRequest *request) {
    HTTPClient http;
    WiFiClientSecure client;
    client.setCACert(Vercel_CA_cert);

    String url = "https://" + String(backend_server) +
                 "/api/generate_auth_token?macAddress=" + WiFi.macAddress();

    http.begin(client, url);
    http.setTimeout(10000);

    int httpCode = http.GET();

    if (httpCode == HTTP_CODE_OK) {
        String payload = http.getString();
        JsonDocument doc;
        DeserializationError error = deserializeJson(doc, payload);

        if (error) {
            Serial.print("JSON parsing failed: ");
            Serial.println(error.c_str());
            http.end();
            return false;
        }

        String authToken = doc["token"];
        if (!authToken.isEmpty()) {
            // Store the auth token in NVS
            preferences.begin("auth", false);
            preferences.putString("auth_token", authToken);
            preferences.end();

            authTokenGlobal = String(authToken);
            http.end();
            return true;
        }
    }

    // If we get here, either the request failed or no token was found
    http.end();
    return false;
}

void setResetComplete() {
    HTTPClient http;
    
    // Construct the JSON payload
    JsonDocument doc;
    doc["authToken"] = authTokenGlobal;  // Using your existing auth token
    
    String jsonString;
    serializeJson(doc, jsonString);

    // Initialize HTTPS connection
    http.begin("https://" + String(backend_server) + "/api/factory_reset_handler");
    http.addHeader("Content-Type", "application/json");
    
    // Make the POST request
    int httpCode = http.POST(jsonString);
    
    if (httpCode > 0) {
        if (httpCode == HTTP_CODE_OK) {
            Serial.println("Factory reset status updated successfully");
        } else {
            Serial.printf("Factory reset update failed with code: %d\n", httpCode);
        }
    } else {
        Serial.printf("HTTP request failed: %s\n", http.errorToString(httpCode).c_str());
    }
    
    http.end();

    // Clear NVS
    factoryResetDevice();

}

void setOTAComplete() {
     HTTPClient http;
    
    // Construct the JSON payload
    JsonDocument doc;
    doc["authToken"] = authTokenGlobal;  // Using your existing auth token
    
    String jsonString;
    serializeJson(doc, jsonString);

    // Initialize HTTPS connection
    http.begin("https://" + String(backend_server) + "/api/ota_update_handler");
    http.addHeader("Content-Type", "application/json");
    
    // Make the POST request
    int httpCode = http.POST(jsonString);
    
    if (httpCode > 0) {
        if (httpCode == HTTP_CODE_OK) {
            Serial.println("OTA status updated successfully");
        } else {
            Serial.printf("OTA status update failed with code: %d\n", httpCode);
        }
    } else {
        Serial.printf("HTTP request failed: %s\n", http.errorToString(httpCode).c_str());
    }
    
    http.end();
}

void HttpEvent(HttpEvent_t *event)
{
    switch (event->event_id)
    {
    case HTTP_EVENT_ERROR:
        // Serial.println("Http Event Error");
        break;
    case HTTP_EVENT_ON_CONNECTED:
        // Serial.println("Http Event On Connected");
        break;
    case HTTP_EVENT_HEADER_SENT:
        // Serial.println("Http Event Header Sent");
        break;
    case HTTP_EVENT_ON_HEADER:
        // Serial.printf("Http Event On Header, key=%s, value=%s\n", event->header_key, event->header_value);
        break;
    case HTTP_EVENT_ON_DATA:
        break;
    case HTTP_EVENT_ON_FINISH:
        // Serial.println("Http Event On Finish");
        break;
    case HTTP_EVENT_DISCONNECTED:
        // Serial.println("Http Event Disconnected");
        break;
    }
}

void performOTAUpdate()
{
    Serial.println("Starting OTA Update...");
    HttpsOTA.onHttpEvent(HttpEvent);
    HttpsOTA.begin(ota_firmware_url, server_certificate);
}

void getOTAStatusFromNVS()
{
    preferences.begin("ota", false);
    ota_status = preferences.getBool("ota_status", false);
    preferences.end();
}

void setOTAStatusInNVS(bool status)
{
    preferences.begin("ota", false);
    preferences.putBool("ota_status", status);
    preferences.end();
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

void loopOTA()
{
    otastatus = HttpsOTA.status();
    if (otastatus == HTTPS_OTA_SUCCESS)
    {
        Serial.println("Firmware written successfully. To reboot device, call API ESP.restart() or PUSH restart button on device");
        // mark update as complete in db
        setOTAStatusInNVS(false);
        setOTAComplete();
        ESP.restart();
    }
    else if (otastatus == HTTPS_OTA_FAIL)
    {
        Serial.println("Firmware Upgrade Fail");
        setOTAStatusInNVS(true);
    }
}

// OTA firmware url
const char *ota_firmware_url = "https://starmoon-firmware.s3.us-east-1.amazonaws.com/firmware.bin";
const char *server_certificate = R"EOF(

)EOF";