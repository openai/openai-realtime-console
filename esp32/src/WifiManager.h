/**
 * Wifi Manager
 * (c) 2022-2025 Martin Verges
 *
 * Licensed under CC BY-NC-SA 4.0
 * (Attribution-NonCommercial-ShareAlike 4.0 International)
**/
#ifndef WIFIMANAGER_h
#define WIFIMANAGER_h

#ifndef WIFIMANAGER_MAX_APS
#define WIFIMANAGER_MAX_APS 4   // Valid range is uint8_t
#endif

#ifndef ASYNC_WEBSERVER
  #define ASYNC_WEBSERVER true
#endif

#include <Arduino.h>
#include <Preferences.h>
#if ASYNC_WEBSERVER == true
  #include <ESPAsyncWebServer.h>
#else
  #include <WebServer.h>
#endif
#include <Audio.h>

void wifiTask(void* param);

// Callback for when the device connects to Wifi
void connectCb();


class WIFIMANAGER {
  protected:
#if ASYNC_WEBSERVER == true
    AsyncWebServer * webServer;         // The Webserver to register routes on
#else
    WebServer * webServer;              // The Webserver to register routes on
#endif
    String apiPrefix = "/api/wifi";     // Prefix for all IP endpionts
    String uiPrefix = "/wifi";          // Prefix for all UI endpionts

    Preferences preferences;            // Used to store AP credentials to NVS
    char * NVS;                         // Name used for NVS preferences

    struct apCredentials_t {
      String apName;                    // Name of the AP SSID
      String apPass;                    // Password if required to the AP
    };
    apCredentials_t apList[WIFIMANAGER_MAX_APS];  // Stored AP list

    uint8_t configuredSSIDs = 0;        // Number of stored SSIDs in the NVS

    bool softApRunning = false;         // Due to lack of functions, we have to remember if the AP is already running...
    bool createFallbackAP = true;       // Create an AP for configuration if no other connection is available

    uint64_t lastWifiCheckMillis = 0;   // Time of last Wifi health check
    uint32_t intervalWifiCheckMillis = 10000; // Interval of the Wifi health checks
    uint64_t startApTimeMillis = 0;     // Time when the AP was started
    uint32_t timeoutApMillis = 120000;  // Timeout of an AP when no client is connected, if timeout reached rescan, tryconnect or createAP

    String softApName;                  // Name of the soft AP if created, default to ESP_XXXXXXXX if empty
    String softApPass;                  // Password for the soft AP, default to no password (empty)

    // Wipe the apList credentials
    void clearApList();

    // Get id of the first non empty entry
    uint8_t getApEntry();
    
    // Print a log message to Serial, can be overwritten
    virtual void logMessage(String msg);

  public:
    // We let the loop run as as Task
    TaskHandle_t WifiCheckTask;

    WIFIMANAGER(const char * ns = "wifimanager");
    virtual ~WIFIMANAGER();

    // If no known Wifi can't be found, create an AP but retry regulary
    void fallbackToSoftAp(bool state = true);

    // Get the current fallback state
    bool getFallbackState();

    // Call to run the Task in the background
    void startBackgroundTask(String apName = "", String apPass = "");

    // Attach a webserver and register api routes
#if ASYNC_WEBSERVER == true
    void attachWebServer(AsyncWebServer * srv);
#else
    void attachWebServer(WebServer * srv);
#endif
    // Attach an UI
    void attachUI();

    // Add another AP to the list of known WIFIs
    bool addWifi(String apName, String apPass, bool updateNVS = true);

    // Delete Wifi from apList by ID
    bool delWifi(uint8_t apId);

    // Delete Wifi from apList by Name
    bool delWifi(String apName);

    // Try each known SSID and connect until none is left or one is connected.
    bool tryConnect();

    // Check if a SSID is stored in the config
    bool configAvailable();

    // Preconfigure the SoftAP
    void configueSoftAp(String apName = "", String apPass = "");

    // Start a SoftAP, called if no wifi can be connected
    bool runSoftAP(String apName = "", String apPass = "");

    // Disconnect/Stop SoftAP Mode
    void stopSoftAP();

    // Disconnect/Stop STA Mode
    void stopClient();

    // Disconnect/Stop SoftAP and STA Mode. Optionally end the task loop as well.
    void stopWifi(bool killTask = false);

    // Run in the loop to maintain state
    void loop();

    // Write AP Settings into persistent storage. Called on each addAP;
    bool writeToNVS();

    // Load AP Settings from NVS it known apList
    bool loadFromNVS();
};

#endif