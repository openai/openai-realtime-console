#ifndef I2S_HANDLER_H
#define I2S_HANDLER_H
#include "Config.h"

void i2s_install_mic();
void i2s_setpin_mic();
void i2s_install_speaker();
void i2s_setpin_speaker();
void i2s_adc_data_scale(uint8_t *dst, uint8_t *src, size_t len);
// void micTask(void *parameter);

#endif
