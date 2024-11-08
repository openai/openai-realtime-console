/**
 * @file streams-i2s-webserver_wav.ino
 *
 *  This sketch reads sound data from I2S. The result is provided as WAV stream which can be listened to in a Web Browser
 *
 * **ADD THIS**
 * lib_deps =
        https://github.com/pschatzmann/arduino-audio-tools.git
 *
 * @author Phil Schatzmann
 * @copyright GPLv3
 */
#include <WiFi.h>
#include "AudioTools.h"

const char *ssid = "<wifi>";
const char *password = "<pw>";
// AudioEncodedServer server(new WAVEncoder(),"ssid","password");
AudioWAVServer server(ssid, password); // the same a above

I2SStream i2sStream;                                    // Access I2S as stream
ConverterFillLeftAndRight<int16_t> filler(LeftIsEmpty); // fill both channels - or change to RightIsEmpty

void setup()
{
    Serial.begin(115200);
    AudioLogger::instance().begin(Serial, AudioLogger::Info);

    //   // Connect to Wi-Fi
    Serial.println("Connecting to WiFi...");
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(1000);
        Serial.println("Connecting...");
    }
    Serial.println("Connected to WiFi");

    // Print the IP address
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());

    // start i2s input with default configuration
    Serial.println("starting I2S...");
    auto config = i2sStream.defaultConfig(RX_MODE);
    // config.i2s_format = I2S_LSB_FORMAT; // if quality is bad change to I2S_LSB_FORMAT https://github.com/pschatzmann/arduino-audio-tools/issues/23
    // config.sample_rate = 22050;
    // config.channels = 2;
    // config.bits_per_sample = 32;

    // working well
    config.i2s_format = I2S_STD_FORMAT;
    config.sample_rate = 44100;  // INMP441 supports up to 44.1kHz
    config.channels = 1;         // INMP441 is mono
    config.bits_per_sample = 16; // INMP441 is a 24-bit ADC

    config.pin_ws = 19; // Adjust these pins according to your wiring
    config.pin_bck = 18;
    config.pin_data = 21;
    config.use_apll = true; // Try with APLL for better clock stability
    i2sStream.begin(config);
    Serial.println("I2S started");

    // start data sink
    server.begin(i2sStream, config, &filler);
}

// Arduino loop
void loop()
{
    // Handle new connections
    server.copy();
}