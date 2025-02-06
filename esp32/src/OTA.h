#ifndef OTA_H
#define OTA_H
#include "Config.h"

extern const char *server_certificate;
extern const char *ota_firmware_url;
void performOTAUpdate();
void setOTAComplete();
void loopOTA();
void setOTAStatusInNVS(bool status);
void getOTAStatusFromNVS();

#endif