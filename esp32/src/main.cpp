

#include <Arduino.h>
#include "I2SHandler.h"
#include <WebSocketsClient.h>
#include <driver/i2s.h>
#include <driver/rtc_io.h>
#include "Button.h"

WebSocketsClient webSocket;
String authMessage;
int currentVolume = 100;

void enterSleep()
{
    Serial.println("Going to sleep...");
    // webSocket.sendTXT("{\"speaker\": \"user\", \"is_ending\": true}");
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
        webSocket.sendTXT("{\"user\": \"Tell me a really cool story about batman\"}");
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

// supabase CA cert
// const char *CA_cert = R"EOF(
// -----BEGIN CERTIFICATE-----
// MIIDejCCAmKgAwIBAgIQf+UwvzMTQ77dghYQST2KGzANBgkqhkiG9w0BAQsFADBX
// MQswCQYDVQQGEwJCRTEZMBcGA1UEChMQR2xvYmFsU2lnbiBudi1zYTEQMA4GA1UE
// CxMHUm9vdCBDQTEbMBkGA1UEAxMSR2xvYmFsU2lnbiBSb290IENBMB4XDTIzMTEx
// NTAzNDMyMVoXDTI4MDEyODAwMDA0MlowRzELMAkGA1UEBhMCVVMxIjAgBgNVBAoT
// GUdvb2dsZSBUcnVzdCBTZXJ2aWNlcyBMTEMxFDASBgNVBAMTC0dUUyBSb290IFI0
// MHYwEAYHKoZIzj0CAQYFK4EEACIDYgAE83Rzp2iLYK5DuDXFgTB7S0md+8Fhzube
// Rr1r1WEYNa5A3XP3iZEwWus87oV8okB2O6nGuEfYKueSkWpz6bFyOZ8pn6KY019e
// WIZlD6GEZQbR3IvJx3PIjGov5cSr0R2Ko4H/MIH8MA4GA1UdDwEB/wQEAwIBhjAd
// BgNVHSUEFjAUBggrBgEFBQcDAQYIKwYBBQUHAwIwDwYDVR0TAQH/BAUwAwEB/zAd
// BgNVHQ4EFgQUgEzW63T/STaj1dj8tT7FavCUHYwwHwYDVR0jBBgwFoAUYHtmGkUN
// l8qJUC99BM00qP/8/UswNgYIKwYBBQUHAQEEKjAoMCYGCCsGAQUFBzAChhpodHRw
// Oi8vaS5wa2kuZ29vZy9nc3IxLmNydDAtBgNVHR8EJjAkMCKgIKAehhxodHRwOi8v
// Yy5wa2kuZ29vZy9yL2dzcjEuY3JsMBMGA1UdIAQMMAowCAYGZ4EMAQIBMA0GCSqG
// SIb3DQEBCwUAA4IBAQAYQrsPBtYDh5bjP2OBDwmkoWhIDDkic574y04tfzHpn+cJ
// odI2D4SseesQ6bDrarZ7C30ddLibZatoKiws3UL9xnELz4ct92vID24FfVbiI1hY
// +SW6FoVHkNeWIP0GCbaM4C6uVdF5dTUsMVs/ZbzNnIdCp5Gxmx5ejvEau8otR/Cs
// kGN+hr/W5GvT1tMBjgWKZ1i4//emhA1JG1BbPzoLJQvyEotc03lXjTaCzv8mEbep
// 8RqZ7a2CPsgRbuvTPBwcOMBBmuFeU88+FSBX6+7iP0il8b4Z0QFqIwwMHfs/L6K1
// vepuoxtGzi4CZ68zJpiq1UvSqTbFJjtbD4seiMHl
// -----END CERTIFICATE-----
// )EOF";

// starmoon.deno.dev CA cert
const char *CA_cert = R"EOF(
-----BEGIN CERTIFICATE-----
MIIEVzCCAj+gAwIBAgIRALBXPpFzlydw27SHyzpFKzgwDQYJKoZIhvcNAQELBQAw
TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh
cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMjQwMzEzMDAwMDAw
WhcNMjcwMzEyMjM1OTU5WjAyMQswCQYDVQQGEwJVUzEWMBQGA1UEChMNTGV0J3Mg
RW5jcnlwdDELMAkGA1UEAxMCRTYwdjAQBgcqhkjOPQIBBgUrgQQAIgNiAATZ8Z5G
h/ghcWCoJuuj+rnq2h25EqfUJtlRFLFhfHWWvyILOR/VvtEKRqotPEoJhC6+QJVV
6RlAN2Z17TJOdwRJ+HB7wxjnzvdxEP6sdNgA1O1tHHMWMxCcOrLqbGL0vbijgfgw
gfUwDgYDVR0PAQH/BAQDAgGGMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcD
ATASBgNVHRMBAf8ECDAGAQH/AgEAMB0GA1UdDgQWBBSTJ0aYA6lRaI6Y1sRCSNsj
v1iU0jAfBgNVHSMEGDAWgBR5tFnme7bl5AFzgAiIyBpY9umbbjAyBggrBgEFBQcB
AQQmMCQwIgYIKwYBBQUHMAKGFmh0dHA6Ly94MS5pLmxlbmNyLm9yZy8wEwYDVR0g
BAwwCjAIBgZngQwBAgEwJwYDVR0fBCAwHjAcoBqgGIYWaHR0cDovL3gxLmMubGVu
Y3Iub3JnLzANBgkqhkiG9w0BAQsFAAOCAgEAfYt7SiA1sgWGCIpunk46r4AExIRc
MxkKgUhNlrrv1B21hOaXN/5miE+LOTbrcmU/M9yvC6MVY730GNFoL8IhJ8j8vrOL
pMY22OP6baS1k9YMrtDTlwJHoGby04ThTUeBDksS9RiuHvicZqBedQdIF65pZuhp
eDcGBcLiYasQr/EO5gxxtLyTmgsHSOVSBcFOn9lgv7LECPq9i7mfH3mpxgrRKSxH
pOoZ0KXMcB+hHuvlklHntvcI0mMMQ0mhYj6qtMFStkF1RpCG3IPdIwpVCQqu8GV7
s8ubknRzs+3C/Bm19RFOoiPpDkwvyNfvmQ14XkyqqKK5oZ8zhD32kFRQkxa8uZSu
h4aTImFxknu39waBxIRXE4jKxlAmQc4QjFZoq1KmQqQg0J/1JF8RlFvJas1VcjLv
YlvUB2t6npO6oQjB3l+PNf0DpQH7iUx3Wz5AjQCi6L25FjyE06q6BZ/QlmtYdl/8
ZYao4SRqPEs/6cAiF+Qf5zg2UkaWtDphl1LKMuTNLotvsX99HP69V2faNyegodQ0
LyTApr/vT01YPE46vNsDLgK+4cL6TrzC/a4WcmF5SRJ938zrv/duJHLXQIku5v0+
EwOy59Hdm0PT/Er/84dDV0CSjdR/2XuZM3kpysSKLgD1cKiDA+IRguODCxfO9cyY
Ig46v9mFmBvyH04=
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
    webSocket.beginSslWithCA(server_domain.c_str(), port, path.c_str(), CA_cert);
    // webSocket.begin(server_domain.c_str(), port, path.c_str());
    webSocket.onEvent(webSocketEvent);
    // webSocket.setAuthorization("user", "Password");
    webSocket.setReconnectInterval(1000);
}

void connectWithPassword()
{
    IPAddress dns1(8, 8, 8, 8);        // Google DNS
IPAddress dns2(1, 1, 1, 1);        // Cloudflare DNS
WiFi.config(INADDR_NONE, INADDR_NONE, INADDR_NONE, dns1, dns2);
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
    // websocket_setup("192.168.1.166", 8000, "/");
    websocket_setup("starmoon.deno.dev",443, "/");
    // websocket_setup("xygbupeczfhwamhqnucy.supabase.co", 443, "/functions/v1/relay");
}

// void micTask(void *parameter)
// {
//     i2s_install_mic();
//     i2s_setpin_mic();
//     i2s_start(I2S_PORT_IN);

//     const int i2s_read_len = 4096;
//     size_t bytes_read;
//     char *i2s_read_buff = (char *)calloc(i2s_read_len, 1);
//     char *flash_write_buff = (char *)calloc(i2s_read_len, 1);

//     while (1) {
//         // Read audio data
//         if (i2s_read(I2S_PORT_IN, (void *)i2s_read_buff, i2s_read_len,
//                      &bytes_read, portMAX_DELAY) == ESP_OK)
//         {
//             if (webSocket.isConnected()) {
//                 // Scale or convert if needed
//                 i2s_adc_data_scale((uint8_t*)flash_write_buff,
//                                    (uint8_t*)i2s_read_buff,
//                                    bytes_read);

//                 // Allocate a temporary buffer for sending
//                 uint8_t* safeSend = (uint8_t*) malloc(bytes_read);
//                 memcpy(safeSend, flash_write_buff, bytes_read);

//                 // Now send
//                 webSocket.sendBIN(safeSend, bytes_read);

//                 // Free the temp buffer
//                 free(safeSend);
//             }
//         }
//         vTaskDelay(1);
//     }

//     free(i2s_read_buff);
//     free(flash_write_buff);
//     vTaskDelete(NULL);
// }


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
    digitalWrite(LED_PIN, LOW);

    connectWithPassword();

    i2s_install_speaker();
    i2s_setpin_speaker();

    // Get the actual sample rate - updated to match new function signature
    float real_rate = i2s_get_clk(I2S_PORT_OUT);
    Serial.printf("Actual I2S sample rate: %.0f Hz\n", real_rate);

    // xTaskCreate(buttonTask, "Button Task", 8192, NULL, 5, NULL);
    // xTaskCreate(micTask, "Microphone Task", 4096, NULL, 4, NULL);
}

void loop()
{
    webSocket.loop();
}