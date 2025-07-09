import * as Battery from 'expo-battery';
import * as Brightness from 'expo-brightness';
import { RealtimeTool } from '../types/realtime';

export const tools: RealtimeTool[] = [
  {
    type: 'function',
    name: 'getBatteryLevel',
    description: 'Gets the device battery level as decimal point percentage.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    type: 'function',
    name: 'changeBrightness',
    description: 'Changes the brightness of the device screen.',
    parameters: {
      type: 'object',
      properties: {
        brightness: {
          type: 'number',
          description: 'A number between 0 and 1, inclusive, representing the desired screen brightness.'
        }
      },
      required: ['brightness']
    }
  },
  {
    type: 'function',
    name: 'flashScreen',
    description: 'Quickly flashes the screen on and off.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  }
];

export const toolImplementations = {
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
  
  changeBrightness: async ({ brightness }: { brightness: number }) => {
    await Brightness.setSystemBrightnessAsync(brightness);
    return { success: true, brightness };
  },
  
  flashScreen: async () => {
    await Brightness.setSystemBrightnessAsync(1);
    setTimeout(() => {
      Brightness.setSystemBrightnessAsync(0.5);
    }, 200);
    return { success: true };
  },
};

export type ToolImplementations = typeof toolImplementations;