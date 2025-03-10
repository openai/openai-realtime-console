#include "OTA.h"
#include <Arduino.h>
#include <driver/rtc_io.h>
#include "LEDHandler.h"
#include "Config.h"
#include "SPIFFS.h"
#include "WifiManager.h"
#include <driver/touch_sensor.h>
#include "Button.h"
#include "FactoryReset.h"

// #define WEBSOCKETS_DEBUG_LEVEL WEBSOCKETS_LEVEL_ALL

#define TOUCH_THRESHOLD 28000
#define LONG_PRESS_MS 1000
#define REQUIRED_RELEASE_CHECKS 100     // how many consecutive times we need "below threshold" to confirm release
#define DEBOUNCE_DELAY 1000 // milliseconds

AsyncWebServer webServer(80);
WIFIMANAGER WifiManager;
esp_err_t getErr = ESP_OK;

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

    #ifdef TOUCH_MODE
        touch_pad_intr_disable(TOUCH_PAD_INTR_MASK_ALL);
        while (touchRead(TOUCH_PAD_NUM2) > TOUCH_THRESHOLD) {
        delay(50);
        }
        delay(500);
        touchSleepWakeUpEnable(TOUCH_PAD_NUM2, TOUCH_THRESHOLD);
    #endif

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

void getAuthTokenFromNVS()
{
    preferences.begin("auth", false);
    authTokenGlobal = preferences.getString("auth_token", "");
    preferences.end();
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
  unsigned long lastTouchTime = 0;

  while (1) {
    // Read the touch sensor
    uint32_t touchValue = touchRead(TOUCH_PAD_NUM2);
    bool isTouched = (touchValue > TOUCH_THRESHOLD);
    unsigned long currentTime = millis();

    // Debounced touch detection
    if (isTouched && !touched && (currentTime - lastTouchTime > DEBOUNCE_DELAY)) {
      touched = true;
      lastTouchTime = currentTime;

      if (!webSocket.isConnected()) {
        enterSleep();
      } else if (deviceState == SPEAKING) {
      // First, set the flag to prevent further audio processing
        scheduleListeningRestart = true;
        scheduledTime = millis() + 100; // Shorter delay
        
        // Clear audio buffer immediately to stop any queued audio
        audioBuffer.reset();
        
        unsigned long audio_end_ms = getSpeakingDuration();

        // Use ArduinoJson to create the message
        JsonDocument doc;
        doc["type"] = "instruction";
        doc["msg"] = "INTERRUPT";
        doc["audio_end_ms"] = audio_end_ms;
        
        String jsonString;
        serializeJson(doc, jsonString);
        
        // Take mutex to ensure clean WebSocket access
        if (xSemaphoreTake(wsMutex, pdMS_TO_TICKS(10)) == pdTRUE) {
          webSocket.sendTXT(jsonString);
          xSemaphoreGive(wsMutex);
        }
        }
    }

    // Release detection
    if (!isTouched && touched) {
      touched = false;
    }

    vTaskDelay(20);  // Reduced from 50ms to 20ms for better responsiveness
  }
  // (This point is never reached.)
  vTaskDelete(NULL);
}

void setupDeviceMetadata() {
    // factoryResetDevice();
    deviceState = IDLE;

    getAuthTokenFromNVS();
    getOTAStatusFromNVS();

    if (otaState == OTA_IN_PROGRESS || otaState == OTA_COMPLETE) {
        deviceState = OTA;
    }
    if (factory_reset_status) {
        deviceState = FACTORY_RESET;
    }
}

void setup()
{
    Serial.begin(115200);
    delay(500);

    // SETUP
    setupDeviceMetadata();
    wsMutex = xSemaphoreCreateMutex();    

    // INTERRUPT
    #ifdef TOUCH_MODE
        xTaskCreate(touchTask, "Touch Task", 4096, NULL, configMAX_PRIORITIES-1, NULL);
    #else
        getErr = esp_sleep_enable_ext0_wakeup(BUTTON_PIN, LOW);
        printOutESP32Error(getErr);
        Button *btn = new Button(BUTTON_PIN, false);
        btn->attachLongPressUpEventCb(&onButtonLongPressUpEventCb, NULL);
        btn->attachDoubleClickEventCb(&onButtonDoubleClickCb, NULL);
        btn->detachSingleClickEvent();
    #endif

    xTaskCreate(ledTask, "LED Task", 4096, NULL, 5, NULL);
    xTaskCreate(audioStreamTask, "Speaker Task", 4096, NULL, 3, NULL);
    xTaskCreate(micTask, "Microphone Task", 4096, NULL, 4, NULL);
    xTaskCreate(networkTask, "Websocket Task", 8192, NULL, configMAX_PRIORITIES-2, NULL);

    // WIFI
    setupWiFi();
}

void loop(){
    if (otaState == OTA_IN_PROGRESS)
    {
        loopOTA();
    }
}