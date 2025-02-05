#include <AsyncTCP.h> //https://github.com/me-no-dev/AsyncTCP using the latest dev version from @me-no-dev
#include <DNSServer.h>
#include <ESPAsyncWebServer.h> //https://github.com/me-no-dev/ESPAsyncWebServer using the latest dev version from @me-no-dev
#include <esp_wifi.h>          //Used for mpdu_rx_disable android workaround
#include <HTTPClient.h>
#include <Config.h>

#define uS_TO_S_FACTOR 1000000ULL

#define MAX_CLIENTS 4  // ESP32 supports up to 10 but I have not tested it yet
#define WIFI_CHANNEL 6 // 2.4ghz channel 6 https://en.wikipedia.org/wiki/List_of_WLAN_channels#2.4_GHz_(802.11b/g/n/ax)

const IPAddress localIP(4, 3, 2, 1);          // the IP address the web server, Samsung requires the IP to be in public space
const IPAddress gatewayIP(4, 3, 2, 1);        // IP address of the network should be the same as the local IP for captive portals
const IPAddress subnetMask(255, 255, 255, 0); // no need to change: https://avinetworks.com/glossary/subnet-mask/

const String localIPURL = "http://4.3.2.1"; // a string version of the local IP with http, used for redirecting clients to your webpage

DNSServer dnsServer;
AsyncWebServer server(80);

int AP_status = 0;

void getAuthTokenFromNVS()
{
    preferences.begin("auth", false);
    authTokenGlobal = preferences.getString("auth_token", "");
    preferences.end();

    authTokenGlobal = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJzdWIiOiI4YzNhZjA4Ny04ZDgwLTQ1MzYtOGM3Ni0wNjI2Nzc0NDgwMzMiLCJlbWFpbCI6ImFrYWQzYkBnbWFpbC5jb20iLCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoiYWthZDNiQGdtYWlsLmNvbSIsInVzZXJfaWQiOiI4YzNhZjA4Ny04ZDgwLTQ1MzYtOGM3Ni0wNjI2Nzc0NDgwMzMiLCJjcmVhdGVkX3RpbWUiOiIyMDI1LTAyLTA0VDE5OjQxOjA5LjQ0NFoifSwiaWF0IjoxNzM4Njk4MDY5fQ.wh_33g-MH-nQ63BJOJM3cgQM72avTPb8663vLrwUx3Y";
        
    Serial.println(authTokenGlobal);
}

String urlEncode(const String &msg)
{
    String encodedMsg = "";
    char c;
    char code0;
    char code1;
    for (int i = 0; i < msg.length(); i++)
    {
        c = msg.charAt(i);
        if (c == ' ')
        {
            encodedMsg += '+';
        }
        else if (isalnum(c))
        {
            encodedMsg += c;
        }
        else
        {
            code1 = (c & 0xf) + '0';
            if ((c & 0xf) > 9)
            {
                code1 = (c & 0xf) - 10 + 'A';
            }
            c = (c >> 4) & 0xf;
            code0 = c + '0';
            if (c > 9)
            {
                code0 = c - 10 + 'A';
            }
            encodedMsg += '%';
            encodedMsg += code0;
            encodedMsg += code1;
        }
    }
    return encodedMsg;
}

int wifiConnect()
{
    WiFi.mode(WIFI_MODE_STA); // Add this to ensure we're in station mode

    // Begin with no arguments to load last stored credentials from NVS
    WiFi.begin();

    // Wait until connected
    unsigned long startMillis = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - startMillis < 10000)
    {
        delay(100);
    }

    if (WiFi.status() == WL_CONNECTED)
    {
        Serial.printf("Quick reconnect: Connected to %s\n", WiFi.SSID().c_str());
        Serial.printf("IP: %s\n", WiFi.localIP().toString().c_str());
        WiFi.setSleep(false); // Disable power saving

        return 1;
    }

    preferences.begin("wifi_store");
    int numNetworks = preferences.getInt("numNetworks", 0);
    if (numNetworks == 0)
    {
        preferences.end();
        return 0;
    }

    // Try each stored network
    for (int i = 0; i < numNetworks; ++i)
    {
        String ssid = preferences.getString(("ssid" + String(i)).c_str(), "");
        String password = preferences.getString(("password" + String(i)).c_str(), "");

        if (ssid.length() > 0 && password.length() > 0)
        {
            Serial.printf("Attempting connection to %s\n", ssid.c_str());

            WiFi.begin(ssid.c_str(), password.c_str());

            // More reasonable timeout: 15 seconds (10 * 500ms = 10s)
            int attempts = 0;
            while (WiFi.status() != WL_CONNECTED && attempts < 20)
            {
                delay(500); // Longer delay between attempts
                Serial.print(".");
                attempts++;
            }
            Serial.println();

            if (WiFi.status() == WL_CONNECTED)
            {
                Serial.printf("Connected to %s\n", ssid.c_str());
                Serial.printf("IP: %s\n", WiFi.localIP().toString().c_str());
                WiFi.setSleep(false); // Disable power saving
                preferences.end();

                return 1;
            }

            Serial.printf("Failed to connect to %s\n", ssid.c_str());
        }
    }

    preferences.end();
    return 0;
}


bool isDeviceRegistered(AsyncWebServerRequest *request) {
    HTTPClient http;
    String url = "http://" + String(backend_server) + ":" + String(backend_port) +
                 "/api/generate_auth_token?macAddress=" + WiFi.macAddress();

    http.begin(url);
    http.setTimeout(10000);

    int httpCode = http.GET();

    if (httpCode == HTTP_CODE_OK) {
        String payload = http.getString();
        JsonDocument doc;
        DeserializationError error = deserializeJson(doc, payload);

        if (error) {
            Serial.print("JSON parsing failed: ");
            Serial.println(error.c_str());
            http.end();
            return false;
        }

        String authToken = doc["token"];
        if (!authToken.isEmpty()) {
            // Store the auth token in NVS
            preferences.begin("auth", false);
            preferences.putString("auth_token", authToken);
            preferences.end();

            authTokenGlobal = String(authToken);
            http.end();
            return true;
        }
    }

    // If we get here, either the request failed or no token was found
    http.end();
    return false;
}


void handleComplete(AsyncWebServerRequest *request)
{
    bool isRegistered = !authTokenGlobal.isEmpty();
    
    if (!isRegistered && request->hasParam("registration_attempted")) {
        isRegistered = isDeviceRegistered(request);
    }

    String content;
    if (isRegistered) {
        content = "<h1>Setup Complete</h1>"
                 "<p>Your device is ready to use.</p>"
                 "<p>The setup network will now close.</p>";
    } else {
        content = "<h1>One Last Step</h1>"
                 "<p>Please register your personal device code on our website to start using your device.</p>"
                 "<form action='/complete' method='GET'>"
                 "<input type='hidden' name='registration_attempted' value='true'>"
                 "<input type='submit' value='Register Device' class='button'>"
                 "</form>"
                 "<p class='note'>Click the button above after registering your device on the website.</p>";
    }

   request->send(200, "text/html", "<!DOCTYPE html>"
                                    "<html lang='en'>"
                                    "<head>"
                                    "<meta name='viewport' content='width=device-width, initial-scale=1.0'>"
                                    "<style>"
                                    "body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #fff8e1; }"
                                    ".container { padding: 20px; max-width: 600px; margin: auto; }"
                                    ".header { background: #facc15; color: black; padding: 15px 0; text-align: center; font-weight: bold; border-radius: 8px 8px 0 0; }"
                                    ".content { background: #ffffff; border-radius: 0 0 8px 8px; padding: 25px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); text-align: center; }"
                                    "h1 { color: #333; margin-bottom: 20px; }"
                                    "p { color: #666; margin: 10px 0; }"
                                    ".button { background: #facc15; color: black; padding: 12px 24px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; margin: 20px 0; }"
                                    ".button:hover { background: #fdd835; }"
                                    ".note { font-size: 0.9em; color: #888; margin-top: 20px; }"
                                    "</style>"
                                    "</head>"
                                    "<body>"
                                    "<div class='container'>"
                                    "<div class='header'>Starmoon AI - Setup Complete</div>"
                                    "<div class='content'>" +
                                    content +
                                    "</div>"
                                    "</div>"
                                    "</body>"
                                    "</html>");
}

void handleRoot(AsyncWebServerRequest *request)
{
    String notConnected = ""; // Initialize with empty string
    if (request->hasParam("not_connected"))
    {
        notConnected = request->getParam("not_connected")->value();
    }
    if (WiFi.status() != WL_CONNECTED)
    {
        String html = "<!DOCTYPE html>"
                      "<html lang='en'>"
                      "<head>"
                      "<meta name='viewport' content='width=device-width, initial-scale=1.0'>"
                      "<style>"
                      "body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #fff8e1; }" // Light yellow background
                      ".container { padding: 20px; max-width: 600px; margin: auto; }"
                      ".header { background: #facc15; color: black; padding: 15px 0; text-align: center; font-weight: bold; border-radius: 8px 8px 0 0; }" // Yellow header with black text and rounded top corners
                      ".content { background: #ffffff; border-radius: 0 0 8px 8px; padding: 25px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }"             // Rounded bottom corners
                      ".error { margin: 20px 0; padding: 10px; background: #ffebee; border-radius: 5px; color: #c62828; }"
                      "input[type='text'], input[type='password'] { width: calc(100% - 22px); padding: 10px; margin: 10px 0; border: 1px solid #ccc; border-radius: 5px; box-sizing: border-box; }"
                      "input[type='submit'] { background: #facc15; color: black; padding: 10px; border: none; border-radius: 5px; cursor: pointer; width: 100%; font-weight: bold; }" // Yellow button with black text
                      "input[type='submit']:hover { background: #fdd835; }"                                                                                                           // Slightly darker yellow on hover
                      "</style>"
                      "</head>"
                      "<body>"
                      "<div class='container'>"
                      "<div class='header'>Starmoon AI</div>"
                      "<div class='content'>"
                      "<h1>Connect to Wi-Fi</h1>";
        if (strcmp(notConnected.c_str(), "true") == 0)
        {
            html += "<p class='error'>The network connection failed, please try again.</p>";
        }
        html += "<form action='/wifi' method='POST'>"
                "SSID: <input type='text' name='ssid' required><br>"
                "Password: <input type='password' name='password' required><br>"
                "<input type='submit' value='Connect'>"
                "</form>"
                "</div>"
                "</div>"
                "</body>"
                "</html>";
        request->send(200, "text/html", html);
    }
    else
    {
       request->redirect("/complete");
    }
}

void handleWifiSave(AsyncWebServerRequest *request)
{
    Serial.println("Start Save!");
    String ssid = request->arg("ssid");
    String password = request->arg("password");

    // Attempt to connect to the provided Wi-Fi credentials
    Serial.print("Connecting to ");
    Serial.println(ssid);
    Serial.println(password);
    WiFi.begin(ssid.c_str(), password.c_str());

    // Wait for connection
    int attempts = 30; // 30 * 100ms = 3 seconds
    while (attempts-- && WiFi.status() != WL_CONNECTED)
    {
        delay(100);
    }

    if (WiFi.status() == WL_CONNECTED)
    {
        Serial.println("Successfully connected to WiFi!");

        // Now that we're connected, save/update the credentials
        preferences.begin("wifi_store", false);
        int numNetworks = preferences.getInt("numNetworks", 0);

        // Check if this SSID already exists
        bool updated = false;
        for (int i = 0; i < numNetworks; ++i)
        {
            String storedSsid = preferences.getString(("ssid" + String(i)).c_str(), "");
            if (storedSsid == ssid)
            {
                preferences.putString(("password" + String(i)).c_str(), password);
                Serial.println("Success Update!");
                updated = true;
                break;
            }
        }

        // If it's a new network, add it
        if (!updated)
        {
            preferences.putString(("ssid" + String(numNetworks)).c_str(), ssid);
            preferences.putString(("password" + String(numNetworks)).c_str(), password);
            preferences.putInt("numNetworks", numNetworks + 1);
            Serial.println("Success Save!");
        }

        // Check if the device is registered
        request->redirect("/complete");
        preferences.end();
    }
    else
    {
        Serial.println("Failed to connect to WiFi");
        request->redirect("/?not_connected=true");
    }
}

void setUpDNSServer(DNSServer &dnsServer, const IPAddress &localIP)
{
// Define the DNS interval in milliseconds between processing DNS requests
#define DNS_INTERVAL 30

    // Set the TTL for DNS response and start the DNS server
    dnsServer.setTTL(3600);
    dnsServer.start(53, "*", localIP);
}

void startSoftAccessPoint(const char *ssid, const char *password, const IPAddress &localIP, const IPAddress &gatewayIP)
{
// Define the maximum number of clients that can connect to the server
#define MAX_CLIENTS 4
// Define the WiFi channel to be used (channel 6 in this case)
#define WIFI_CHANNEL 6

    // Set the WiFi mode to access point and station
    WiFi.mode(WIFI_MODE_AP);

    // Define the subnet mask for the WiFi network
    const IPAddress subnetMask(255, 255, 255, 0);

    // Configure the soft access point with a specific IP and subnet mask
    WiFi.softAPConfig(localIP, gatewayIP, subnetMask);

    // Start the soft access point with the given ssid, password, channel, max number of clients
    WiFi.softAP(ssid, password, WIFI_CHANNEL, 0, MAX_CLIENTS);

    // Disable AMPDU RX on the ESP32 WiFi to fix a bug on Android
    esp_wifi_stop();
    esp_wifi_deinit();
    wifi_init_config_t my_config = WIFI_INIT_CONFIG_DEFAULT();
    my_config.ampdu_rx_enable = false;
    esp_wifi_init(&my_config);
    esp_wifi_start();
    vTaskDelay(100 / portTICK_PERIOD_MS); // Add a small delay
}

void setUpWebserver(AsyncWebServer &server, const IPAddress &localIP)
{
    //======================== Webserver ========================
    // WARNING IOS (and maybe macos) WILL NOT POP UP IF IT CONTAINS THE WORD "Success" https://www.esp8266.com/viewtopic.php?f=34&t=4398
    // SAFARI (IOS) IS STUPID, G-ZIPPED FILES CAN'T END IN .GZ https://github.com/homieiot/homie-esp8266/issues/476 this is fixed by the webserver serve static function.
    // SAFARI (IOS) there is a 128KB limit to the size of the HTML. The HTML can reference external resources/images that bring the total over 128KB
    // SAFARI (IOS) popup browser has some severe limitations (javascript disabled, cookies disabled)

    // Required
    server.on("/connecttest.txt", [](AsyncWebServerRequest *request)
              { request->redirect("http://logout.net"); }); // windows 11 captive portal workaround
    server.on("/wpad.dat", [](AsyncWebServerRequest *request)
              { request->send(404); }); // Honestly don't understand what this is but a 404 stops win 10 keep calling this repeatedly and panicking the esp32 :)

    // Background responses: Probably not all are Required, but some are. Others might speed things up?
    // A Tier (commonly used by modern systems)
    server.on("/generate_204", [](AsyncWebServerRequest *request)
              { request->redirect(localIPURL); }); // android captive portal redirect
    server.on("/redirect", [](AsyncWebServerRequest *request)
              { request->redirect(localIPURL); }); // microsoft redirect
    server.on("/hotspot-detect.html", [](AsyncWebServerRequest *request)
              { request->redirect(localIPURL); }); // apple call home
    server.on("/canonical.html", [](AsyncWebServerRequest *request)
              { request->redirect(localIPURL); }); // firefox captive portal call home
    server.on("/success.txt", [](AsyncWebServerRequest *request)
              { request->send(200); }); // firefox captive portal call home
    server.on("/ncsi.txt", [](AsyncWebServerRequest *request)
              { request->redirect(localIPURL); }); // windows call home

    // B Tier (uncommon)
    //  server.on("/chrome-variations/seed",[](AsyncWebServerRequest *request){request->send(200);}); //chrome captive portal call home
    //  server.on("/service/update2/json",[](AsyncWebServerRequest *request){request->send(200);}); //firefox?
    //  server.on("/chat",[](AsyncWebServerRequest *request){request->send(404);}); //No stop asking Whatsapp, there is no internet connection
    //  server.on("/startpage",[](AsyncWebServerRequest *request){request->redirect(localIPURL);});

    // return 404 to webpage icon
    server.on("/favicon.ico", [](AsyncWebServerRequest *request)
              { request->send(404); }); // webpage icon

    server.on("/", HTTP_GET, handleRoot);
    server.on("/wifi", HTTP_POST, handleWifiSave);
    server.on("/complete", HTTP_GET, handleComplete);

    // the catch all
    server.onNotFound([](AsyncWebServerRequest *request)
                      {
		request->redirect(localIPURL);
		Serial.print("onnotfound ");
		Serial.print(request->host());	// This gives some insight into whatever was being requested on the serial monitor
		Serial.print(" ");
		Serial.print(request->url());
		Serial.print(" sent redirect to " + localIPURL + "\n"); });
}

String getAPSSIDName()
{
    // Get the MAC address of the device
    String macAddress = WiFi.macAddress();
    macAddress.replace(":", "");
    String lastFourMac = macAddress.substring(macAddress.length() - 4); // Get the last 4 characters
    String ssid = "Starmoon-" + lastFourMac;
    return ssid;
}

void openAP()
{
    deviceState = SETUP;
    AP_status = 1;
    startSoftAccessPoint(getAPSSIDName().c_str(), NULL, localIP, gatewayIP);
    setUpDNSServer(dnsServer, localIP);
    setUpWebserver(server, localIP);
    server.begin();
}

void closeAP()
{
    deviceState = IDLE;
    dnsServer.stop();
    server.end();
    WiFi.softAPdisconnect(true);
    WiFi.mode(WIFI_MODE_STA);
    AP_status = 0;
    Serial.println("Closed Access Point and DNS server");
}