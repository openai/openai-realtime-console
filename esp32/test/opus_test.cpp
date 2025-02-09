/**
 * @file test-codec-opus.ino
 * @author Phil Schatzmann
 * @brief generate sine wave -> encoder -> decoder -> audiokit (i2s)
 * @version 0.1
 * @date 2022-04-30
 * 
 * @copyright Copyright (c) 2022
 * 
 */
#include "AudioTools.h"
#include "AudioTools/AudioLibs/AudioBoardStream.h"
#include "AudioTools/AudioCodecs/CodecOpus.h"
#include "Button.h"

esp_err_t getErr = ESP_OK;

const gpio_num_t BUTTON_PIN = GPIO_NUM_2;

void enterSleep()
{
    Serial.println("Going to sleep...");

    // Flush any remaining serial output
    Serial.flush();
    
    // Now enter deep sleep
    esp_deep_sleep_start();
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



AudioInfo info(24000, 1, 16);

SineWaveGenerator<int16_t> sineWave( 32000);  // subclass of SoundGenerator with max amplitude of 32000
GeneratedSoundStream<int16_t> sound( sineWave); // Stream generated from sine wave
I2SStream out;
OpusAudioDecoder dec;
OpusAudioEncoder enc;
EncodedAudioStream decoder(&out, &dec); // encode and write 
EncodedAudioStream encoder(&decoder, &enc); // encode and write 
StreamCopy copier(encoder, sound);     

void setup() {
  Serial.begin(115200);
  AudioToolsLogger.begin(Serial, AudioToolsLogLevel::Warning);

  // start I2S
  Serial.println("starting I2S...");
  auto cfgi = out.defaultConfig(TX_MODE);

cfgi.pin_bck  = 6;
  cfgi.pin_ws   = 5;
  cfgi.pin_data = 7;
  cfgi.channels = 1;

  cfgi.copyFrom(info);
  out.begin(cfgi);
  // Setup sine wave
  sineWave.begin(info, N_B4);

  // Opus encoder and decoder need to know the audio info
  decoder.begin(info);
  encoder.begin(info);

      getErr = esp_sleep_enable_ext0_wakeup(BUTTON_PIN, LOW);
    printOutESP32Error(getErr);

    // BUTTON
    Button *btn = new Button(BUTTON_PIN, false);
    btn->attachLongPressUpEventCb(&onButtonLongPressUpEventCb, NULL);
    btn->attachDoubleClickEventCb(&onButtonDoubleClickCb, NULL);
    btn->detachSingleClickEvent();
        

  // configure additinal parameters
  // auto &enc_cfg = enc.config()
  // enc_cfg.application = OPUS_APPLICATION_RESTRICTED_LOWDELAY;
  // enc_cfg.frame_sizes_ms_x2 = OPUS_FRAMESIZE_20_MS;
  // enc_cfg.complexity = 5;

  Serial.println("Test started...");
}


void loop() { 
  copier.copy();
}