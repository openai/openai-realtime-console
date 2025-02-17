#include <DebugLog.h>
#include <driver/i2s.h>
#include <opus.h>

// serial
#define SERIAL_BAUD_RATE      115200

// audio speaker
#define AUDIO_SPEAKER_BCLK    26
#define AUDIO_SPEAKER_LRC     13
#define AUDIO_SPEAKER_DIN     25

// audio microphone
#define AUDIO_MIC_SD          2
#define AUDIO_MIC_WS          15
#define AUDIO_MIC_SCK         4

#define AUDIO_SAMPLE_RATE     8000  // 44100
#define AUDIO_OPUS_FRAME_MS   40    // one of 2.5, 5, 10, 20, 40, 60, 80, 100, 120
#define AUDIO_OPUS_BITRATE    3200  // bit rate from 2400 to 512000
#define AUDIO_OPUS_COMPLEXITY 0     // from 0 to 10

OpusEncoder *opus_encoder_;
OpusDecoder *opus_decoder_;

TaskHandle_t audio_task_;

int16_t *opus_samples_;
int opus_samples_size_;

int16_t *opus_samples_out_;
int opus_samples_out_size_;

uint8_t *opus_bits_;
int opus_bits_size_ = 1024;

void setup() {
  LOG_SET_LEVEL(DebugLogLevel::LVL_INFO);
  LOG_SET_OPTION(false, false, true);  // disable file, line, enable func

  Serial.begin(SERIAL_BAUD_RATE);
  while (!Serial);
  LOG_INFO("Board setup started");

  // create i2s speaker
  i2s_config_t i2s_speaker_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
    .sample_rate = AUDIO_SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = (i2s_comm_format_t)(I2S_COMM_FORMAT_I2S | I2S_COMM_FORMAT_I2S_MSB),
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 8,
    .dma_buf_len = 1024,
    .use_apll=0,
    .tx_desc_auto_clear= true, 
    .fixed_mclk=-1    
  };
  i2s_pin_config_t i2s_speaker_pin_config = {
    .bck_io_num = AUDIO_SPEAKER_BCLK,
    .ws_io_num = AUDIO_SPEAKER_LRC,
    .data_out_num = AUDIO_SPEAKER_DIN,
    .data_in_num = I2S_PIN_NO_CHANGE
  };
  if (i2s_driver_install(I2S_NUM_0, &i2s_speaker_config, 0, NULL) != ESP_OK) {
    LOG_ERROR("Failed to install i2s speaker driver");
  }
  if (i2s_set_pin(I2S_NUM_0, &i2s_speaker_pin_config) != ESP_OK) {
    LOG_ERROR("Failed to set i2s speaker pins");
  }

  // create i2s microphone
  i2s_config_t i2s_mic_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate = AUDIO_SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_RIGHT,
    .communication_format = (i2s_comm_format_t)(I2S_COMM_FORMAT_I2S | I2S_COMM_FORMAT_I2S_MSB),
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 8,
    .dma_buf_len = 1024,
    .use_apll=0,
    .tx_desc_auto_clear= true,
    .fixed_mclk=-1
  };
  i2s_pin_config_t i2s_mic_pin_config = {
    .bck_io_num = AUDIO_MIC_SCK,
    .ws_io_num = AUDIO_MIC_WS,
    .data_out_num = I2S_PIN_NO_CHANGE,
    .data_in_num = AUDIO_MIC_SD
  };
  if (i2s_driver_install(I2S_NUM_1, &i2s_mic_config, 0, NULL) != ESP_OK) {
    LOG_ERROR("Failed to install i2s mic driver");
  }
  if (i2s_set_pin(I2S_NUM_1, &i2s_mic_pin_config) != ESP_OK) {
    LOG_ERROR("Failed to set i2s mic pins");
  }

  // run codec2 audio loopback on a separate task
  xTaskCreate(&audio_task, "audio_task", 32000, NULL, 5, &audio_task_);

  LOG_INFO("Board setup completed");
}

void audio_task(void *param) {
  // configure encoder
  int encoder_error;
  opus_encoder_ = opus_encoder_create(AUDIO_SAMPLE_RATE, 1, OPUS_APPLICATION_VOIP, &encoder_error);
  if (encoder_error != OPUS_OK) {
    LOG_ERROR("Failed to create OPUS encoder, error", encoder_error);
    return;
  }
  encoder_error = opus_encoder_init(opus_encoder_, AUDIO_SAMPLE_RATE, 1, OPUS_APPLICATION_VOIP);
  if (encoder_error != OPUS_OK) {
    LOG_ERROR("Failed to initialize OPUS encoder, error", encoder_error);
    return;
  }
  opus_encoder_ctl(opus_encoder_, OPUS_SET_BITRATE(AUDIO_OPUS_BITRATE));
  opus_encoder_ctl(opus_encoder_, OPUS_SET_COMPLEXITY(AUDIO_OPUS_COMPLEXITY));
  opus_encoder_ctl(opus_encoder_, OPUS_SET_SIGNAL(OPUS_SIGNAL_VOICE));

  // configure decoder
  int decoder_error;
  opus_decoder_ = opus_decoder_create(AUDIO_SAMPLE_RATE, 1, &decoder_error);
  if (decoder_error != OPUS_OK) {
    LOG_ERROR("Failed to create OPUS decoder, error", decoder_error);
    return;
  } 

  opus_samples_size_ = (int)(AUDIO_SAMPLE_RATE / 1000 * AUDIO_OPUS_FRAME_MS);
  opus_samples_ = (int16_t*)malloc(sizeof(int16_t) * opus_samples_size_);
  opus_samples_out_size_ = 10 * opus_samples_size_;
  opus_samples_out_ = (int16_t*)malloc(sizeof(int16_t) * opus_samples_out_size_);
  
  opus_bits_ = (uint8_t*)malloc(sizeof(uint8_t) * opus_bits_size_);

  // run loopback record-encode-decode-playback loop
  size_t bytes_read, bytes_written;
  LOG_INFO("Audio task started");
  while(true) {
    i2s_read(I2S_NUM_1, opus_samples_, sizeof(uint16_t) * opus_samples_size_, &bytes_read, portMAX_DELAY);
    int encoded_size = opus_encode(opus_encoder_, opus_samples_, opus_samples_size_, opus_bits_, opus_bits_size_);
    vTaskDelay(1);
    int decoded_size = opus_decode(opus_decoder_, opus_bits_, encoded_size, opus_samples_out_, opus_samples_out_size_, 0);
    i2s_write(I2S_NUM_0, opus_samples_out_, sizeof(uint16_t) * decoded_size, &bytes_written, portMAX_DELAY);
    vTaskDelay(1);
  }
}

void loop() {
  // do nothing
  delay(100);
}