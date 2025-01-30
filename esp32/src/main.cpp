

#include <Arduino.h>
#include "I2SHandler.h"
#include <WebSocketsClient.h>
#include <driver/i2s.h>
#include <driver/rtc_io.h>
#include "Button.h"

WebSocketsClient webSocket;
String authMessage;
int currentVolume = 50;
static bool micEnabled = true;

void setMicEnabled(bool enabled)
{
    micEnabled = enabled;
}

void enterSleep()
{
    Serial.println("Going to sleep...");
    webSocket.sendTXT("{\"speaker\": \"user\", \"is_ending\": true}");
    webSocket.disconnect();
    delay(200);
    Serial.flush();
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

// Wait until I2S has finished playing all queued samples
void drainI2SOutput() {
  // Option A: If i2s_write() blocks fully, you might be done already.
  // Option B: Force clear & small delay:
  i2s_zero_dma_buffer(I2S_PORT_OUT);

  // Give some time for final samples to finish playing 
  // (Adjust 50ms as needed for buffer size/sample rate)
  vTaskDelay(pdMS_TO_TICKS(50));
}

void webSocketEvent(WStype_t type, uint8_t *payload, size_t length)
{
    switch (type)
    {
    case WStype_DISCONNECTED:
        Serial.printf("[WSc] Disconnected!\n");
        digitalWrite(LED_PIN, HIGH);
        vTaskDelay(1000);
        break;
    case WStype_CONNECTED:
        Serial.printf("[WSc] Connected to url: %s\n", payload);
        digitalWrite(LED_PIN, LOW);
        break;
    case WStype_TEXT:
        Serial.printf("[WSc] get text: %s\n", payload);
        if (strcmp((char*)payload, "response.audio.done") == 0
          || strcmp((char*)payload, "response.done") == 0) {
        Serial.println("Audio stream complete. Draining I2S output...");
        drainI2SOutput();

        // Now that playback has finished, re-enable mic
        setMicEnabled(true);
        Serial.println("Microphone re-enabled");
      }
        break;
    case WStype_BIN:
    {

      // If this is the first audio chunk of a new TTS segment, disable the mic
      if (micEnabled) {
        Serial.println("Disabling mic for playback");
        setMicEnabled(false);
      }

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

const char *CA_cert = R"EOF(
-----BEGIN CERTIFICATE-----
MIIDejCCAmKgAwIBAgIQf+UwvzMTQ77dghYQST2KGzANBgkqhkiG9w0BAQsFADBX
MQswCQYDVQQGEwJCRTEZMBcGA1UEChMQR2xvYmFsU2lnbiBudi1zYTEQMA4GA1UE
CxMHUm9vdCBDQTEbMBkGA1UEAxMSR2xvYmFsU2lnbiBSb290IENBMB4XDTIzMTEx
NTAzNDMyMVoXDTI4MDEyODAwMDA0MlowRzELMAkGA1UEBhMCVVMxIjAgBgNVBAoT
GUdvb2dsZSBUcnVzdCBTZXJ2aWNlcyBMTEMxFDASBgNVBAMTC0dUUyBSb290IFI0
MHYwEAYHKoZIzj0CAQYFK4EEACIDYgAE83Rzp2iLYK5DuDXFgTB7S0md+8Fhzube
Rr1r1WEYNa5A3XP3iZEwWus87oV8okB2O6nGuEfYKueSkWpz6bFyOZ8pn6KY019e
WIZlD6GEZQbR3IvJx3PIjGov5cSr0R2Ko4H/MIH8MA4GA1UdDwEB/wQEAwIBhjAd
BgNVHSUEFjAUBggrBgEFBQcDAQYIKwYBBQUHAwIwDwYDVR0TAQH/BAUwAwEB/zAd
BgNVHQ4EFgQUgEzW63T/STaj1dj8tT7FavCUHYwwHwYDVR0jBBgwFoAUYHtmGkUN
l8qJUC99BM00qP/8/UswNgYIKwYBBQUHAQEEKjAoMCYGCCsGAQUFBzAChhpodHRw
Oi8vaS5wa2kuZ29vZy9nc3IxLmNydDAtBgNVHR8EJjAkMCKgIKAehhxodHRwOi8v
Yy5wa2kuZ29vZy9yL2dzcjEuY3JsMBMGA1UdIAQMMAowCAYGZ4EMAQIBMA0GCSqG
SIb3DQEBCwUAA4IBAQAYQrsPBtYDh5bjP2OBDwmkoWhIDDkic574y04tfzHpn+cJ
odI2D4SseesQ6bDrarZ7C30ddLibZatoKiws3UL9xnELz4ct92vID24FfVbiI1hY
+SW6FoVHkNeWIP0GCbaM4C6uVdF5dTUsMVs/ZbzNnIdCp5Gxmx5ejvEau8otR/Cs
kGN+hr/W5GvT1tMBjgWKZ1i4//emhA1JG1BbPzoLJQvyEotc03lXjTaCzv8mEbep
8RqZ7a2CPsgRbuvTPBwcOMBBmuFeU88+FSBX6+7iP0il8b4Z0QFqIwwMHfs/L6K1
vepuoxtGzi4CZ68zJpiq1UvSqTbFJjtbD4seiMHl
-----END CERTIFICATE-----
)EOF";

void websocket_setup(String server_domain, int port, String path)
{
    if (WiFi.status() != WL_CONNECTED)
    {
        Serial.println("Not connected to WiFi. Abandoning setup websocket");
        return;
    }
    Serial.println("connected to WiFi");
    Serial.println("Setting up websocket and debug info");
    Serial.println(server_domain);
    Serial.println(port);
    Serial.println(path);
    webSocket.begin(server_domain, port, path);
    // webSocket.beginSslWithCA(server_domain.c_str(), port, path.c_str(), CA_cert);
    webSocket.onEvent(webSocketEvent);
    // webSocket.setAuthorization("user", "Password");
    webSocket.setReconnectInterval(1000);
}

void connectWithPassword()
{
    WiFi.begin("EE-P8CX8N", "xd6UrFLd4kf9x4");

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
    websocket_setup("192.168.1.166", 8000, "/");
    // websocket_setup("starmoon.deno.dev",443, "/");
    // websocket_setup("xygbupeczfhwamhqnucy.supabase.co", 443, "/functions/v1/relay");
}

void micTask(void *parameter)
{
    i2s_install_mic();
    i2s_setpin_mic();
    i2s_start(I2S_PORT_IN);

    int i2s_read_len = 1024;
    size_t bytes_read;
    char *i2s_read_buff = (char *)calloc(i2s_read_len, sizeof(char));
    uint8_t *flash_write_buff = (uint8_t *)calloc(i2s_read_len, sizeof(char));

    while (1)
    {
        // Read audio data
        if (i2s_read(I2S_PORT_IN, (void *)i2s_read_buff, i2s_read_len, &bytes_read, portMAX_DELAY) == ESP_OK)
        {
            // Send directly to WebSocket
            if (webSocket.isConnected() && micEnabled)
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

esp_err_t getErr = ESP_OK;

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


    Button *btn = new Button(BUTTON_PIN, false);
    // Main button
    btn->attachLongPressUpEventCb(&onButtonLongPressUpEventCb, NULL);
    btn->attachDoubleClickEventCb(&onButtonDoubleClickCb, NULL);
    btn->detachSingleClickEvent();

    // pinMode(BUTTON_PIN, INPUT_PULLUP);
    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, HIGH);

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
