#include "Arduino.h"
#include <WiFi.h>                          //Wifi library
#define EAP_IDENTITY "username@city.ac.uk" // if connecting from another corporation, use identity@organization.domain in Eduroam
#define EAP_USERNAME "username@city.ac.uk" // oftentimes just a repeat of the identity
#define EAP_PASSWORD "your password"       // your Eduroam password
const char *ssid = "eduroam";              // Eduroam SSID
const char *host = "arduino.php5.sk";      // external server domain for HTTP connection after authentication
int counter = 0;

// NOTE: For some systems, various certification keys are required to connect to the wifi system.
//       Usually you are provided these by the IT department of your organization when certs are required
//       and you can't connect with just an identity and password.
//       Most eduroam setups we have seen do not require this level of authentication, but you should contact
//       your IT department to verify.
//       You should uncomment these and populate with the contents of the files if this is required for your scenario (See Example 2 and Example 3 below).
// const char *ca_pem = "insert your CA cert from your .pem file here";
// const char *client_cert = "insert your client cert from your .crt file here";
// const char *client_key = "insert your client key from your .key file here";

void setup()
{
    Serial.begin(115200);
    delay(10);
    Serial.println();
    Serial.print("Connecting to network: ");
    Serial.println(ssid);
    WiFi.disconnect(true); // disconnect form wifi to set new wifi connection
    WiFi.mode(WIFI_STA);   // init wifi mode

    // Example1 (most common): a cert-file-free eduroam with PEAP (or TTLS)
    WiFi.begin(ssid, WPA2_AUTH_PEAP, EAP_IDENTITY, EAP_USERNAME, EAP_PASSWORD);

    // Example 2: a cert-file WPA2 Enterprise with PEAP
    // WiFi.begin(ssid, WPA2_AUTH_PEAP, EAP_IDENTITY, EAP_USERNAME, EAP_PASSWORD, ca_pem, client_cert, client_key);

    // Example 3: TLS with cert-files and no password
    // WiFi.begin(ssid, WPA2_AUTH_TLS, EAP_IDENTITY, NULL, NULL, ca_pem, client_cert, client_key);

    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print(".");
        counter++;
        if (counter >= 60)
        { // after 30 seconds timeout - reset board
            ESP.restart();
        }
    }
    Serial.println("");
    Serial.println("WiFi connected");
    Serial.println("IP address set: ");
    Serial.println(WiFi.localIP()); // print LAN IP
}
void loop()
{
}
