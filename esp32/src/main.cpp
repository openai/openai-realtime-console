

#include <Arduino.h>
#include <driver/rtc_io.h>
#include "Button.h"
#include "LEDHandler.h"
#include "Config.h"
#include "SPIFFS.h"
#include "WifiManager.h"
#include <driver/touch_sensor.h>

// #define WEBSOCKETS_DEBUG_LEVEL WEBSOCKETS_LEVEL_ALL

#define TOUCH_THRESHOLD 60000
#define LONG_PRESS_MS 1000
#define REQUIRED_RELEASE_CHECKS 100     // how many consecutive times we need "below threshold" to confirm release

AsyncWebServer webServer(80);
WIFIMANAGER WifiManager;
esp_err_t getErr = ESP_OK;
DeviceState deviceState = IDLE;

void enterSleep()
{
    Serial.println("Going to sleep...");
    
    // First, change device state to prevent any new data processing
    deviceState = IDLE;

    // Stop audio tasks first
    i2s_stop(I2S_PORT_IN);
    i2s_stop(I2S_PORT_OUT);

    // Clear any remaining audio in buffer
    audioBuffer.reset();
    
    // Properly disconnect WebSocket and wait for it to complete
    if (webSocket.isConnected()) {
        webSocket.disconnect();
        // Give some time for the disconnect to process
        delay(100);
    }
    
    // Stop all tasks that might be using I2S or other peripherals
    i2s_driver_uninstall(I2S_PORT_IN);
    i2s_driver_uninstall(I2S_PORT_OUT);
    
    // Flush any remaining serial output
    Serial.flush();

    touch_pad_intr_disable(TOUCH_PAD_INTR_MASK_ALL);
    while (touchRead(TOUCH_PAD_NUM2) > TOUCH_THRESHOLD) {
      delay(50);
    }
    delay(500);
    touchSleepWakeUpEnable(TOUCH_PAD_NUM2, TOUCH_THRESHOLD);
    esp_deep_sleep_start();
}

void printOutESP32Error(esp_err_t err)
{
    switch (err)
    {
    case ESP_OK:
        Serial.println("ESP_OK no errors");
        break;
    case ESP_ERR_INVALID_ARG:
        Serial.println("ESP_ERR_INVALID_ARG if the selected GPIO is not an RTC GPIO, or the mode is invalid");
        break;
    case ESP_ERR_INVALID_STATE:
        Serial.println("ESP_ERR_INVALID_STATE if wakeup triggers conflict or wireless not stopped");
        break;
    default:
        Serial.printf("Unknown error code: %d\n", err);
        break;
    }
}

static void onButtonLongPressUpEventCb(void *button_handle, void *usr_data)
{
    Serial.println("Button long press end");
    delay(10);
    enterSleep();
}

static void onButtonDoubleClickCb(void *button_handle, void *usr_data)
{
    Serial.println("Button double click");
    delay(10);
    enterSleep();
}

void connectWithPassword()
{
    IPAddress dns1(8, 8, 8, 8);        // Google DNS
    IPAddress dns2(1, 1, 1, 1);        // Cloudflare DNS
    WiFi.config(INADDR_NONE, INADDR_NONE, INADDR_NONE, dns1, dns2);

    // WiFi.begin("EE-P8CX8N", "xd6UrFLd4kf9x4");
    // WiFi.begin("akaPhone", "akashclarkkent1");
    // WiFi.begin("S_HOUSE_RESIDENTS_NW", "Somerset_Residents!");
    // WiFi.begin("NOWBQPME", "JYHx4Svzwv5S");
    WiFi.begin("EE-PPA1GZ", "9JkyRJHXTDTKb3");


    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print("|");
    }
    Serial.println("");
    Serial.println("WiFi connected");

    WiFi.setSleep(false);
    // esp_wifi_set_ps(WIFI_PS_NONE);  // Disable power saving completely
    // playStartupSound();
    websocketSetup(ws_server, ws_port, ws_path);
}

void getAuthTokenFromNVS()
{
    preferences.begin("auth", false);
    authTokenGlobal = preferences.getString("auth_token", "");
    preferences.end();
    Serial.println(authTokenGlobal);
}

void setupWiFi()
{
    WifiManager.startBackgroundTask("ELATO-DEVICE");        // Run the background task to take care of our Wifi
    WifiManager.fallbackToSoftAp(true);       // Run a SoftAP if no known AP can be reached
    WifiManager.attachWebServer(&webServer);  // Attach our API to the Webserver 
    WifiManager.attachUI();                   // Attach the UI to the Webserver
  
    // Run the Webserver and add your webpages to it
    webServer.on("/", HTTP_GET, [](AsyncWebServerRequest *request){
        request->redirect("/wifi");
    });
    webServer.onNotFound([&](AsyncWebServerRequest *request) {
      request->send(404, "text/plain", "Not found");
    });
    webServer.begin();
}

void touchTask(void* parameter) {
  touch_pad_init();
  touch_pad_config(TOUCH_PAD_NUM2);

  bool touched = false;
  unsigned long pressStartTime = 0;

  while (1) {
    // Read the touch sensor
    uint32_t touchValue = touchRead(TOUCH_PAD_NUM2);
    bool isTouched = (touchValue > TOUCH_THRESHOLD);

    // Detect transition from "not touched" to "touched"
    if (isTouched && !touched) {
      touched = true;
      pressStartTime = millis();
      Serial.println("Touch detected - press started.");
      // goToSleep = true;
      enterSleep();
    }

    // Detect transition from "touched" to "released"
    // if (!isTouched && touched) {
    //   touched = false;
    //   unsigned long pressDuration = millis() - pressStartTime;
    //   if (pressDuration >= LONG_PRESS_MS) {
    //     Serial.print("Long press detected (");
    //     Serial.print(pressDuration);
    //     Serial.println(" ms) - going to sleep.");
    //     // Call enterSleep() which will wait for a stable release, enable wake, and sleep.
    //     goToSleep = true;
    //     // (The device will reset on wake, so code execution won't continue here.)
    //   } else {
    //     Serial.print("Short press detected (");
    //     Serial.print(pressDuration);
    //     Serial.println(" ms) - ignoring.");
    //   }
    // }

    delay(50);  // Small delay to avoid spamming readings
  }
  // (This point is never reached.)
  vTaskDelete(NULL);
}

void setup()
{
    Serial.begin(115200);
    delay(500);

     while (!Serial)
        ;

    // Print a welcome message to the Serial port.
    Serial.println("\n\nCaptive Test, V0.5.0 compiled " __DATE__ " " __TIME__ " by CD_FER"); //__DATE__ is provided by the platformio ide
    Serial.printf("%s-%d\n\r", ESP.getChipModel(), ESP.getChipRevision(), WiFi.macAddress());

    // factoryResetDevice();

    // AUTH & OTA
    getAuthTokenFromNVS();
    deviceState = IDLE;
    if (ota_status) {
        deviceState = OTA;
    }
    if (factory_reset_status) {
        deviceState = FACTORY_RESET;
    }

    wsMutex = xSemaphoreCreateMutex();

    // BUTTON
    // getErr = esp_sleep_enable_ext0_wakeup(BUTTON_PIN, LOW);
    // printOutESP32Error(getErr);
    // Button *btn = new Button(BUTTON_PIN, false);
    // btn->attachLongPressUpEventCb(&onButtonLongPressUpEventCb, NULL);
    // btn->attachDoubleClickEventCb(&onButtonDoubleClickCb, NULL);
    // btn->detachSingleClickEvent();

    // TOUCH
    xTaskCreate(touchTask, "Touch Task", 4096, NULL, configMAX_PRIORITIES-1, NULL);
    xTaskCreate(ledTask, "LED Task", 4096, NULL, 5, NULL);
    xTaskCreate(audioStreamTask, "Speaker Task", 4096, NULL, 3, NULL);
    xTaskCreate(micTask, "Microphone Task", 4096, NULL, 4, NULL);
    xTaskCreate(networkTask, "Websocket Task", 8192, NULL, configMAX_PRIORITIES-2, NULL);

    // WIFI
    setupWiFi();
    // connectWithPassword();
    // connectToWifiAndWebSocket();
}

void loop(){}