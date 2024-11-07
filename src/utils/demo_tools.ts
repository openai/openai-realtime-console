export const weather_tool_definition =  {
    name: 'get_weather',
    description:
        'Retrieves the weather for a given lat, lng coordinate pair. Specify a label for the location.',
    parameters: {
        type: 'object',
        properties: {
        lat: {
            type: 'number',
            description: 'Latitude',
        },
        lng: {
            type: 'number',
            description: 'Longitude',
        },
        location: {
            type: 'string',
            description: 'Name of the location',
        },
        },
        required: ['lat', 'lng', 'location'],
    },
}

export const weather_tool_hander =  async ({ lat, lng, location, setMarker, setCoords }: { [key: string]: any }) => {
    setMarker({ lat, lng, location });
    setCoords({ lat, lng, location });
    const result = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m`
    );
    const json = await result.json();
    const temperature = {
      value: json.current.temperature_2m as number,
      units: json.current_units.temperature_2m as string,
    };
    const wind_speed = {
      value: json.current.wind_speed_10m as number,
      units: json.current_units.wind_speed_10m as string,
    };
    setMarker({ lat, lng, location, temperature, wind_speed });
    return json;
  }


  export const memory_tool_definition =  {
    name: 'set_memory',
    description: 'Saves important data about the user into memory.',
    parameters: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description:
            'The key of the memory value. Always use lowercase and underscores, no other characters.',
        },
        value: {
          type: 'string',
          description: 'Value can be anything represented as a string',
        },
      },
      required: ['key', 'value'],
    },
  }
