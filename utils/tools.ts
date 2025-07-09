import * as Battery from "expo-battery";
import * as Brightness from "expo-brightness";

const clientToolsSchema = [
  {
    type: "function",
    name: "getBatteryLevel",
    description: "Gets the device battery level as decimal point percentage.",
  },
  {
    type: "function",
    name: "changeBrightness",
    description: "Changes the brightness of the device screen.",
    parameters: {
      type: "object",
      properties: {
        brightness: {
          type: "number",
          description:
            "A number between 0 and 1, inclusive, representing the desired screen brightness.",
        },
      },
    },
  },
  {
    type: "function",
    name: "flashScreen",
    description: "Quickly flashes the screen on and off.",
  },
];

const clientTools: Record<string, any> = {
  getBatteryLevel: async () => {
    const batteryLevel = await Battery.getBatteryLevelAsync();
    if (batteryLevel === -1) {
      return {
        success: false,
        error: "Device does not support retrieving the battery level.",
      };
    }
    return { success: true, batteryLevel };
  },
  changeBrightness: ({ brightness }: { brightness: number }) => {
    Brightness.setSystemBrightnessAsync(brightness);
    return { success: true, brightness };
  },
  flashScreen: () => {
    Brightness.setSystemBrightnessAsync(1);
    setTimeout(() => {
      Brightness.setSystemBrightnessAsync(0);
    }, 200);
    return { success: true };
  },
};

export { clientTools, clientToolsSchema };
