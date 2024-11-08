#include <WiFi.h>
#include <HTTPClient.h>
#include <Preferences.h> // NVS for storage

// Wi-Fi credentials
const char *ssid = "<wifi>";
const char *password = "<pw>";

// Server endpoint for checking registration
const char *serverEndpoint = "<server_endpoint>";

// Preferences for NVS storage
Preferences preferences;

// Function to connect to WiFi
void connectToWiFi()
{
    Serial.println("Connecting to WiFi...");
    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED)
    {
        delay(1000);
        Serial.println("Connecting...");
    }

    Serial.println("WiFi connected.");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
}

// Function to get auth token from the server
String getAuthTokenFromServer(String macAddress)
{
    HTTPClient http;
    http.begin(serverEndpoint); // Specify the server URL

    // Set the POST request content type
    http.addHeader("Content-Type", "application/json");

    // JSON body with mac_address
    String jsonBody = "{\"mac_address\": \"" + macAddress + "\"}";

    // Send POST request
    int httpResponseCode = http.POST(jsonBody);

    // Check the response code
    if (httpResponseCode > 0)
    {
        String response = http.getString();
        Serial.println("Server response: " + response);

        // Assuming response contains the auth token
        return response;
    }
    else
    {
        Serial.print("Error on sending POST: ");
        Serial.println(httpResponseCode);
        return "";
    }

    // Close the HTTP connection
    http.end();
}

// Function to store auth token in NVS
void storeAuthToken(String authToken)
{
    preferences.begin("auth", false);
    preferences.putString("auth_token", authToken);
    preferences.end();
    Serial.println("Auth token stored in NVS.");
}

// Function to check registration status
void checkRegistration()
{
    String macAddress = WiFi.macAddress(); // Get the ESP32's MAC address
    Serial.println("Checking registration for MAC Address: " + macAddress);

    // Get the auth token from the server
    String authToken = getAuthTokenFromServer(macAddress);

    if (authToken != "")
    {
        storeAuthToken(authToken); // Store the auth token in NVS
    }
    else
    {
        Serial.println("Device not registered yet.");
    }
}

void setup()
{
    // Initialize serial for debugging
    Serial.begin(115200);

    // Connect to Wi-Fi
    connectToWiFi();

    // Initialize NVS preferences
    preferences.begin("auth", true);
    String storedToken = preferences.getString("auth_token", "");
    preferences.end();

    if (storedToken != "")
    {
        Serial.println("Auth token found in NVS: " + storedToken);
    }
    else
    {
        checkRegistration(); // Check registration if no token is found
    }
}

void loop()
{
    // Main loop logic (e.g., periodic updates, authentication, etc.)
}
