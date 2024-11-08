
#include <Arduino.h>
/*
  Simple Internet Radio Demo
  esp32-i2s-simple-radio.ino
  Simple ESP32 I2S radio
  Uses MAX98357 I2S Amplifier Module
  Uses ESP32-audioI2S Library - https://github.com/schreibfaul1/ESP32-audioI2S

  ** ADD THIS **
  lib_deps =
    esphome/ESP32-audioI2S@^2.0.7

  DroneBot Workshop 2022
  https://dronebotworkshop.com
*/

// Include required libraries
#include "WiFi.h"
#include "Audio.h"

// Define I2S connections
#define I2S_LRC D0
#define I2S_BCLK D1
#define I2S_DOUT D2
#define I2S_SD_OUT D3

// #define I2S_LRC 18
// #define I2S_BCLK 21
// #define I2S_DOUT 17

// Create audio object
Audio audio;

// // Wifi Credentials
String ssid = "<wifi>";   // replace your WiFi name
String password = "<pw>"; // replace your WiFi password

void setup()
{
    // Start Serial Monitor
    Serial.begin(115200);

    Serial.println("Connecting to WiFi");

    // Setup WiFi in Station mode
    WiFi.disconnect();
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid.c_str(), password.c_str());

    // Set SD_PIN as output and initialize to HIGH (unmuted)
    pinMode(I2S_SD_OUT, OUTPUT);
    digitalWrite(I2S_SD_OUT, HIGH);

    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print(".");
    }

    // WiFi Connected, print IP to serial monitor
    Serial.println("");
    Serial.println("WiFi connected");
    Serial.println("IP address: ");
    Serial.println(WiFi.localIP());
    Serial.println("");

    // Connect MAX98357 I2S Amplifier Module
    audio.setPinout(I2S_BCLK, I2S_LRC, I2S_DOUT);

    // Set thevolume (0-100)
    audio.setVolume(10);

    // Connect to an Internet radio station (select one as desired)
    // audio.connecttohost("http://vis.media-ice.musicradio.com/CapitalMP3");
    // audio.connecttohost("mediaserv30.live-nect MAX98357 I2S Amplifier Module
    // audio.connecttohost("www.surfmusic.de/m3u/100-5-das-hitradio,4529.m3u");
    // audio.connecttohost("stream.1a-webradio.de/deutsch/mp3-128/vtuner-1a");
    // audio.connecttohost("www.antenne.de/webradio/antenne.m3u");
    audio.connecttohost("http://vis.media-ice.musicradio.com/CapitalMP3");
}

void loop()

{
    // Run audio player
    audio.loop();
}

// Audio status functions

void audio_info(const char *info)
{
    Serial.print("info        ");
    Serial.println(info);
}
void audio_id3data(const char *info)
{ // id3 metadata
    Serial.print("id3data     ");
    Serial.println(info);
}
void audio_eof_mp3(const char *info)
{ // end of file
    Serial.print("eof_mp3     ");
    Serial.println(info);
}
void audio_showstation(const char *info)
{
    Serial.print("station     ");
    Serial.println(info);
}
void audio_showstreaminfo(const char *info)
{
    Serial.print("streaminfo  ");
    Serial.println(info);
}
void audio_showstreamtitle(const char *info)
{
    Serial.print("streamtitle ");
    Serial.println(info);
}
void audio_bitrate(const char *info)
{
    Serial.print("bitrate     ");
    Serial.println(info);
}
void audio_commercial(const char *info)
{ // duration in sec
    Serial.print("commercial  ");
    Serial.println(info);
}
void audio_icyurl(const char *info)
{ // homepage
    Serial.print("icyurl      ");
    Serial.println(info);
}
void audio_lasthost(const char *info)
{ // stream URL played
    Serial.print("lasthost    ");
    Serial.println(info);
}
void audio_eof_speech(const char *info)
{
    Serial.print("eof_speech  ");
    Serial.println(info);
}