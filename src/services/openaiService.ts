import OpenAI from 'openai';
import axios from 'axios';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

const unsplashAccessKey = process.env.REACT_APP_UNSPLASH_ACCESS_KEY;

export const getSuggestedLocations = async (locationDescription: string) => {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a helpful assistant that suggests locations in France based on descriptions. 
        Always respond with a JSON array of objects. Each object should have the following structure:
        {
          "name": "string",
          "description": "string"
        }
        And the JSON array should be wrapped in an object with a 'suggestions' key.
        Provide exactly 4 suggestions.`,
      },
      {
        role: 'user',
        content: `Suggest 4 locations in France that match this description: ${locationDescription}.`,
      },
    ],
    response_format: { type: 'json_object' },
  });

  const locations = JSON.parse(
    response.choices[0].message.content || '{}'
  )?.suggestions;

  // Fetch images for each location
  for (let location of locations) {
    try {
      const imageResponse = await axios.get(
        `https://api.unsplash.com/search/photos`,
        {
          params: {
            query: `${location.name} France`,
            per_page: 1,
          },
          headers: {
            Authorization: `Client-ID ${unsplashAccessKey}`,
          },
        }
      );

      if (imageResponse.data.results && imageResponse.data.results.length > 0) {
        location.image_url = imageResponse.data.results[0].urls.regular;
      } else {
        location.image_url = '/city.webp';
      }
    } catch (error) {
      console.error('Error fetching image:', error);
      location.image_url = '/city.webp';
    }
  }

  return locations;
};

export const getSuggestedThemes = async (locations: string[]) => {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a helpful assistant that suggests travel themes based on locations in France.
        Always respond with a JSON array of objects. Each object should have the following structure:
        {
          "emoji": "string",
          "name": "string",
          "description": "string"
        }
        And the JSON array should be wrapped in an object with a 'themes' key.
        Provide at least 5 suggestions.`,
      },
      {
        role: 'user',
        content: `Suggest at least 5 travel themes that would be suitable for these locations: ${locations.join(
          ', '
        )}. Return the result as a JSON array of strings.`,
      },
    ],
    response_format: { type: 'json_object' },
  });

  const themes = JSON.parse(
    response.choices[0].message.content || '{}'
  )?.themes;
  return themes;
};

export const getSuggestedActivities = async (
  location: string,
  themes: string[]
) => {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a helpful assistant that suggests activities based on a location and themes in France.
        Always respond with a JSON array of objects. Each object should have the following structure:
        {
          "name": "string",
          "description": "string"
        }
        Provide at least 5 suggestions.`,
      },
      {
        role: 'user',
        content: `Suggest at least 5 activities in ${location} related to these themes: ${themes.join(
          ', '
        )}. Return the result as a JSON array of objects with 'name' and 'description' properties. Do not include any code formatting, just send the plain JSON.`,
      },
    ],
    response_format: { type: 'json_object' },
  });

  return JSON.parse(response.choices[0].message.content || '{}')?.suggestions;
};

export const getAreaCoordinates = async (location: string) => {
  console.log('location', location);
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a helpful assistant that provides coordinates for a location in France.
        Always respond with a JSON object that has 'latitude' and 'longitude' properties.`,
      },
      {
        role: 'user',
        content: `What are the coordinates for ${location} in France?`,
      },
    ],
    response_format: { type: 'json_object' },
  });
  const { content } = response.choices[0].message;
  const coordinates = JSON.parse(content || '{}');
  console.log('Coordinates:', coordinates);
  return coordinates;
};