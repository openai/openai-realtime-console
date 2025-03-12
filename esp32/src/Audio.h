
#include "Print.h"
#include "Config.h"
#include "AudioTools.h"
#include "AudioTools/Concurrency/RTOS.h"
#include "AudioTools/AudioCodecs/CodecOpus.h"
#include <WebSocketsClient.h>

extern SemaphoreHandle_t wsMutex;
extern WebSocketsClient webSocket;

extern TaskHandle_t speakerTaskHandle;
extern TaskHandle_t micTaskHandle;
extern TaskHandle_t networkTaskHandle;

extern bool scheduleListeningRestart;
extern unsigned long scheduledTime;
extern unsigned long speakingStartTime;  // Add this to track when speaking starts

extern int currentVolume;
extern const int CHANNELS;         // Mono
extern const int BITS_PER_SAMPLE; // 16-bit audio

// AUDIO OUTPUT
constexpr size_t AUDIO_BUFFER_SIZE = 1024 * 10;     // total bytes in the buffer
constexpr size_t AUDIO_CHUNK_SIZE  = 1024;         // ideal read/write chunk size
extern OpusAudioDecoder opusDecoder;
extern BufferRTOS<uint8_t> audioBuffer;
extern I2SStream i2s; 
extern VolumeStream volume;
extern QueueStream<uint8_t> queue;
extern StreamCopy copier;
extern AudioInfo info;

// AUDIO INPUT
extern I2SStream i2sInput;
extern StreamCopy micToWsCopier;

// WEBSOCKET
void webSocketEvent(WStype_t type, uint8_t *payload, size_t length);
void websocketSetup(String server_domain, int port, String path);
void networkTask(void *parameter);

// AUDIO OUTPUT
unsigned long getSpeakingDuration();
void audioStreamTask(void *parameter);

// AUDIO INPUT
void micTask(void *parameter);
