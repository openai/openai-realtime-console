#include "OTA.h"
#include "Print.h"
#include "Config.h"
#include "AudioTools.h"
#include "AudioTools/Concurrency/RTOS.h"
#include "AudioTools/AudioCodecs/CodecOpus.h"
#include <WebSocketsClient.h>
#include "Audio.h"

// WEBSOCKET
SemaphoreHandle_t wsMutex;
WebSocketsClient webSocket;

// TASK HANDLES
TaskHandle_t speakerTaskHandle = NULL;
TaskHandle_t micTaskHandle = NULL;
TaskHandle_t networkTaskHandle = NULL;

// TIMING REGISTERS
bool scheduleListeningRestart = false;
unsigned long scheduledTime = 0;
unsigned long speakingStartTime = 0;

// AUDIO SETTINGS
int currentVolume = 70;
const int CHANNELS = 1;         // Mono
const int BITS_PER_SAMPLE = 16; // 16-bit audio

// AUDIO OUTPUT
class BufferPrint : public Print {
public:
  BufferPrint(BufferRTOS<uint8_t>& buf) : _buffer(buf) {}

  virtual size_t write(uint8_t data) override {
    if (webSocket.isConnected() && deviceState == SPEAKING) {
        return _buffer.writeArray(&data, 1);
    }
    return 0;
  }

  virtual size_t write(const uint8_t *buffer, size_t size) override {
    if (webSocket.isConnected() && deviceState == SPEAKING) {
        return _buffer.writeArray(buffer, size);
    }
    return 0;
  }

private:
  BufferRTOS<uint8_t>& _buffer;
};

BufferPrint bufferPrint(audioBuffer);
OpusAudioDecoder opusDecoder;
BufferRTOS<uint8_t> audioBuffer(AUDIO_BUFFER_SIZE, AUDIO_CHUNK_SIZE);
I2SStream i2s; 
VolumeStream volume(i2s);
QueueStream<uint8_t> queue(audioBuffer);
StreamCopy copier(volume, queue);
AudioInfo info(SAMPLE_RATE, CHANNELS, BITS_PER_SAMPLE);

unsigned long getSpeakingDuration() {
    if (deviceState == SPEAKING && speakingStartTime > 0) {
        return millis() - speakingStartTime;
    }
    return 0;
}

void transitionToSpeaking() {    
    vTaskDelay(50);

    i2sInput.flush();
    
    if (xSemaphoreTake(wsMutex, pdMS_TO_TICKS(100)) == pdTRUE) {
        deviceState = SPEAKING;
        digitalWrite(10, HIGH);
        speakingStartTime = millis();
        
        webSocket.enableHeartbeat(25000, 15000, 3);
        xSemaphoreGive(wsMutex);
    }
    
    Serial.println("Transitioned to speaking mode");
}

void transitionToListening() {
    deviceState = PROCESSING;   
    scheduleListeningRestart = false;
    Serial.println("Transitioning to listening mode");

    // These stream operations don't directly interact with the WebSocket
    i2s.flush();
    volume.flush();
    queue.flush();
    i2sInput.flush();
    audioBuffer.reset();    

    Serial.println("Transitioned to listening mode");
    deviceState = LISTENING;
    digitalWrite(10, LOW);

    if (xSemaphoreTake(wsMutex, pdMS_TO_TICKS(100)) == pdTRUE) {
        webSocket.disableHeartbeat();
        xSemaphoreGive(wsMutex);
    }
}

void audioStreamTask(void *parameter) {
    Serial.println("Starting I2S stream pipeline...");
    
    pinMode(10, OUTPUT);

    OpusSettings cfg;
    cfg.sample_rate = SAMPLE_RATE;
    cfg.channels = CHANNELS;
    cfg.bits_per_sample = BITS_PER_SAMPLE;
    cfg.max_buffer_size = 6144;
    opusDecoder.setOutput(bufferPrint);
    opusDecoder.begin(cfg);
    
    queue.begin();

    auto config = i2s.defaultConfig(TX_MODE);
    config.bits_per_sample = BITS_PER_SAMPLE;
    config.sample_rate = SAMPLE_RATE;
    config.channels = CHANNELS;
    config.pin_bck = I2S_BCK_OUT;
    config.pin_ws = I2S_WS_OUT;
    config.pin_data = I2S_DATA_OUT;
    config.port_no = I2S_PORT_OUT;

    config.copyFrom(info);  
    i2s.begin(config);    

    auto vcfg = volume.defaultConfig();
    vcfg.copyFrom(config);
    vcfg.allow_boost = true;
    volume.begin(vcfg);   

    while (1) {
        if (webSocket.isConnected() && deviceState == SPEAKING) {
            copier.copy();  
        }
        vTaskDelay(1); 
    }
}


// AUDIO INPUT SETTINGS
class WebsocketStream : public Print {
public:
    virtual size_t write(uint8_t b) override {
        if (!webSocket.isConnected() || deviceState != LISTENING) {
            return 1;
        }
        
        if (xSemaphoreTake(wsMutex, pdMS_TO_TICKS(100)) == pdTRUE) {
            webSocket.sendBIN(&b, 1);
            xSemaphoreGive(wsMutex);
            return 1;
        }
        
        return 1;
    }
    
    virtual size_t write(const uint8_t *buffer, size_t size) override {
        if (size == 0 || !webSocket.isConnected() || deviceState != LISTENING) {
            return size;
        }
        
        
        if (xSemaphoreTake(wsMutex, pdMS_TO_TICKS(100)) == pdTRUE) {
            webSocket.sendBIN(buffer, size);
            xSemaphoreGive(wsMutex);
            return size;
        }

        return size;
    }
};

WebsocketStream wsStream;
I2SStream i2sInput;
StreamCopy micToWsCopier(wsStream, i2sInput);
const int MIC_COPY_SIZE = 64;

void micTask1(void *parameter) {
    // Configure and start I2S input stream.
    auto i2sConfig = i2sInput.defaultConfig(RX_MODE);
    i2sConfig.bits_per_sample = BITS_PER_SAMPLE;
    i2sConfig.sample_rate = SAMPLE_RATE;
    i2sConfig.channels = CHANNELS;
    i2sConfig.i2s_format = I2S_LEFT_JUSTIFIED_FORMAT;
    i2sConfig.channel_format = I2S_CHANNEL_FMT_ONLY_LEFT;

    i2sConfig.pin_bck = I2S_SCK;
    i2sConfig.pin_ws  = I2S_WS;
    i2sConfig.pin_data = I2S_SD;
    i2sConfig.port_no = I2S_PORT_IN;
    i2sInput.begin(i2sConfig);
    
    while (1) {
        if (scheduleListeningRestart && millis() >= scheduledTime) {
            transitionToListening();
        }

        if (deviceState == LISTENING && webSocket.isConnected()) {
            micToWsCopier.copyBytes(MIC_COPY_SIZE);
        }

        vTaskDelay(1);
    }
}

void micTask(void *parameter) {
    // Configure and start I2S input stream.
    auto i2sConfig = i2sInput.defaultConfig(RX_MODE);
    i2sConfig.bits_per_sample = BITS_PER_SAMPLE;
    i2sConfig.sample_rate = SAMPLE_RATE;
    i2sConfig.channels = CHANNELS;
    i2sConfig.i2s_format = I2S_LEFT_JUSTIFIED_FORMAT;
    i2sConfig.channel_format = I2S_CHANNEL_FMT_ONLY_LEFT;
    // Configure your I2S input pins appropriately here:
    i2sConfig.pin_bck = I2S_SCK;
    i2sConfig.pin_ws  = I2S_WS;
    i2sConfig.pin_data = I2S_SD;
    i2sConfig.port_no = I2S_PORT_IN;
    i2sInput.begin(i2sConfig);

    while (1) {
        // Check to see if a transition to listening mode is scheduled.
        if (scheduleListeningRestart && millis() >= scheduledTime) {
            transitionToListening();
        }

        if (deviceState == LISTENING && webSocket.isConnected()) {
            // Use smaller chunk size to avoid blocking too long
            micToWsCopier.copy(); // Reduced from 32
            
            // Yield more frequently
            vTaskDelay(1);
        } else {
            vTaskDelay(10);
        }
    }
}

// WEBSOCKET EVENTS
void webSocketEvent(WStype_t type, uint8_t *payload, size_t length)
{
    switch (type)
    {
    case WStype_DISCONNECTED:
        Serial.printf("[WSc] Disconnected!\n");
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
                setOTAStatusInNVS(OTA_IN_PROGRESS);
                ESP.restart();
            }

            if (is_reset) {
                Serial.println("Factory reset received");
                // setFactoryResetStatusInNVS(true);
                ESP.restart();
            }
        }

        // oai messages
        if (strcmp((char*)type.c_str(), "server") == 0) {
            String msg = doc["msg"];
            Serial.println(msg);

            if (strcmp((char*)msg.c_str(), "RESPONSE.COMPLETE") == 0 || strcmp((char*)msg.c_str(), "RESPONSE.ERROR") == 0) {
                Serial.println("Received RESPONSE.COMPLETE or RESPONSE.ERROR, starting listening again");
                scheduleListeningRestart = true;
                scheduledTime = millis() + 1000; // 1 second delay
            } else if (strcmp((char*)msg.c_str(), "AUDIO.COMMITTED") == 0) {
                deviceState = PROCESSING; 
            } else if (strcmp((char*)msg.c_str(), "RESPONSE.CREATED") == 0) {
                Serial.println("Received RESPONSE.CREATED, transitioning to speaking");
                transitionToSpeaking();
            } 
        }
    }
        break;
    case WStype_BIN:
    {
        if (scheduleListeningRestart || deviceState != SPEAKING) {
            Serial.println("Skipping audio data due to touch interrupt.");
            break;
        }

        // Otherwise process the audio data normally
        size_t processed = opusDecoder.write(payload, length);
        if (processed != length) {
            Serial.printf("Warning: Only processed %d/%d bytes\n", processed, length);
        }
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

    #ifdef DEV_MODE
    webSocket.begin(server_domain.c_str(), port, path.c_str());
    #else
    webSocket.beginSslWithCA(server_domain.c_str(), port, path.c_str(), CA_cert);
    #endif
}

void networkTask(void *parameter) {
    while (1) {
        webSocket.loop();
        vTaskDelay(1);
    }
}

