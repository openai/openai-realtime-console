

#include <Arduino.h>
#include "OTA.h"
#include "I2SHandler.h"
#include <WebSocketsClient.h>
#include <driver/rtc_io.h>
#include "Button.h"
#include "AudioTools.h"
#include "AudioTools/Concurrency/RTOS.h"
#include "LEDHandler.h"
#include "Config.h"
#include "WifiSetup.h"

// #define WEBSOCKETS_DEBUG_LEVEL WEBSOCKETS_LEVEL_ALL

// Create a high‑throughput buffer for raw audio data.
// Adjust the overall size and chunk size according to your needs.
constexpr size_t AUDIO_BUFFER_SIZE = 1024 * 64; // total bytes in the buffer
constexpr size_t AUDIO_CHUNK_SIZE  = 1024;         // ideal read/write chunk size

BufferRTOS<uint8_t> audioBuffer(AUDIO_BUFFER_SIZE, AUDIO_CHUNK_SIZE);

WebSocketsClient webSocket;
String authMessage;
int currentVolume = 70;

esp_err_t getErr = ESP_OK;

// Add these global variables
unsigned long connectionStartTime = 0;

DeviceState deviceState = IDLE;

void enterSleep()
{
    Serial.println("Going to sleep...");
    
    // First, change device state to prevent any new data processing
    deviceState = IDLE;
    
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
    
    // Now enter deep sleep
    esp_deep_sleep_start();
}

void scaleAudioVolume(uint8_t *input, uint8_t *output, size_t length, int volume)
{
    // Convert volume from 0-100 range to 0.0-1.0 range
    float volumeScale = volume / 100.0f;

    // Process 16-bit samples (2 bytes per sample)
    for (size_t i = 0; i < length; i += 2)
    {
        // Convert two bytes to a 16-bit signed integer
        int16_t sample = (input[i + 1] << 8) | input[i];

        // Scale the sample
        float scaledSample = sample * volumeScale;

        // Clamp the value to prevent overflow
        if (scaledSample > 32767)
            scaledSample = 32767;
        if (scaledSample < -32768)
            scaledSample = -32768;

        // Convert back to bytes
        int16_t finalSample = (int16_t)scaledSample;
        output[i] = finalSample & 0xFF;
        output[i + 1] = (finalSample >> 8) & 0xFF;
    }
}

void webSocketEvent(WStype_t type, uint8_t *payload, size_t length)
{
    switch (type)
    {
    case WStype_DISCONNECTED:
        Serial.printf("[WSc] Disconnected!\n");
        connectionStartTime = 0;  // Reset timer
        deviceState = IDLE;
        break;
    case WStype_CONNECTED:
        Serial.printf("[WSc] Connected to url: %s\n", payload);
        deviceState = PROCESSING;
        break;
    case WStype_TEXT:
    {
        Serial.printf("[WSc] get text: %s\n", payload);

        JsonDocument doc;
        DeserializationError error = deserializeJson(doc, (char *)payload);

        if (error)
        {
            Serial.println("Error deserializing JSON");
            deviceState = IDLE;
            return;
        }

        String type = doc["type"];

        // auth messages
        if (strcmp((char*)type.c_str(), "auth") == 0) {
            currentVolume = doc["volume_control"].as<int>();
            bool is_ota = doc["is_ota"].as<bool>();
            bool is_reset = doc["is_reset"].as<bool>();

            if (is_ota) {
                Serial.println("OTA update received");
                setOTAStatusInNVS(true);
                ESP.restart();
            }

            if (is_reset) {
                Serial.println("Factory reset received");
                setFactoryResetStatusInNVS(true);
                ESP.restart();
            }
        }

        // oai messages
        if (strcmp((char*)type.c_str(), "oai") == 0) {
            String msg = doc["msg"];

            // receive response.audio.done or response.done, then start listening again
            if (strcmp((char*)msg.c_str(), "response.done") == 0) {
                Serial.println("Received response.done, starting listening again");
                
                // TODO(akdeb): differs with wifi speeds
                delay(2000);

                // Start listening again
                connectionStartTime = millis();  // Start timer
                deviceState = LISTENING;
            } else if (strcmp((char*)msg.c_str(), "response.created") == 0) {
                Serial.println("Received response.created, stopping listening");
                connectionStartTime = 0;
                deviceState = SPEAKING;
            }
        }
    }
        break;
    case WStype_BIN:
    {
        size_t chunkSize = length;

            // Allocate a temporary buffer for volume scaling.
            uint8_t *scaledAudio = (uint8_t *)malloc(chunkSize);
            if (!scaledAudio) {
                Serial.println("Failed to allocate scaled audio buffer");
                break;
            }
            
            // Scale the audio as you do currently.
            scaleAudioVolume(payload, scaledAudio, chunkSize, currentVolume);
            
            // Attempt to write to the BufferRTOS.
            size_t written = audioBuffer.writeArray(scaledAudio, chunkSize);
            if (written < chunkSize) {
                Serial.printf("BufferRTOS overflow: only wrote %d/%d bytes, dropping some audio data\n", written, chunkSize);
            }
            
            free(scaledAudio);
    }
    break;

    case WStype_ERROR:
        Serial.printf("[WSc] Error: %s\n", payload);    
        break;
    case WStype_FRAGMENT_TEXT_START:
    case WStype_FRAGMENT_BIN_START:
    case WStype_FRAGMENT:
    case WStype_PONG:
    case WStype_PING:
    case WStype_FRAGMENT_FIN:
        break;
    }
}

void websocket_setup(String server_domain, int port, String path)
{
    if (AP_status) {
        Serial.println("Closing access point");
        closeAP();
    }

    String headers = "Authorization: Bearer " + String(authTokenGlobal);
    webSocket.setExtraHeaders(headers.c_str());
    webSocket.onEvent(webSocketEvent);
    webSocket.setReconnectInterval(1000);
    webSocket.enableHeartbeat(25000, 5000, 3);

    webSocket.beginSslWithCA(server_domain.c_str(), port, path.c_str(), CA_cert);
    // webSocket.begin(server_domain.c_str(), port, path.c_str());
}

void micTask(void *parameter)
{
    i2s_install_mic();
    i2s_setpin_mic();
    i2s_start(I2S_PORT_IN);

    const int i2s_read_len = 2048;
    size_t bytes_read;
    char *i2s_read_buff = (char *)calloc(i2s_read_len, 1);
    char *flash_write_buff = (char *)calloc(i2s_read_len, 1);

    while (1) {
        // Check for VAD timeout
        if (connectionStartTime && deviceState == LISTENING && 
            millis() - connectionStartTime >= 10000) {
            webSocket.sendTXT("{\"type\": \"instruction\", \"msg\": \"end_of_speech\"}");
            connectionStartTime = 0;
            deviceState = PROCESSING;
            Serial.println("Sent VAD detection request");
        }

        // Read audio data
        if (deviceState == LISTENING && webSocket.isConnected())
        {
            if (i2s_read(I2S_PORT_IN, (void *)i2s_read_buff, i2s_read_len,
                     &bytes_read, portMAX_DELAY) == ESP_OK)
            {
                // Scale or convert if needed
                i2s_adc_data_scale((uint8_t*)flash_write_buff,
                                   (uint8_t*)i2s_read_buff,
                                   bytes_read);

                // Allocate a temporary buffer for sending
                uint8_t* safeSend = (uint8_t*) malloc(bytes_read);
                memcpy(safeSend, flash_write_buff, bytes_read);

                // Now send
                webSocket.sendBIN(safeSend, bytes_read);

                // Free the temp buffer
                free(safeSend);
            }
        }
        vTaskDelay(10);
    }

    free(i2s_read_buff);
    free(flash_write_buff);
    vTaskDelete(NULL);
}

void audioPlaybackTask(void *param)
{
    i2s_install_speaker();
    i2s_setpin_speaker();
    i2s_start(I2S_PORT_OUT);
    // Allocate a local buffer to temporarily hold the audio data to be written to I2S.
    uint8_t* localBuffer = (uint8_t*)malloc(AUDIO_CHUNK_SIZE);
    if (!localBuffer) {
        Serial.println("Failed to allocate local I2S buffer");
        vTaskDelete(NULL);
        return;
    }

    while (1) {
        // Check how many bytes are available in the BufferRTOS.
        size_t available = audioBuffer.available();

        if (available >= AUDIO_CHUNK_SIZE && deviceState == SPEAKING) {
            // Read a chunk from the buffer.
            size_t bytesRead = audioBuffer.readArray(localBuffer, AUDIO_CHUNK_SIZE);
            
            // Now write that chunk to I2S.
            size_t bytesWritten = 0;
            // i2s_write writes the data to the I2S peripheral.
            // Adjust I2S_PORT_OUT if your configuration differs.
            esp_err_t err = i2s_write(I2S_PORT_OUT, (const char*)localBuffer, AUDIO_CHUNK_SIZE, &bytesWritten, portMAX_DELAY);
            if (err != ESP_OK) {
                Serial.printf("I2S write error: %d\n", err);
            }
        } else {
            // Not enough data available: yield a bit to allow more data to accumulate.
            vTaskDelay(pdMS_TO_TICKS(5));
        }
    }

    // Clean up (this point will never be reached in this endless loop).
    free(localBuffer);
    vTaskDelete(NULL);
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

void connectToNewWifiNetwork() {
    openAP(); // Start the AP immediately as a fallback

    // Wait for user interaction or timeout
    unsigned long startTime = millis();
    const unsigned long timeout = 600000; // 10 minutes

    Serial.println("Waiting for user interaction or timeout...");
    while ((millis() - startTime) < timeout)
    {
        dnsServer.processNextRequest(); // Process DNS requests
        if (WiFi.status() == WL_CONNECTED && !authTokenGlobal.isEmpty())
        {
            Serial.println("WiFi connected while AP was active!");
            playStartupSound();
            ESP.restart();
            return;
        }
        yield();
    }

    Serial.println("Timeout expired. Going to sleep.");
    enterSleep();
}

void connectToWifiAndWebSocket()
{
    IPAddress dns1(8, 8, 8, 8);        // Google DNS
    IPAddress dns2(1, 1, 1, 1);        // Cloudflare DNS
    WiFi.config(INADDR_NONE, INADDR_NONE, INADDR_NONE, dns1, dns2);

    if (!authTokenGlobal.isEmpty() && wifiConnect() == 1) // Successfully connected and has auth token
    {
        Serial.println("WiFi connected with existing network!");
        ota_status ? performOTAUpdate() : (factory_reset_status ? setResetComplete() : websocket_setup(ws_server, ws_port, ws_path));
        return; // Connection successful
    }

    // if no existing network, connect to new network
    connectToNewWifiNetwork();
}

void connectWithPassword()
{
    IPAddress dns1(8, 8, 8, 8);        // Google DNS
    IPAddress dns2(1, 1, 1, 1);        // Cloudflare DNS
    WiFi.config(INADDR_NONE, INADDR_NONE, INADDR_NONE, dns1, dns2);

    WiFi.begin("EE-P8CX8N", "xd6UrFLd4kf9x4");
    // WiFi.begin("akaPhone", "akashclarkkent1");

    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print("|");
    }
    Serial.println("");
    Serial.println("WiFi connected");

    WiFi.setSleep(false);
    esp_wifi_set_ps(WIFI_PS_NONE);  // Disable power saving completely
    playStartupSound();
    websocket_setup(ws_server, ws_port, ws_path);
}

void setup()
{
    Serial.begin(115200);
    delay(500);

     while (!Serial)
        ;

    // Print a welcome message to the Serial port.
    Serial.println("\n\nCaptive Test, V0.5.0 compiled " __DATE__ " " __TIME__ " by CD_FER"); //__DATE__ is provided by the platformio ide
    Serial.printf("%s-%d\n\r", ESP.getChipModel(), ESP.getChipRevision());

    getErr = esp_sleep_enable_ext0_wakeup(BUTTON_PIN, LOW);
    printOutESP32Error(getErr);

    // BUTTON
    Button *btn = new Button(BUTTON_PIN, false);
    btn->attachLongPressUpEventCb(&onButtonLongPressUpEventCb, NULL);
    btn->attachDoubleClickEventCb(&onButtonDoubleClickCb, NULL);
    btn->detachSingleClickEvent();
        
    // LED
    setupRGBLED();
    xTaskCreate(ledTask, "LED Task", 4096, NULL, 5, NULL);

    // AUTH & OTA
    getAuthTokenFromNVS();
    getOTAStatusFromNVS();
    getFactoryResetStatusFromNVS();

    deviceState = IDLE;
    if (ota_status) {
        deviceState = OTA;
    }
    if (factory_reset_status) {
        deviceState = FACTORY_RESET;
    }

    // WIFI
    // connectWithPassword();
    connectToWifiAndWebSocket();

    // RTOS -- MICROPHONE & SPEAKER
    xTaskCreate(audioPlaybackTask, "Audio Playback", 4096, NULL, 2, NULL);
    xTaskCreate(micTask, "Microphone Task", 4096, NULL, 4, NULL);
}

void loop()
{
    if (ota_status)
    {
        loopOTA();
    }
    else
    {
        webSocket.loop();
        if (WiFi.getMode() == WIFI_MODE_AP)
        {
            dnsServer.processNextRequest();
        }
    }
    delay(10); 
}
