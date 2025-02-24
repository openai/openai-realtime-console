#ifndef OTA_H
#define OTA_H
#include "Config.h"

extern const char *server_certificate;
extern const char *ota_firmware_url;
void performOTAUpdate();
void markOTAUpdateComplete();
void loopOTA();
void setOTAStatusInNVS(OtaStatus status);
void getOTAStatusFromNVS();

#endif