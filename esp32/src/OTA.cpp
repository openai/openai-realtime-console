#include "OTA.h"
#include "HttpsOTAUpdate.h"
#include "esp_ota_ops.h"

HttpsOTAStatus_t otastatus;

// OTA firmware url
const char *ota_firmware_url = "https://starmoon-firmware.s3.us-east-1.amazonaws.com/firmware.bin";
const char *server_certificate = R"EOF(

)EOF";

void setOTAComplete() {
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
    http.begin("http://" + String(backend_server) + ":" + String(backend_port) + "/api/ota_update_handler");
    #else
    http.begin(client, "https://" + String(backend_server) + "/api/ota_update_handler");
    #endif

    http.addHeader("Content-Type", "application/json");
    http.setTimeout(10000);  // Add timeout for reliability
    
    // Make the POST request
    int httpCode = http.POST(jsonString);
    
    // ... existing code ...
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

