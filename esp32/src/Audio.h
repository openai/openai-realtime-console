
#include "Print.h"
#include "Config.h"
#include "AudioTools.h"
#include "AudioTools/Concurrency/RTOS.h"
#include "AudioTools/AudioCodecs/CodecOpus.h"
#include <WebSocketsClient.h>

extern SemaphoreHandle_t wsMutex;

extern bool scheduleListeningRestart;
extern unsigned long scheduledTime;
extern unsigned long connectionStartTime;

extern WebSocketsClient webSocket;
extern int currentVolume;

// Adjust the overall size and chunk size according to your needs.
constexpr size_t AUDIO_BUFFER_SIZE = 1024 * 10; // total bytes in the buffer
constexpr size_t AUDIO_CHUNK_SIZE  = 1024;         // ideal read/write chunk size

// Define your audio parameters – these must match what the encoder used.
extern const int CHANNELS;         // Mono
extern const int BITS_PER_SAMPLE; // 16-bit audio

// Global instance of the Opus decoder
extern OpusAudioDecoder opusDecoder;

extern BufferRTOS<uint8_t> audioBuffer;


// Create a custom I2S stream instance (you can modify this class if you want full control over your I2S config)
extern I2SStream i2s; 
extern VolumeStream volume;
extern QueueStream<uint8_t> queue;
extern StreamCopy copier;

// Audio configuration structure using AudioTools’ AudioInfo
extern AudioInfo info;

// extern Task audioStreamTask;

// // Global instance of the WebsocketStream wrapper.
// extern WebsocketStream wsStream;

// Suppose you have an I2SStream (or you can wrap your I2S mic reading routine similarly).
extern I2SStream i2sInput;

// And you can use the AudioTools stream copy mechanism.
extern StreamCopy micToWsCopier;

void webSocketEvent(WStype_t type, uint8_t *payload, size_t length);

void websocketSetup(String server_domain, int port, String path);

 void networkTask(void *parameter);
void audioStreamTask(void *parameter);
void micTask(void *parameter);
