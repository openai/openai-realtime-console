#ifndef LEDHANDLER_H
#define LEDHANDLER_H

#include "Config.h"

enum DeviceState
{
    IDLE,
    LISTENING,
    SPEAKING,
    PROCESSING,
};

extern DeviceState deviceState;

void setLEDColor(uint8_t r, uint8_t g, uint8_t b);
void turnOffLED();
void turnOnLED();
void setupRGBLED();
void turnOnBlueLED();
void turnOnRedLEDFlash();
void ledTask(void *parameter);

#endif