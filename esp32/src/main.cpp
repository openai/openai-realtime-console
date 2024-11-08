

#include <Arduino.h>
#include "I2SHandler.h"
#include <WebSocketsClient.h>
#include <driver/i2s.h>
#include <driver/rtc_io.h>

WebSocketsClient webSocket;
String authMessage;
int currentVolume = 50;

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
        digitalWrite(LED_PIN, LOW);
        vTaskDelay(1000);
        break;
    case WStype_CONNECTED:
        Serial.printf("[WSc] Connected to url: %s\n", payload);
        // webSocket.sendBIN(testPayload, sizeof(testPayload));
        digitalWrite(LED_PIN, HIGH);
        break;
    case WStype_TEXT:
        Serial.printf("[WSc] get text: %s\n", payload);
        break;
    case WStype_BIN:
    {

        // Create a buffer for the scaled audio
        uint8_t *scaledAudio = (uint8_t *)malloc(length);
        scaleAudioVolume(payload, scaledAudio, length, currentVolume);

        size_t bytes_written;
        esp_err_t err = i2s_write(I2S_PORT_OUT, scaledAudio, length, &bytes_written, portMAX_DELAY);

        Serial.printf("I2S write result: %s, bytes written: %d\n", esp_err_to_name(err), bytes_written);
        free(scaledAudio);
    }
    break;
    case WStype_ERROR:
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
    if (WiFi.status() != WL_CONNECTED)
    {
        Serial.println("Not connected to WiFi. Abandoning setup websocket");
        return;
    }
    Serial.println("connected to WiFi");
    webSocket.begin(server_domain, port, path);
    webSocket.onEvent(webSocketEvent);
    // webSocket.setAuthorization("user", "Password");
    webSocket.setReconnectInterval(1000);
}

void connectWithPassword()
{
    WiFi.begin("launchlab", "LaunchLabRocks");

    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print("|");
    }
    Serial.println("");
    Serial.println("WiFi connected");

    WiFi.setSleep(false);

    // Connect to WebSocket if successfully registered
    Serial.println("Connecting to WebSocket server...");
    websocket_setup("192.168.2.236", 8081, "/");
}

#define NOISE_THRESHOLD 100 // Adjust based on noise level

void micTask(void *parameter)
{
    i2s_install_mic();
    i2s_setpin_mic();
    i2s_start(I2S_PORT_IN);

    int i2s_read_len = 4096;
    size_t bytes_read;
    char *i2s_read_buff = (char *)calloc(i2s_read_len, sizeof(char));
    uint8_t *flash_write_buff = (uint8_t *)calloc(i2s_read_len, sizeof(char));

    while (1)
    {
        // Read audio data
        if (i2s_read(I2S_PORT_IN, (void *)i2s_read_buff, i2s_read_len, &bytes_read, portMAX_DELAY) == ESP_OK)
        {
            // Send directly to WebSocket
            if (webSocket.isConnected())
            {
                i2s_adc_data_scale(flash_write_buff, (uint8_t *)i2s_read_buff, i2s_read_len);
                webSocket.sendBIN((uint8_t *)i2s_read_buff, bytes_read);
            }
        }
        vTaskDelay(1); // Short delay to keep task responsive
    }

    free(i2s_read_buff); // Free if task exits, but it shouldn’t
    vTaskDelete(NULL);
}

void setup()
{
    Serial.begin(115200);
    delay(500);

    pinMode(BUTTON_PIN, INPUT_PULLUP);
    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, LOW);

    connectWithPassword();

    i2s_install_speaker();
    i2s_setpin_speaker();

    // Get the actual sample rate - updated to match new function signature
    float real_rate = i2s_get_clk(I2S_PORT_OUT);
    Serial.printf("Actual I2S sample rate: %.0f Hz\n", real_rate);

    // xTaskCreate(buttonTask, "Button Task", 8192, NULL, 5, NULL);
    xTaskCreate(micTask, "Microphone Task", 4096, NULL, 4, NULL);
}

void loop()
{
    webSocket.loop();
}
