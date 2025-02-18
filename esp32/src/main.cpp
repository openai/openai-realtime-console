

#include <Arduino.h>
#include "I2SHandler.h"
#include <WebSocketsClient.h>
#include <driver/rtc_io.h>
#include "Button.h"
#include "AudioTools.h"
#include "AudioTools/Concurrency/RTOS.h"
#include "AudioTools/AudioCodecs/CodecOpus.h"
#include "LEDHandler.h"
#include "Config.h"
#include "SPIFFS.h"

// #define WEBSOCKETS_DEBUG_LEVEL WEBSOCKETS_LEVEL_ALL

// Create a high‑throughput buffer for raw audio data.
// Adjust the overall size and chunk size according to your needs.
constexpr size_t AUDIO_BUFFER_SIZE = 1024 * 10; // total bytes in the buffer
constexpr size_t AUDIO_CHUNK_SIZE  = 1024;         // ideal read/write chunk size

// Define your audio parameters – these must match what the encoder used.
const int CHANNELS = 1;         // Mono
const int BITS_PER_SAMPLE = 16; // 16-bit audio

// Global instance of the Opus decoder
OpusAudioDecoder opusDecoder;

BufferRTOS<uint8_t> audioBuffer(AUDIO_BUFFER_SIZE, AUDIO_CHUNK_SIZE);


// Create a custom I2S stream instance (you can modify this class if you want full control over your I2S config)
I2SStream i2s; 
VolumeStream volume(i2s);
QueueStream<uint8_t> queue(audioBuffer);
StreamCopy copier(volume, queue);

// Audio configuration structure using AudioTools’ AudioInfo
AudioInfo info(SAMPLE_RATE, CHANNELS, BITS_PER_SAMPLE);

Task audioStreamTask("I2S_Copy", 4000, 2, 0);

WebSocketsClient webSocket;
String authMessage;
int currentVolume = 100;

esp_err_t getErr = ESP_OK;

// Add these global variables
unsigned long connectionStartTime = 0;

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
            volume.setVolume(currentVolume / 100.0f);  // Set initial volume (e.g., 70/100 = 0.7)

            if (is_ota) {
                Serial.println("OTA update received");
                // setOTAStatusInNVS(true);
                ESP.restart();
            }

            if (is_reset) {
                Serial.println("Factory reset received");
                // setFactoryResetStatusInNVS(true);
                ESP.restart();
            }
        }

        // oai messages
        if (strcmp((char*)type.c_str(), "oai") == 0) {
            String msg = doc["msg"];

            // receive response.audio.done or response.done, then start listening again
            if (strcmp((char*)msg.c_str(), "response.done") == 0) {
                Serial.println("Received response.done, starting listening again");
                // Start listening again

                // TODO(akdeb): differs with wifi speeds
                delay(1000);
                connectionStartTime = millis();  // Start timer
                deviceState = LISTENING;
                digitalWrite(10, LOW);
            } else if (strcmp((char*)msg.c_str(), "response.created") == 0) {
                Serial.println("Received response.created, stopping listening");
                connectionStartTime = 0;
                deviceState = SPEAKING;
                digitalWrite(10, HIGH);
            }
        }
    }
        break;
    case WStype_BIN:
    {
        size_t chunkSize = length;

        // (Optional) Print the received opus packet for debugging.
        Serial.println("Received encoded Opus packet:");
        for (size_t i = 0; i < chunkSize; i++) {
          Serial.print(payload[i], HEX);
          Serial.print(" ");
        }
        Serial.println();

        // Pass the received opus packet to the decoder.
        // The decoder's write() method will decode and output PCM via BufferPrint.
        size_t processed = opusDecoder.write(payload, chunkSize);
        if (processed != chunkSize) {
          Serial.printf("Warning: Only processed %d/%d bytes\n", processed, chunkSize);
        }

        // Print the updated buffer usage after decoding.
    size_t available = audioBuffer.available();
    Serial.printf("After decoding, Buffer Usage: %d / %d bytes\n", available, audioBuffer.size());
    
        break;
      }
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

void websocketSetup(String server_domain, int port, String path)
{
    String headers = "Authorization: Bearer " + String(authTokenGlobal);
    webSocket.setExtraHeaders(headers.c_str());
    webSocket.onEvent(webSocketEvent);
    webSocket.setReconnectInterval(1000);
    webSocket.enableHeartbeat(25000, 15000, 3);

    #ifdef DEV_MODE
    webSocket.begin(server_domain.c_str(), port, path.c_str());
    #else
    webSocket.beginSslWithCA(server_domain.c_str(), port, path.c_str(), CA_cert);
    #endif
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

    // Allocate the temporary sending buffer just once.
    uint8_t* tempBuffer = (uint8_t*)malloc(i2s_read_len);
    if (!tempBuffer) {
        Serial.println("Failed to allocate temporary buffer");
        vTaskDelete(NULL);
        return;
    }

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

                // Reuse the preallocated tempBuffer by copying flash_write_buff into it.
                memcpy(tempBuffer, flash_write_buff, bytes_read);

                // Now send the data without doing per-iteration malloc/free.
                webSocket.sendBIN(tempBuffer, bytes_read);
            }
        }
        vTaskDelay(10);
    }

    // Cleanup if loop ever terminates.
    free(tempBuffer);
    free(i2s_read_buff);
    free(flash_write_buff);
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

void connectWithPassword()
{
    IPAddress dns1(8, 8, 8, 8);        // Google DNS
    IPAddress dns2(1, 1, 1, 1);        // Cloudflare DNS
    WiFi.config(INADDR_NONE, INADDR_NONE, INADDR_NONE, dns1, dns2);

    // WiFi.begin("EE-P8CX8N", "xd6UrFLd4kf9x4");
    // WiFi.begin("akaPhone", "akashclarkkent1");
    WiFi.begin("S_HOUSE_RESIDENTS_NW", "Somerset_Residents!");
    // WiFi.begin("NOWBQPME", "JYHx4Svzwv5S");
    // WiFi.begin("EE-PPA1GZ", "9JkyRJHXTDTKb3");


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

#include "Print.h"

class BufferPrint : public Print {
public:
  BufferPrint(BufferRTOS<uint8_t>& buf) : _buffer(buf) {}

  // Write a single byte to the buffer.
  virtual size_t write(uint8_t data) override {
    return _buffer.writeArray(&data, 1);
  }

  // Write an array of bytes to the buffer.
  virtual size_t write(const uint8_t *buffer, size_t size) override {
    return _buffer.writeArray(buffer, size);
  }

private:
  BufferRTOS<uint8_t>& _buffer;
};

// Create a global instance of the Print wrapper
BufferPrint bufferPrint(audioBuffer);

 void networkTask(void *pvParameters) {
         while (1) {
             webSocket.loop();   // Handle WebSocket events continuously
             vTaskDelay(1);      // Small delay to yield CPU to higher priority tasks
         }
     }

  
void setupAudioStream() {
    Serial.println("Starting I2S stream pipeline...");
    
    // Start the queue stream (this will initialize its internal structures)
    queue.begin();

    // Set up your I2S configuration.
    // The I2SStream class here uses a default configuration which you can override.
    auto config = i2s.defaultConfig(TX_MODE);
    config.bits_per_sample = BITS_PER_SAMPLE;
    config.sample_rate = SAMPLE_RATE;
    config.channels = CHANNELS;
    config.pin_bck = I2S_BCK_OUT;
    config.pin_ws = I2S_WS_OUT;
    config.pin_data = I2S_DATA_OUT;
    config.port_no = I2S_PORT_OUT;

    config.copyFrom(info);  // Copy your audio settings into the I2S configuration.
    i2s.begin(config);      // Begin I2S output with your configuration.

    // Setup VolumeStream using the same configuration as I2S.
    auto vcfg = volume.defaultConfig();
    vcfg.copyFrom(config);
    vcfg.allow_boost = true;
    volume.begin(vcfg);     // Begin the volume stream with the provided configuration.

    // Start the task which continuously copies data from BufferRTOS (via queue) to I2S stream.
    audioStreamTask.begin([](){
         while (1) {
             copier.copy();  
             // Depending on your data rate, you might add a small delay or yield here.
         }
    });
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

    pinMode(10, OUTPUT);

  OpusSettings cfg;
  cfg.sample_rate = SAMPLE_RATE;
  cfg.channels = CHANNELS;
  cfg.bits_per_sample = BITS_PER_SAMPLE;
  cfg.max_buffer_size = 6144;
  opusDecoder.setOutput(bufferPrint);
  
  // Initialize the Opus decoder with the audio configuration.
  // (Check your library’s documentation for the exact initialization call.)
  opusDecoder.begin(cfg);

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

    deviceState = IDLE;
    if (ota_status) {
        deviceState = OTA;
    }
    if (factory_reset_status) {
        deviceState = FACTORY_RESET;
    }

    setupAudioStream();

    xTaskCreate(micTask, "Microphone Task", 4096, NULL, 4, NULL);
    xTaskCreate(networkTask, "Network Task", 8192, NULL, configMAX_PRIORITIES-1, NULL);
    // WIFI
    connectWithPassword();
    // connectToWifiAndWebSocket();
}

void loop()
{}