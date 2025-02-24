#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>
#include <ArduinoJson.h>
#include <driver/i2s.h>
#include <Preferences.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <WebSocketsClient.h>

extern Preferences preferences;
extern bool factory_reset_status;

enum OtaStatus {
    OTA_IDLE,
    OTA_IN_PROGRESS,
    OTA_COMPLETE
};

extern OtaStatus otaState;

enum DeviceState
{
    SETUP,
    IDLE,
    LISTENING,
    SPEAKING,
    PROCESSING,
    WAITING,
    OTA,
    FACTORY_RESET
};

extern DeviceState deviceState;

// WiFi credentials
extern const char *EAP_IDENTITY;
extern const char *EAP_USERNAME;
extern const char *EAP_PASSWORD;
extern const char *ssid;

extern const char *ssid_peronal;
extern const char *password_personal;

extern String authTokenGlobal;

// WebSocket server details
extern const char *ws_server;
extern const uint16_t ws_port;
extern const char *ws_path;

// Backend server details
extern const char *backend_server;
extern const uint16_t backend_port;

// I2S and Audio parameters
extern const uint32_t SAMPLE_RATE;

// ---------- Development ------------
// #define DEV_MODE
#define TOUCH_MODE

// ----------------- Pin Definitions -----------------
#define USE_NORMAL_ESP32

extern const int BLUE_LED_PIN;
extern const int RED_LED_PIN;
extern const int GREEN_LED_PIN;

extern const gpio_num_t BUTTON_PIN;

// I2S Microphone pins
extern const int I2S_SD;
extern const int I2S_WS;
extern const int I2S_SCK;
extern const i2s_port_t I2S_PORT_IN;

// I2S Speaker pins
extern const int I2S_WS_OUT;
extern const int I2S_BCK_OUT;
extern const int I2S_DATA_OUT;
extern const i2s_port_t I2S_PORT_OUT;
extern const int I2S_SD_OUT;

// SSL certificate
extern const char *CA_cert;
extern const char *Vercel_CA_cert;
void factoryResetDevice();

#endif