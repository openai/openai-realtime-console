# ESP32 WebSocket Audio Client

This firmware turns your Seed Studio XIAO ESP32-S3 (or general ESP32 WROOM Dev module) device into a WebSocket audio client, enabling real-time full-duplex audio communication with the server hosted at `../backend`. It's designed to be used in interactive toys or devices to converse with your personal AI characters.

## Pin Configuration

<!-- ### For Seeed Studio XIAO ESP32S3 -->

| **Component**              | **Seeed Studio XIAO ESP32S3** | **General ESP32 Dev Board** |
| -------------------------- | ----------------------------- | --------------------------- |
| **I2S Input (Microphone)** |                               |                             |
| SD                         | D9                            | GPIO 13                     |
| WS                         | D7                            | GPIO 5                      |
| SCK                        | GD8                           | GPIO 18                     |
| **I2S Output (Speaker)**   |                               |                             |
| WS                         | D0                            | GPIO 32                     |
| BCK                        | D1                            | GPIO 33                     |
| DATA                       | D2                            | GPIO 25                     |
| SD (shutdown)              | D3                            | N/A                         |
| **Others**                 |                               |                             |
| LED                        | D4                            | GPIO 2                      |
| Button                     | D5                            | GPIO 26                     |

<!-- 
          I2S Input (Microphone)

          -   SD: D9
          -   WS: D7
          -   SCK: GD8

          I2S Output (Speaker with amp MAX98357A)

          -   WS: D0
          -   BCK: D1
          -   DATA: D2
          -   SD: D3 (shutdown)

          Other

          -   LED: D4
          -   Button: D5

### For a general ESP32 dev board

          I2S Input (Microphone)

          -   SD: GPIO 13
          -   WS: GPIO 5
          -   SCK: GPIO 18

          I2S Output (Speaker)

          -   WS: GPIO 32
          -   BCK: GPIO 33
          -   DATA: GPIO 25

          Other

          -   LED: GPIO 2
          -   Button: GPIO 26 -->

## Firmware burning with PlatformIO

1. Install PlatformIO IDE (Visual Studio Code extension) if you haven't already.

2. Create a new PlatformIO project:

    - Open PlatformIO Home
    - Click "New Project"
    - Name your project (e.g., "FullDuplexWebSocketAudio")
    - Select "Espressif ESP32 Dev Module" as the board
    - Choose "Arduino" as the framework
    - Select a location for your project

3. Replace the contents of `src/main.cpp` with the provided ESP32 WebSocket Audio Client code.

4. Add the required libraries to your `platformio.ini` file:

   - For Seeed Studio XIAO ESP32S3

       ```ini
       [env:seeed_xiao_esp32s3]
       platform = espressif32
       board = seeed_xiao_esp32s3
       framework = arduino
       monitor_speed = 115200
       lib_deps =
           https://github.com/tzapu/WiFiManager.git
           gilmaimon/ArduinoWebsockets@^0.5.4
           bblanchon/ArduinoJson@^7.1.0
       ```

   - For a general ESP32 Dev board
       ```ini
       [env:esp32dev]
       platform = espressif32
       board = esp32dev
       framework = arduino
       monitor_speed = 115200
       lib_deps =
           https://github.com/tzapu/WiFiManager.git
           gilmaimon/ArduinoWebsockets @ ^0.5.3
           bblanchon/ArduinoJson @ ^7.1.0
       ```
       
5. Update the WebSocket server details in the code:

    - Find the following lines in the code and update them with your information:
        ```cpp
        const char *websocket_server_host = "<your-server-host>"; // this is your WiFi I.P. Address
        const uint16_t websocket_server_port = 8000;
        const char *websocket_server_path = "/Elato";
        const char *auth_token = "<your-auth-token-here>"; // generate auth-token in your Elato web-app in Settings
        ```

6. Build the project:

    - Click the "PlatformIO: Build" button in the PlatformIO toolbar or run the build task.

7. Upload the firmware:

    - Connect your ESP32 to your computer.
    - Click the "PlatformIO: Upload" button or run the upload task.

8. Monitor the device:

    - Open the Serial Monitor to view debug output and device status.
    - You can do this by clicking the "PlatformIO: Serial Monitor" button or running the monitor task.

9. Connect to WiFi using the WiFi Captive portal
    - It is straightforward to connect to your local Wifi network with an SSID (WiFi name) and Password.
    - Once the device is on, it acts as an Access Point to connect to a known WiFi network.
    - Find the device name "Elato device" in your list of local wifi networks.
    - Press "Configure Wifi" and type in your SSID and PW for your Wifi and connect.
    - The Seeed Stuido XIAO ESP32S3 should then automatically connect to your Wifi and save your Wifi details.

## Usage

1. Power on the ESP32 device.
2. The device will automatically connect to the WiFi network as set on the Captive portal.
3. Press the button to initiate a full-duplex WebSocket connection to the server.
4. The LED indicates the current status:

    - Off: Not connected
    - Solid On: Connected and listening on microphone
    - Pulsing: Streaming audio output (receiving from server)

5. Speak into the microphone to send audio to the server.
6. The device will play audio received from the server through the speaker.

<!-- ## Features -->

<!-- -   Real-time audio streaming using WebSocket
-   Full-duplex I2S audio input (microphone) and I2S audio output (speaker)
-   WiFi connectivity
-   LED status indicator -->
<!-- -   Button interrupt for connection management -->

<!-- ## Hardware Requirements

-   ESP32 development board
-   INMP441 MEMS microphone (I2S input)
-   MAX98357A amplifier (I2S output)
-   LED (for status indication)
-   Push button (for connection control)
-   USB Type-C or Micro USB power cable -->


## Functions

-   `micTask`: Handles audio input from the microphone
-   `buttonTask`: Manages button presses for connection control
-   `ledControlTask`: Controls the LED status indicator
-   `handleTextMessage`: Processes text messages from the server
-   `handleBinaryAudio`: Processes binary audio data from the server

## Customization

You can modify the following parameters in the code:

<!-- -   Audio sample rate (`SAMPLE_RATE`) -->
-   Buffer sizes (`bufferCnt`, `bufferLen`)
<!-- -   LED brightness levels (`MIN_BRIGHTNESS`, `MAX_BRIGHTNESS`) -->
-   Debounce time for the button (`DEBOUNCE_TIME`)

## Troubleshooting

-   If you experience connection issues, check your WiFi credentials and server details.
-   Ensure all required libraries are installed and up to date.
-   Verify that the pin configuration matches your hardware setup.

## Contributing

Feel free to submit issues or pull requests to improve this firmware.
